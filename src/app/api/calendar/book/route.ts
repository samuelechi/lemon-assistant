import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createGoogleCalendarEvent } from "@/lib/google-calendar"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const businessId = searchParams.get("businessId")
        const { callerName, callerPhone, date, time, type } = await req.json()

        if (!businessId || !callerName || !date || !time) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Check slot is still available
        const { data: existing } = await supabase
            .from("appointments")
            .select("id")
            .eq("business_id", businessId)
            .eq("date", date)
            .eq("time", time)
            .neq("status", "cancelled")
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ error: "This slot is already booked" }, { status: 409 })
        }

        // Get business details
        const { data: business } = await supabase
            .from("businesses")
            .select("name, meeting_duration, calendar_type, calendar_token")
            .eq("id", businessId)
            .single()

        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 })

        // Book in our database
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

        // Also create Google Calendar event if connected
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

        return NextResponse.json({ success: true, appointment })
    } catch (err) {
        console.error("Booking error:", err)
        return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 })
    }
}