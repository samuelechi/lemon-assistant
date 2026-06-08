import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getGoogleCalendarEvents } from "@/lib/google-calendar"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAvailability(businessId: string, date: string) {
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

    const { data: business } = await supabase
        .from("businesses")
        .select("meeting_duration, hours_start, hours_end, calendar_type, calendar_token")
        .eq("id", businessId)
        .single()

    if (!business) return null

    const { data: blocked } = await supabase
        .from("blocked_dates")
        .select("id")
        .eq("business_id", businessId)
        .eq("date", date)
        .maybeSingle()

    if (blocked) {
        return { available: [], message: "This date is unavailable" }
    }

    const { data: availability } = await supabase
        .from("availability")
        .select("start_time, end_time")
        .eq("business_id", businessId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)

    const slots: string[] = []
    const duration = business.meeting_duration || 30

    const timeRanges = availability && availability.length > 0
        ? availability
        : [{ start_time: business.hours_start || "09:00", end_time: business.hours_end || "17:00" }]

    for (const range of timeRanges) {
        const [startH, startM] = range.start_time.split(":").map(Number)
        const [endH, endM] = range.end_time.split(":").map(Number)
        let current = startH * 60 + startM
        const end = endH * 60 + endM

        while (current + duration <= end) {
            const h = Math.floor(current / 60)
            const m = current % 60
            const timeStr = `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`
            slots.push(timeStr)
            current += duration
        }
    }

    const { data: booked } = await supabase
        .from("appointments")
        .select("time")
        .eq("business_id", businessId)
        .eq("date", date)
        .neq("status", "cancelled")

    const bookedTimes = new Set(booked?.map(b => b.time) || [])

    if (business.calendar_type === "google" && business.calendar_token) {
        const googleBooked = await getGoogleCalendarEvents(businessId, date)
        googleBooked.forEach(t => bookedTimes.add(t))
    }

    const available = slots.filter(s => !bookedTimes.has(s))
    return { available, date, dayOfWeek }
}

// Called by your dashboard/frontend
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get("businessId")
    const date = searchParams.get("date")

    if (!businessId || !date) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 })
    }

    try {
        const result = await getAvailability(businessId, date)
        if (!result) return NextResponse.json({ error: "Business not found" }, { status: 404 })
        return NextResponse.json(result)
    } catch (err) {
        console.error("Availability error:", err)
        return NextResponse.json({ error: "Failed to get availability" }, { status: 500 })
    }
}

// Called by Vapi tool
export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get("businessId")

    try {
        const body = await req.json()

        // Vapi sends: message.toolCallList[0].arguments (object, not string)
        const toolCall = body?.message?.toolCallList?.[0]
        const toolCallId = toolCall?.id ?? ""
        const args = toolCall?.arguments
        const date = args?.date ?? body?.date

        if (!businessId || !date) {
            return NextResponse.json({
                results: [{ toolCallId, result: "Missing businessId or date." }]
            })
        }

        const result = await getAvailability(businessId, date)

        if (!result) {
            return NextResponse.json({
                results: [{ toolCallId, result: "Business not found." }]
            })
        }

        const message = result.available.length === 0
            ? "There are no available slots on that date. Would you like to try a different day?"
            : `Available times on ${date}: ${result.available.join(", ")}. Which time works for you?`

        return NextResponse.json({
            results: [{ toolCallId, result: message }]
        })
    } catch (err) {
        console.error("Availability POST error:", err)
        return NextResponse.json({
            results: [{ toolCallId: "", result: "Failed to check availability. Please try again." }]
        })
    }
}