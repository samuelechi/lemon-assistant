import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { availability } = await req.json()

        const { data: business } = await supabase
            .from("businesses")
            .select("id")
            .eq("user_id", user.id)
            .single()

        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 })

        // Delete existing availability
        await supabase
            .from("availability")
            .delete()
            .eq("business_id", business.id)

        // Insert new availability
        if (availability.length > 0) {
            await supabase
                .from("availability")
                .insert(availability.map((a: { day: string; start: string; end: string; active: boolean }) => ({
                    business_id: business.id,
                    day_of_week: a.day.toLowerCase(),
                    start_time: a.start,
                    end_time: a.end,
                    is_active: a.active,
                })))
        }

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}