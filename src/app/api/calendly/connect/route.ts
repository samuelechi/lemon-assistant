import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { updateVapiAssistant } from "@/lib/vapi"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { token, eventTypeUri } = await req.json()
        if (!token || !eventTypeUri) {
            return NextResponse.json({ error: "Missing token or event type" }, { status: 400 })
        }

        const { data: business } = await supabase
            .from("businesses")
            .select("id, vapi_assistant_id, name, ai_name, type, about, hours_start, hours_end, working_days, meeting_types, meeting_duration, voice_id, language, review_url")
            .eq("user_id", user.id)
            .single()

        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 })

        await supabase
            .from("businesses")
            .update({
                calendar_type: "calendly",
                calendly_token: token,
                calendly_event_type_uri: eventTypeUri,
            })
            .eq("id", business.id)

        if (business.vapi_assistant_id) {
            await updateVapiAssistant(business.vapi_assistant_id, {
                businessName: business.name,
                aiName: business.ai_name,
                businessType: business.type,
                hoursStart: business.hours_start,
                hoursEnd: business.hours_end,
                workingDays: business.working_days,
                meetingTypes: business.meeting_types,
                meetingDuration: business.meeting_duration,
                about: business.about,
                businessId: business.id,
                appUrl: process.env.NEXT_PUBLIC_APP_URL,
                voiceId: business.voice_id ?? undefined,
                language: business.language ?? undefined,
                reviewUrl: business.review_url ?? undefined,
                calendarType: "calendly",
            })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Calendly connect error:", err)
        return NextResponse.json({ error: "Failed to connect Calendly" }, { status: 500 })
    }
}