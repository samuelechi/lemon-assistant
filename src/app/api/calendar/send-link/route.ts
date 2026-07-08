import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createCalendlySchedulingLink } from "@/lib/calendly"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Same trial/paid minute check as availability + book routes. Kept in sync
// manually across all three tool routes — see webhook/route.ts for the
// canonical version.
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

    const planLimits: Record<string, number> = { growth: 250, pro: 600, trial: 13 }
    const isActive = sub?.status === "active"
    const plan = isActive ? sub!.plan : "trial"
    const limit = planLimits[plan] ?? 13

    let query = supabase.from("calls").select("duration_seconds").eq("business_id", businessId)
    if (isActive) {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        query = query.gte("created_at", startOfMonth)
    }
    const { data: calls } = await query
    const minutesUsed = Math.round((calls || []).reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60)

    if (minutesUsed >= limit) {
        return { allowed: false, reason: isActive ? `${plan} plan minutes used up.` : "Trial minutes used up." }
    }
    return { allowed: true }
}

function toE164(raw: unknown): string {
    if (!raw) return ""
    const s = String(raw).trim()
    if (s.startsWith("+")) return s.replace(/[^\d+]/g, "")
    const d = s.replace(/\D/g, "")
    if (d.length === 10) return `+1${d}`
    if (d.length === 11 && d.startsWith("1")) return `+${d}`
    return d ? `+${d}` : ""
}

async function sendLinkSms(toNumber: string, businessName: string, time: string, link: string) {
    const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const msg = `Hi! To confirm your ${time} appointment with ${businessName}, tap this link to book your spot: ${link}`
    await twilio.messages.create({ body: msg, from: process.env.TWILIO_PHONE_NUMBER, to: toNumber })
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
        const { callerPhone, time } = args ?? {}

        const inboundNumber = body?.message?.call?.customer?.number || body?.message?.customer?.number || ""
        const resolvedPhone = toE164(callerPhone) || inboundNumber

        if (!businessId || !resolvedPhone) {
            return NextResponse.json({
                results: [{ toolCallId, result: "I need a phone number to text the booking link to." }]
            })
        }

        const { allowed } = await checkMinuteLimit(businessId)
        if (!allowed) {
            return NextResponse.json({
                results: [{ toolCallId, result: "This service is temporarily unavailable. Please contact the business directly." }]
            })
        }

        const { data: business } = await supabase
            .from("businesses")
            .select("name, calendly_token, calendly_event_type_uri")
            .eq("id", businessId)
            .single()

        if (!business?.calendly_token || !business?.calendly_event_type_uri) {
            return NextResponse.json({
                results: [{ toolCallId, result: "Booking link is not set up for this business yet. Please contact them directly." }]
            })
        }

        const link = await createCalendlySchedulingLink(business.calendly_token, business.calendly_event_type_uri)

        if (!link) {
            return NextResponse.json({
                results: [{ toolCallId, result: "I couldn't generate a booking link right now. Please contact the business directly." }]
            })
        }

        await sendLinkSms(resolvedPhone, business.name, time || "your requested time", link)

        return NextResponse.json({
            results: [{
                toolCallId,
                result: `I've texted a booking link to confirm your ${time || "appointment"}. Please tap the link to lock in your spot.`
            }]
        })
    } catch (err) {
        console.error("Send booking link error:", err)
        return NextResponse.json({
            results: [{ toolCallId: "", result: "Failed to send the booking link. Please try again." }]
        })
    }
}