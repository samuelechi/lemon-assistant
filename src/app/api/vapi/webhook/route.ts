import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type MinuteUsage = {
    userId: string
    plan: string
    isActive: boolean
    limit: number
    minutesUsed: number
    totalSeconds: number
}

// Single source of truth for "how many minutes has this business used this month".
// Both the live call gate and the usage-alert SMS read from this so their numbers agree.
async function getMinuteUsage(businessId: string): Promise<MinuteUsage | null> {
    const { data: business } = await supabase
        .from("businesses")
        .select("user_id")
        .eq("id", businessId)
        .single()

    if (!business) return null

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

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const { data: calls } = await supabase
        .from("calls")
        .select("duration_seconds")
        .eq("business_id", businessId)
        .gte("created_at", startOfMonth)

    const totalSeconds = (calls || []).reduce((sum, c) => sum + (c.duration_seconds || 0), 0)
    const minutesUsed = Math.round(totalSeconds / 60)

    return { userId: business.user_id, plan, isActive, limit, minutesUsed, totalSeconds }
}

async function checkMinuteLimit(businessId: string): Promise<{ allowed: boolean; reason?: string }> {
    const usage = await getMinuteUsage(businessId)
    if (!usage) return { allowed: false, reason: "Business not found." }

    if (usage.minutesUsed >= usage.limit) {
        const reason = usage.isActive
            ? `${usage.plan} plan limit of ${usage.limit} minutes reached`
            : `Trial limit of ${usage.limit} minutes reached`
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

        await supabase
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

        // NOTE: We intentionally do NOT create an appointment here. The
        // bookAppointment tool (src/app/api/calendar/book) is the single source
        // of truth — it runs during the call, reserves the slot, and creates the
        // calendar event. Parsing the summary here created a duplicate row, often
        // with a wrong date. The call is still flagged "booked" (above) and the
        // owner is notified below, so nothing is lost.

        await sendOwnerSummary({
            businessId: business.id,
            businessName: business.name,
            callerName,
            reason,
            isUrgent,
            appointmentBooked,
            summary,
        })

        // Usage alerts: warn the owner once when this call crosses 80% of their
        // limit, and once when it hits 100% (line now paused). We compare the
        // total before vs. after this call so each alert fires exactly once —
        // not on every subsequent call.
        if (duration > 0) {
            const usage = await getMinuteUsage(business.id)
            if (usage) {
                const prevMinutes = Math.round(Math.max(0, usage.totalSeconds - duration) / 60)
                const warnAt = Math.floor(usage.limit * 0.8)

                if (prevMinutes < usage.limit && usage.minutesUsed >= usage.limit) {
                    await sendUsageAlert(business.id, business.name, "reached", usage)
                } else if (prevMinutes < warnAt && usage.minutesUsed >= warnAt) {
                    await sendUsageAlert(business.id, business.name, "warning", usage)
                }
            }
        }

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

// Text the owner when they approach ("warning") or exhaust ("reached") their
// monthly minutes, so a paused line is never a surprise.
async function sendUsageAlert(
    businessId: string,
    businessName: string,
    kind: "warning" | "reached",
    usage: MinuteUsage,
) {
    try {
        const { data: user } = await supabase.auth.admin.getUserById(usage.userId)
        const ownerPhone = user?.user?.phone
        if (!ownerPhone) return

        const twilio = require("twilio")(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        )

        const remaining = Math.max(0, usage.limit - usage.minutesUsed)
        const isTrial = !usage.isActive

        let msg: string
        if (kind === "reached") {
            msg = isTrial
                ? `⛔ ${businessName} — your ${usage.limit}-minute free trial is used up and your AI line is now paused. Upgrade to keep receiving calls.`
                : `⛔ ${businessName} — you've used all ${usage.limit} minutes on your ${usage.plan} plan this month. Your AI line is paused until your next billing cycle or an upgrade.`
        } else {
            msg = isTrial
                ? `⚠️ ${businessName} — you've used ${usage.minutesUsed} of your ${usage.limit} free trial minutes (${remaining} left). Upgrade soon so your AI line doesn't pause.`
                : `⚠️ ${businessName} — you've used ${usage.minutesUsed} of ${usage.limit} minutes on your ${usage.plan} plan (${remaining} left this month).`
        }

        await twilio.messages.create({
            body: msg,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: ownerPhone,
        })
    } catch (err) {
        console.error("Usage alert SMS error:", err)
    }
}