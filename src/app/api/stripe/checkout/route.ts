import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { plan } = await req.json()

        const priceId = plan === "pro"
            ? process.env.STRIPE_PRO_PRICE_ID!
            : process.env.STRIPE_GROWTH_PRICE_ID!

        const { data: business } = await supabase
            .from("businesses")
            .select("id, name")
            .eq("user_id", user.id)
            .single()

        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 })

        // Check if customer already exists
        const { data: sub } = await supabase
            .from("subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", user.id)
            .maybeSingle()

        let customerId = sub?.stripe_customer_id

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: business.name,
                metadata: { userId: user.id, businessId: business.id },
            })
            customerId = customer.id
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ["card"],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: "subscription",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing=cancelled`,
            metadata: { userId: user.id, businessId: business.id, plan },
        })

        return NextResponse.json({ url: session.url })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong"
        console.error("Stripe checkout error:", message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}