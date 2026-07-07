import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createGoogleCalendarEvent } from "@/lib/google-calendar"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// The Vapi assistant doesn't inherently know today's date, so it sometimes
// fills in a past year (e.g. "2024-08-15"). Roll any past date forward to the
// next occurrence of that month/day so a booking never lands in the past.
// This is a safety net — the real fix is giving the assistant the current date
// in its system prompt (see src/lib/vapi.ts).
function normalizeFutureDate(dateStr: string): string {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(dateStr).trim())
    if (!m) return dateStr
    let year = parseInt(m[1], 10)
    const month = parseInt(m[2], 10)
    const day = parseInt(m[3], 10)
    const now = new Date()
    const todayKey = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
    const keyFor = (y: number) => y * 10000 + month * 100 + day
    while (keyFor(year) < todayKey) year++
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

// Normalize a phone number to E.164 so Twilio accepts it.
function toE164(raw: unknown): string {
    if (!raw) return ""
    const s = String(raw).trim()
    if (s.startsWith("+")) return s.replace(/[^\d+]/g, "")
    const d = s.replace(/\D/g, "")
    if (d.length === 10) return `+1${d}`
    if (d.length === 11 && d.startsWith("1")) return `+${d}`
    return d ? `+${d}` : ""
}

// Text the caller a booking confirmation. Best-effort: failures are logged but
// never block the booking itself.
async function sendCallerConfirmation(opts: {
    toNumber: string
    callerName: string
    businessName: string
    date: string
    time: string
    type: string
}) {
    try {
        if (!opts.toNumber || !process.env.TWILIO_PHONE_NUMBER) return
        const twilio = require("twilio")(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        )
        const msg = `Hi ${opts.callerName}, your ${opts.type} with ${opts.businessName} is confirmed for ${opts.date} at ${opts.time}. See you then!`
        await twilio.messages.create({
            body: msg,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: opts.toNumber,
        })
    } catch (err) {
        console.error("Caller confirmation SMS error:", err)
    }
}

async function checkMinuteLimit(businessId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { data: business } = await supabase
        .from("businesses")
        .select("user_id")
        .eq("id", businessId)
        .single()

    if (!business) return { allowed: false, reason: "Business not found." }

    const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", business.user_id)
        .maybeSingle()

    const planLimits: Record<string, number> = {
        growth: 250,
        pro: 600,
        trial: 13,
    }

    const isActive = sub?.status === "active"
    const plan = isActive ? sub!.plan : "trial"
    const limit = planLimits[plan] ?? 13

    // Paid plans reset monthly. Trial is a lifetime cap — count all calls ever.
    let query = supabase
        .from("calls")
        .select("duration_seconds")
        .eq("business_id", businessId)

    if (isActive) {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        query = query.gte("created_at", startOfMonth)
    }

    const { data: calls } = await query

    const minutesUsed = Math.round(
        (calls || []).reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60
    )

    if (minutesUsed >= limit) {
        const reason = isActive
            ? `Your ${plan} plan's ${limit} minutes have been used for this month.`
            : `Your free trial of ${limit} minutes has been used.`
        return { allowed: false, reason }
    }

    return { allowed: true }
}

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get("businessId")

    try {
        const body = await req.json()

        const toolCall = body?.message?.toolCallList?.[0]
        const toolCallId = toolCall?.id ?? ""
        const rawArgs = toolCall?.function?.arguments
        const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs
        const { callerName, callerPhone, time, type } = args ?? {}
        const date = args?.date ? normalizeFutureDate(args.date) : args?.date

        // The caller's number: prefer one the AI collected, otherwise fall back
        // to the inbound caller ID Vapi provides — so we can text a confirmation
        // even when the assistant never asks for a number.
        const inboundNumber = body?.message?.call?.customer?.number || body?.message?.customer?.number || ""
        const resolvedCallerPhone = toE164(callerPhone) || inboundNumber

        console.log("BOOK:", { businessId, callerName, rawDate: args?.date, date, time, resolvedCallerPhone, toolCallId })

        if (!businessId || !callerName || !date || !time) {
            return NextResponse.json({
                results: [{ toolCallId, result: "Missing required fields." }]
            })
        }

        // 🔒 Minute enforcement
        const { allowed, reason } = await checkMinuteLimit(businessId)
        if (!allowed) {
            console.log("Minute limit reached for business:", businessId, reason)
            return NextResponse.json({
                results: [{
                    toolCallId,
                    result: "I'm sorry, this service is temporarily unavailable. Please contact the business directly to book an appointment."
                }]
            })
        }

        const { data: existing } = await supabase
            .from("appointments")
            .select("id")
            .eq("business_id", businessId)
            .eq("date", date)
            .eq("time", time)
            .neq("status", "cancelled")
            .maybeSingle()

        if (existing) {
            return NextResponse.json({
                results: [{ toolCallId, result: "That time slot is already booked. Please check availability again." }]
            })
        }

        const { data: business } = await supabase
            .from("businesses")
            .select("name, meeting_duration, calendar_type, calendar_token")
            .eq("id", businessId)
            .single()

        if (!business) {
            return NextResponse.json({
                results: [{ toolCallId, result: "Business not found." }]
            })
        }

        const { error } = await supabase
            .from("appointments")
            .insert({
                business_id: businessId,
                caller_name: callerName,
                caller_phone: resolvedCallerPhone,
                date,
                time,
                type: type || "Appointment",
                status: "confirmed",
            })

        if (error) throw error

        if (business.calendar_type === "google" && business.calendar_token) {
            await createGoogleCalendarEvent(businessId, {
                callerName,
                callerPhone: resolvedCallerPhone,
                date,
                time,
                type: type || "Appointment",
                duration: business.meeting_duration || 30,
                businessName: business.name,
            })
        }

        // Text the caller their confirmation (best-effort; never blocks booking).
        await sendCallerConfirmation({
            toNumber: resolvedCallerPhone,
            callerName,
            businessName: business.name,
            date,
            time,
            type: type || "appointment",
        })

        return NextResponse.json({
            results: [{
                toolCallId,
                result: `Appointment confirmed! ${callerName} is booked for ${type || "an appointment"} on ${date} at ${time}.`
            }]
        })
    } catch (err) {
        console.error("Booking error:", err)
        return NextResponse.json({
            results: [{ toolCallId: "", result: "Failed to book the appointment. Please try again." }]
        })
    }
}