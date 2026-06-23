import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const businessId = req.nextUrl.searchParams.get("businessId")
        if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 })

        const body = await req.json()

        // Vapi tool call arguments arrive as a JSON string
        const toolCall = body?.message?.toolCalls?.[0] ?? body?.toolCall ?? body?.message?.toolCall
        const toolCallId = toolCall?.id ?? body?.message?.toolCallList?.[0]?.id
        const rawArgs = toolCall?.function?.arguments
        const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs ?? {}

        const callerPhone: string | undefined = args?.callerPhone

        const { data: business } = await supabase
            .from("businesses")
            .select("name, review_url, notification_phone")
            .eq("id", businessId)
            .single()

        if (!business?.review_url) {
            return NextResponse.json({
                results: [{ toolCallId, result: "Review link not configured for this business." }],
            })
        }

        const toPhone = callerPhone || null

        if (toPhone) {
            try {
                const twilio = require("twilio")(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                )
                await twilio.messages.create({
                    body: `Thanks for choosing ${business.name}! We'd love your feedback — leave us a review here: ${business.review_url}`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: toPhone,
                })
                console.log("Review SMS sent to", toPhone)
            } catch (err) {
                console.error("Review SMS error:", err)
            }
        }

        return NextResponse.json({
            results: [{ toolCallId, result: "Review link sent successfully." }],
        })
    } catch (err) {
        console.error("Review request error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}