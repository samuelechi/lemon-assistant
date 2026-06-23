import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const { name, email, message } = await req.json()

        if (!name?.trim() || !email?.trim() || !message?.trim()) {
            return NextResponse.json({ error: "All fields are required." }, { status: 400 })
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "LemonAssistant Support <onboarding@resend.dev>",
                to: process.env.SUPPORT_EMAIL,
                reply_to: email,
                subject: `Support request from ${name}`,
                html: `
          <h2>New support request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        `,
            }),
        })

        if (!res.ok) {
            const err = await res.json()
            console.error("Resend error:", err)
            return NextResponse.json({ error: "Failed to send. Try again." }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Support route error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}