import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { areaCode } = await req.json()
        if (!areaCode) return NextResponse.json({ error: "Province required" }, { status: 400 })

        const { data: business } = await supabase
            .from("businesses")
            .select("id, name")
            .eq("user_id", user.id)
            .single()

        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 })

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price: "price_1TkJBsDZ7PCu9EYzZ32SCZsD",
                quantity: 1,
            }],
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?activation=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?activation=cancelled`,
            metadata: {
                userId: user.id,
                businessId: business.id,
                areaCode,
                type: "trial_activation",
            },
        })

        return NextResponse.json({ url: session.url })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong"
        console.error("Activation checkout error:", message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}