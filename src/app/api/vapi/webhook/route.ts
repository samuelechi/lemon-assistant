import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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
            ? `${plan} plan limit of ${limit} minutes reached`
            : `Trial limit of ${limit} minutes reached`
        return { allowed: false, reason }
    }

    return { allowed: true }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const message = body?.message || body
        const type = message?.type

        console.log("=== VAPI WEBHOOK ===")
        console.log("Message type:", type)
        console.log("====================")

        // --- ASSISTANT REQUEST: gate calls before they start ---
        if (type === "assistant-request") {
            const phoneNumberId = message?.call?.phoneNumberId

            if (!phoneNumberId) {
                return NextResponse.json({
                    error: {
                        type: "voice-request-url-error",
                        msg: "Unable to identify your business. Please contact support.",
                    }
                })
            }

            const { data: business } = await supabase
                .from("businesses")
                .select("id, vapi_assistant_id")
                .eq("vapi_phone_id", phoneNumberId)
                .single()

            if (!business || !business.vapi_assistant_id) {
                return NextResponse.json({
                    error: {
                        type: "voice-request-url-error",
                        msg: "This service is not currently available. Please contact the business directly.",
                    }
                })
            }

            // Check minute limit
            const { allowed, reason } = await checkMinuteLimit(business.id)

            if (!allowed) {
                console.log("Call rejected — minute limit reached:", reason)
                return NextResponse.json({
                    error: {
                        type: "voice-request-url-error",
                        msg: "This service is temporarily unavailable. Please contact the business directly to book an appointment.",
                    }
                })
            }

            // All good — return the assistant ID
            console.log("Call approved for business:", business.id)
            return NextResponse.json({
                assistantId: business.vapi_assistant_id,
            })
        }

        // --- END OF CALL REPORT ---
        if (type !== "end-of-call-report") {
            return NextResponse.json({ received: true })
        }

        const call = message?.call || body?.call
        const transcript = message?.transcript || body?.transcript
        const summary = message?.summary || body?.summary
        const phoneNumberId = call?.phoneNumberId

        if (!phoneNumberId) return NextResponse.json({ received: true })

        const { data: business } = await supabase
            .from("businesses")
            .select("id, name, ai_name")
            .eq("vapi_phone_id", phoneNumberId)
            .single()

        if (!business) return NextResponse.json({ received: true })

        const callerName = extractCallerName(summary)
        const reason = extractReason(summary)
        const isUrgent = detectUrgency(transcript, summary)
        const appointmentBooked = detectBooking(summary)
        const duration = Math.round((call?.endedAt
            ? new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()
            : 0) / 1000)

        const { data: savedCall } = await supabase
            .from("calls")
            .insert({
                business_id: business.id,
                caller_number: call?.customer?.number || "Unknown",
                caller_name: callerName,
                reason,
                duration_seconds: duration,
                status: appointmentBooked ? "booked" : isUrgent ? "urgent" : "completed",
                urgent: isUrgent,
                appointment_booked: appointmentBooked,
                summary,
                transcript,
            })
            .select()
            .single()

        if (appointmentBooked && savedCall) {
            const appointment = extractAppointment(summary)
            if (appointment) {
                await supabase.from("appointments").insert({
                    business_id: business.id,
                    call_id: savedCall.id,
                    caller_name: callerName || "Unknown",
                    caller_phone: call?.customer?.number || "",
                    date: appointment.date,
                    time: appointment.time,
                    type: appointment.type || "Appointment",
                    status: "confirmed",
                })
            }
        }

        await sendOwnerSummary({
            businessId: business.id,
            businessName: business.name,
            callerName,
            reason,
            isUrgent,
            appointmentBooked,
            summary,
        })

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Webhook error:", err)
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
    }
}

// --- HELPERS ---

function extractCallerName(summary: string): string {
    if (!summary) return "Unknown caller"
    const match = summary.match(/(?:caller|name|customer)\s+(?:is\s+|was\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    return match?.[1] || "Unknown caller"
}

function extractReason(summary: string): string {
    if (!summary) return "No reason provided"
    const match = summary.match(/(?:calling about|reason|called for|wanted to|needed)\s+(.+?)(?:\.|,|$)/i)
    return match?.[1] || summary.slice(0, 100)
}

function detectUrgency(transcript: string, summary: string): boolean {
    const text = `${transcript} ${summary}`.toLowerCase()
    const urgentWords = [
        "urgent", "emergency", "immediately", "asap", "right away",
        "chest pain", "can't breathe", "severe", "accident", "help"
    ]
    return urgentWords.some(w => text.includes(w))
}

function detectBooking(summary: string): boolean {
    if (!summary) return false
    const text = summary.toLowerCase()
    const bookingWords = ["booked", "scheduled", "appointment confirmed", "set for", "confirmed for"]
    return bookingWords.some(w => text.includes(w))
}

function extractAppointment(summary: string): {
    date: string; time: string; type: string
} | null {
    if (!summary) return null
    const dateMatch = summary.match(
        /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|\w+ \d+(?:st|nd|rd|th)?)/i
    )
    const timeMatch = summary.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm)/i)
    const typeMatch = summary.match(
        /(?:consultation|appointment|checkup|follow-up|viewing|estimate|reservation|service)/i
    )

    if (!dateMatch && !timeMatch) return null

    return {
        date: dateMatch?.[0] || new Date().toISOString().split("T")[0],
        time: timeMatch?.[0] || "12:00",
        type: typeMatch?.[0] || "Appointment",
    }
}

async function sendOwnerSummary({
    businessId,
    businessName,
    callerName,
    reason,
    isUrgent,
    appointmentBooked,
}: {
    businessId: string
    businessName: string
    callerName: string
    reason: string
    isUrgent: boolean
    appointmentBooked: boolean
    summary: string
}) {
    try {
        const { data: profile } = await supabase
            .from("businesses")
            .select("user_id")
            .eq("id", businessId)
            .single()

        if (!profile) return

        const { data: user } = await supabase.auth.admin.getUserById(profile.user_id)
        const ownerPhone = user?.user?.phone
        if (!ownerPhone) return

        const twilio = require("twilio")(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        )

        const emoji = isUrgent ? "⚠️ URGENT" : appointmentBooked ? "✅ Booked" : "📞 Call"
        const message = `${emoji} — ${businessName}\nCaller: ${callerName}\nReason: ${reason}\n${appointmentBooked ? "Appointment booked ✓" : "No appointment booked"}`

        await twilio.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: ownerPhone,
        })
    } catch (err) {
        console.error("SMS error:", err)
    }
}