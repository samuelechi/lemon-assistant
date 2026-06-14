import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: sub } = await supabase
            .from("subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", user.id)
            .single()

        if (!sub?.stripe_customer_id) {
            return NextResponse.json({ error: "No subscription found" }, { status: 404 })
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: sub.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?active=billing`,
        })

        return NextResponse.json({ url: session.url })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}