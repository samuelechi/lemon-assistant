import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createGoogleCalendarEvent } from "@/lib/google-calendar"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    const plan = sub?.status === "active" ? sub.plan : "trial"
    const limit = planLimits[plan] ?? 13

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const { data: calls } = await supabase
        .from("calls")
        .select("duration_seconds")
        .eq("business_id", businessId)
        .gte("created_at", startOfMonth)

    const minutesUsed = Math.round(
        (calls || []).reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60
    )

    if (minutesUsed >= limit) {
        const reason = sub?.status === "active"
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
        const { callerName, callerPhone, date, time, type } = args ?? {}

        console.log("BOOK:", { businessId, callerName, date, time, toolCallId })

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

        const { data: appointment, error } = await supabase
            .from("appointments")
            .insert({
                business_id: businessId,
                caller_name: callerName,
                caller_phone: callerPhone || "",
                date,
                time,
                type: type || "Appointment",
                status: "confirmed",
            })
            .select()
            .single()

        if (error) throw error

        if (business.calendar_type === "google" && business.calendar_token) {
            await createGoogleCalendarEvent(businessId, {
                callerName,
                callerPhone: callerPhone || "",
                date,
                time,
                type: type || "Appointment",
                duration: business.meeting_duration || 30,
                businessName: business.name,
            })
        }

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