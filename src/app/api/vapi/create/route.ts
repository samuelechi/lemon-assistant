import { NextRequest, NextResponse } from "next/server"
import { createVapiAssistant, createVapiPhoneNumber } from "@/lib/vapi"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const {
            businessName, aiName, businessType,
            hoursStart, hoursEnd, workingDays,
            meetingTypes, meetingDuration, about,
        } = body

        // Get business ID
        const { data: business } = await supabase
            .from("businesses")
            .select("id")
            .eq("user_id", user.id)
            .single()

        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 })

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

        // Create Vapi assistant with calendar tools
        const assistant = await createVapiAssistant({
            businessName, aiName, businessType,
            hoursStart, hoursEnd, workingDays,
            meetingTypes, meetingDuration, about,
            businessId: business.id,
            appUrl,
        })

        // Create phone number
        const phoneNumber = await createVapiPhoneNumber(assistant.id)

        // Save to Supabase
        await supabase
            .from("businesses")
            .update({
                vapi_assistant_id: assistant.id,
                vapi_phone_id: phoneNumber.id,
                phone_number: phoneNumber.number,
            })
            .eq("user_id", user.id)

        return NextResponse.json({
            assistantId: assistant.id,
            phoneNumber: phoneNumber.number,
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong"
        console.error("Vapi create error:", message, err)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}