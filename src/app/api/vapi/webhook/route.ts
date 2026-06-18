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

        // --- ASSISTANT REQUEST ---
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
        // Per Vapi docs: transcript and messages are under artifact,
        // summary is under analysis.summary, duration = endedAt - startedAt
        const artifact = message?.artifact || body?.artifact
        const transcript = message?.artifact?.transcript || message?.transcript || body?.transcript
        const summary = message?.analysis?.summary || message?.summary || body?.summary
        const phoneNumberId = call?.phoneNumberId

        if (!phoneNumberId) return NextResponse.json({ received: true })

        const { data: business } = await supabase
            .from("businesses")
            .select("id, name, ai_name")
            .eq("vapi_phone_id", phoneNumberId)
            .single()

        if (!business) return NextResponse.json({ received: true })

        // Duration: startedAt/endedAt are null in the webhook payload (known Vapi issue).
        // Fetch the full call object from Vapi API to get accurate duration.
        let duration = 0
        if (call?.id) {
            try {
                const vapiCallRes = await fetch(`https://api.vapi.ai/call/${call.id}`, {
                    headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
                })
                if (vapiCallRes.ok) {
                    const vapiCall = await vapiCallRes.json()
                    if (vapiCall.startedAt && vapiCall.endedAt) {
                        duration = Math.round(
                            (new Date(vapiCall.endedAt).getTime() - new Date(vapiCall.startedAt).getTime()) / 1000
                        )
                    }
                }
            } catch (err) {
                console.error("Failed to fetch call duration from Vapi:", err)
            }
        }

        const callerName = extractCallerName(summary, transcript)
        const reason = extractReason(summary)
        const isUrgent = detectUrgency(transcript, summary)
        const appointmentBooked = detectBooking(summary)

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

        // FIX 3: Appointment date extraction now returns a real YYYY-MM-DD string
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

function extractCallerName(summary: string, transcript: string): string {
    // Try summary first with broader patterns
    if (summary) {
        const patterns = [
            /(?:caller(?:'s)? name is|my name is|this is|name[:\s]+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
            /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:called|is calling|wants to book|would like)/i,
        ]
        for (const p of patterns) {
            const m = summary.match(p)
            if (m?.[1] && m[1].length > 1) return m[1]
        }
    }
    // Fall back to transcript
    if (transcript) {
        const m = transcript.match(/(?:my name is|this is|I'm|I am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
        if (m?.[1]) return m[1]
    }
    return "Unknown caller"
}

// FIX 4: Better reason extraction — use the summary directly, trimmed,
// rather than trying to regex a fragment out of it.
function extractReason(summary: string): string {
    if (!summary) return "No reason provided"
    // Take first 2 sentences of summary as the reason — it's already concise
    const sentences = summary.match(/[^.!?]+[.!?]+/g) || []
    if (sentences.length >= 2) return sentences.slice(0, 2).join(" ").trim()
    if (sentences.length === 1) return sentences[0].trim()
    return summary.slice(0, 150).trim()
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
    const bookingWords = ["booked", "scheduled", "appointment confirmed", "set for", "confirmed for", "appointment for"]
    return bookingWords.some(w => text.includes(w))
}

// FIX 3: Resolve natural language dates to real YYYY-MM-DD strings
// so the appointments table stores queryable dates, not "thursday"
function extractAppointment(summary: string): {
    date: string; time: string; type: string
} | null {
    if (!summary) return null

    const timeMatch = summary.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm)/i)
    const typeMatch = summary.match(
        /(?:consultation|appointment|checkup|check-up|follow-up|viewing|estimate|reservation|service|visit)/i
    )

    // Try to resolve a named day to a real date
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayMatch = summary.match(
        /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
    )

    // Try explicit date like "June 20th" or "June 20"
    const explicitDateMatch = summary.match(
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
    )

    let resolvedDate = new Date().toISOString().split("T")[0]

    if (explicitDateMatch) {
        const monthStr = explicitDateMatch[1]
        const day = parseInt(explicitDateMatch[2])
        const months: Record<string, number> = {
            january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
            july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
        }
        const month = months[monthStr.toLowerCase()]
        const year = new Date().getFullYear()
        const candidate = new Date(year, month, day)
        // If date already passed this year, use next year
        if (candidate < new Date()) candidate.setFullYear(year + 1)
        resolvedDate = candidate.toISOString().split("T")[0]
    } else if (dayMatch) {
        const targetDay = dayNames.indexOf(dayMatch[1].toLowerCase())
        const today = new Date()
        const currentDay = today.getDay()
        let daysUntil = targetDay - currentDay
        if (daysUntil <= 0) daysUntil += 7 // always next occurrence
        const target = new Date(today)
        target.setDate(today.getDate() + daysUntil)
        resolvedDate = target.toISOString().split("T")[0]
    } else if (/\btoday\b/i.test(summary)) {
        resolvedDate = new Date().toISOString().split("T")[0]
    } else if (/\btomorrow\b/i.test(summary)) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        resolvedDate = tomorrow.toISOString().split("T")[0]
    } else if (!timeMatch) {
        // No date and no time — not enough info to save an appointment
        return null
    }

    return {
        date: resolvedDate,
        time: timeMatch?.[0] || "12:00 PM",
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
        const msg = `${emoji} — ${businessName}\nCaller: ${callerName}\nReason: ${reason}\n${appointmentBooked ? "Appointment booked ✓" : "No appointment booked"}`

        await twilio.messages.create({
            body: msg,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: ownerPhone,
        })
    } catch (err) {
        console.error("SMS error:", err)
    }
}