import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: sub } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle()

        // Get minutes used this month
        const { data: business } = await supabase
            .from("businesses")
            .select("id, trial_minutes_used, trial_started_at")
            .eq("user_id", user.id)
            .single()

        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

        const { data: calls } = await supabase
            .from("calls")
            .select("duration_seconds, created_at")
            .eq("business_id", business?.id)
            .gte("created_at", startOfMonth)

        const minutesUsed = Math.round(
            (calls || []).reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60
        )

        const planLimits: Record<string, number> = {
            growth: 250,
            pro: 600,
            trial: 13,
        }

        const plan = sub?.status === "active" ? sub.plan : "trial"
        const limit = planLimits[plan] || 13

        return NextResponse.json({
            plan,
            status: sub?.status || "trial",
            minutesUsed,
            minutesLimit: limit,
            percentUsed: Math.round((minutesUsed / limit) * 100),
            currentPeriodEnd: sub?.current_period_end || null,
            isActive: sub?.status === "active",
            isTrial: !sub || sub.status !== "active",
            isExpired: !sub && minutesUsed >= 13,
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}