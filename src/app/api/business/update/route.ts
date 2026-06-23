import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { updateVapiAssistant } from "@/lib/vapi"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const {
            ai_name, ai_greeting, name, type, about,
            hours_start, hours_end, notification_phone,
            voice_id, language, review_url,
        } = body

        // Normalize notification number to E.164
        let normalizedPhone: string | undefined
        if (notification_phone !== undefined) {
            const raw = String(notification_phone).trim()
            if (raw === "") {
                normalizedPhone = ""
            } else if (raw.startsWith("+")) {
                normalizedPhone = raw.replace(/[^\d+]/g, "")
            } else {
                const digits = raw.replace(/\D/g, "")
                if (digits.length === 10) normalizedPhone = `+1${digits}`
                else if (digits.length === 11 && digits.startsWith("1")) normalizedPhone = `+${digits}`
                else normalizedPhone = `+${digits}`
            }
        }

        // Pro-gate voice_id, language, review_url
        if (voice_id !== undefined || language !== undefined || review_url !== undefined) {
            const { data: sub } = await supabase
                .from("subscriptions")
                .select("plan, status")
                .eq("user_id", user.id)
                .single()

            const isPro = sub?.status === "active" && sub?.plan === "pro"
            if (!isPro) {
                return NextResponse.json({ error: "This feature requires a Pro plan" }, { status: 403 })
            }
        }

        const { data: business } = await supabase
            .from("businesses")
            .select(
                "id, vapi_assistant_id, name, ai_name, type, about, hours_start, hours_end, working_days, meeting_types, meeting_duration, voice_id, language, review_url"
            )
            .eq("user_id", user.id)
            .single()

        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 })

        // Build DB update payload
        const dbUpdate: Record<string, unknown> = {}
        if (ai_name !== undefined) dbUpdate.ai_name = ai_name
        if (ai_greeting !== undefined) dbUpdate.ai_greeting = ai_greeting
        if (name !== undefined) dbUpdate.name = name
        if (type !== undefined) dbUpdate.type = type
        if (about !== undefined) dbUpdate.about = about
        if (hours_start !== undefined) dbUpdate.hours_start = hours_start
        if (hours_end !== undefined) dbUpdate.hours_end = hours_end
        if (normalizedPhone !== undefined) dbUpdate.notification_phone = normalizedPhone
        if (voice_id !== undefined) dbUpdate.voice_id = voice_id
        if (language !== undefined) dbUpdate.language = language
        if (review_url !== undefined) dbUpdate.review_url = review_url

        await supabase.from("businesses").update(dbUpdate).eq("id", business.id)

        // Patch Vapi assistant with merged config
        if (business.vapi_assistant_id) {
            await updateVapiAssistant(business.vapi_assistant_id, {
                businessName: name ?? business.name,
                aiName: ai_name ?? business.ai_name,
                businessType: type ?? business.type,
                hoursStart: hours_start ?? business.hours_start,
                hoursEnd: hours_end ?? business.hours_end,
                workingDays: business.working_days,
                meetingTypes: business.meeting_types,
                meetingDuration: business.meeting_duration,
                about: about ?? business.about,
                businessId: business.id,
                appUrl: process.env.NEXT_PUBLIC_APP_URL,
                voiceId: (voice_id ?? business.voice_id) ?? undefined,
                language: (language ?? business.language) ?? undefined,
                reviewUrl: (review_url ?? business.review_url) ?? undefined,
            })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("POST /api/business/update error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}