import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    const body = await req.text()
    const sig = req.headers.get("stripe-signature")!

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
        console.error("Webhook signature error:", err)
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.metadata?.userId
                const businessId = session.metadata?.businessId
                const plan = session.metadata?.plan

                if (!userId || !businessId) break

                const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

                await supabase.from("subscriptions").upsert({
                    user_id: userId,
                    business_id: businessId,
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: subscription.id,
                    plan: plan || "growth",
                    status: "active",
                    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                }, { onConflict: "user_id" })
                break
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription
                const { data: sub } = await supabase
                    .from("subscriptions")
                    .select("user_id")
                    .eq("stripe_subscription_id", subscription.id)
                    .single()

                if (!sub) break

                await supabase.from("subscriptions").update({
                    status: subscription.status === "active" ? "active" : "inactive",
                    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                }).eq("stripe_subscription_id", subscription.id)
                break
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription
                await supabase.from("subscriptions").update({
                    status: "cancelled",
                }).eq("stripe_subscription_id", subscription.id)
                break
            }
        }

        return NextResponse.json({ received: true })
    } catch (err) {
        console.error("Webhook error:", err)
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
    }
}