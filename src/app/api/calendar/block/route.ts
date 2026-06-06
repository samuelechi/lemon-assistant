import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { date, reason } = await req.json()
        if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 })

        const { data: business } = await supabase
            .from("businesses")
            .select("id")
            .eq("user_id", user.id)
            .single()

        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 })

        await supabase
            .from("blocked_dates")
            .upsert({
                business_id: business.id,
                date,
                reason: reason || null,
            }, { onConflict: "business_id,date" })

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}