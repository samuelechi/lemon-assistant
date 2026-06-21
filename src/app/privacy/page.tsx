import Link from "next/link"
import { Logo } from "@/components/ui/Logo"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-cream">
            <header className="bg-white border-b border-border px-6 py-5 flex items-center justify-between">
                <Link href="/"><Logo variant="white" size="sm" /></Link>
                <Link href="/terms" className="text-xs font-sans text-ink-3 hover:text-ink transition-colors">Terms of Service →</Link>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-16">
                <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Legal</p>
                <h1 className="font-serif text-5xl text-ink mb-3">Privacy Policy</h1>
                <p className="text-sm font-sans text-ink-3 mb-12">Last updated: June 21, 2026</p>

                <div className="space-y-10 text-sm font-sans text-ink leading-relaxed">

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">1. Who we are</h2>
                        <p className="text-ink-3">
                            LemonAssistant ("we", "us", or "our") is an AI-powered phone receptionist service operated by Webgemtech. We help small businesses answer calls, book appointments, and send SMS confirmations automatically. Our service is available at <a href="https://lemon-assistant.vercel.app" className="text-gold hover:underline">lemon-assistant.vercel.app</a>.
                        </p>
                        <p className="text-ink-3 mt-3">
                            For privacy-related questions, contact us at: <a href="mailto:webgemtechca@gmail.com" className="text-gold hover:underline">webgemtechca@gmail.com</a>
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">2. Information we collect</h2>
                        <h3 className="font-sans font-500 text-ink mb-2">From business owners (you):</h3>
                        <ul className="list-disc pl-5 space-y-1.5 text-ink-3 mb-4">
                            <li>Name, email address, and password when you create an account</li>
                            <li>Business name, type, working hours, and appointment preferences</li>
                            <li>Google Calendar credentials (if you choose to connect)</li>
                            <li>Notification phone number for call alerts</li>
                            <li>Payment information (processed by Stripe — we do not store card details)</li>
                        </ul>
                        <h3 className="font-sans font-500 text-ink mb-2">From callers who contact your business:</h3>
                        <ul className="list-disc pl-5 space-y-1.5 text-ink-3 mb-4">
                            <li>Phone number (caller ID)</li>
                            <li>Name (if provided during the call)</li>
                            <li>Call recordings, transcripts, and AI-generated summaries</li>
                            <li>Appointment details (date, time, type)</li>
                        </ul>
                        <h3 className="font-sans font-500 text-ink mb-2">Automatically collected:</h3>
                        <ul className="list-disc pl-5 space-y-1.5 text-ink-3">
                            <li>Usage data (pages visited, features used, call durations)</li>
                            <li>Device and browser information</li>
                            <li>IP address and approximate location</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">3. How we use your information</h2>
                        <ul className="list-disc pl-5 space-y-1.5 text-ink-3">
                            <li>To provide and operate the LemonAssistant service</li>
                            <li>To answer incoming calls on your behalf using AI</li>
                            <li>To book appointments and sync with your calendar</li>
                            <li>To send SMS confirmations and summaries via Twilio</li>
                            <li>To process payments via Stripe</li>
                            <li>To notify you of urgent calls, usage alerts, and account updates</li>
                            <li>To improve our AI models and service quality</li>
                            <li>To comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">4. Third-party services</h2>
                        <p className="text-ink-3 mb-4">We use the following third-party services to operate LemonAssistant:</p>
                        <div className="space-y-3">
                            {[
                                { name: "Vapi", purpose: "AI voice calls and call handling", link: "https://vapi.ai/privacy" },
                                { name: "Twilio", purpose: "Phone number provisioning and SMS delivery", link: "https://www.twilio.com/en-us/legal/privacy" },
                                { name: "Stripe", purpose: "Payment processing", link: "https://stripe.com/privacy" },
                                { name: "Supabase", purpose: "Database and authentication", link: "https://supabase.com/privacy" },
                                { name: "Google", purpose: "Calendar integration and OAuth authentication", link: "https://policies.google.com/privacy" },
                                { name: "Vercel", purpose: "Hosting and infrastructure", link: "https://vercel.com/legal/privacy-policy" },
                                { name: "ElevenLabs", purpose: "AI voice synthesis", link: "https://elevenlabs.io/privacy" },
                                { name: "Deepgram", purpose: "Speech transcription", link: "https://deepgram.com/privacy" },
                            ].map(s => (
                                <div key={s.name} className="flex items-start gap-3 p-3.5 bg-white border border-border rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-500 text-ink">{s.name}</p>
                                        <p className="text-ink-3 text-xs mt-0.5">{s.purpose}</p>
                                    </div>
                                    <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:underline flex-shrink-0">Privacy policy →</a>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">5. Call recordings and transcripts</h2>
                        <p className="text-ink-3 mb-3">
                            LemonAssistant records and transcribes calls handled on your behalf. These recordings are used to generate call summaries, detect urgency, and improve the AI's performance.
                        </p>
                        <p className="text-ink-3 mb-3">
                            <strong className="text-ink">As a business owner</strong>, you are responsible for ensuring your callers are aware their calls may be recorded. Requirements vary by jurisdiction — please check local laws in your country, province, or state.
                        </p>
                        <p className="text-ink-3">
                            Call transcripts and summaries are stored in your dashboard and retained for up to 12 months, after which they may be deleted.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">6. Data sharing</h2>
                        <p className="text-ink-3 mb-3">We do not sell your personal information. We share data only:</p>
                        <ul className="list-disc pl-5 space-y-1.5 text-ink-3">
                            <li>With third-party services listed above, to operate the platform</li>
                            <li>When required by law or to comply with legal processes</li>
                            <li>To protect the rights and safety of LemonAssistant, our users, or the public</li>
                            <li>In connection with a business transfer or acquisition</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">7. Data retention</h2>
                        <p className="text-ink-3">
                            We retain your account data for as long as your account is active. Call logs, transcripts, and appointment records are retained for up to 12 months. Payment records are retained as required by law. You may request deletion of your data at any time by contacting us.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">8. Your rights</h2>
                        <p className="text-ink-3 mb-3">Depending on your location, you may have the right to:</p>
                        <ul className="list-disc pl-5 space-y-1.5 text-ink-3">
                            <li>Access the personal data we hold about you</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Withdraw consent for data processing</li>
                            <li>Data portability</li>
                            <li>Lodge a complaint with a supervisory authority</li>
                        </ul>
                        <p className="text-ink-3 mt-3">
                            To exercise any of these rights, email us at <a href="mailto:webgemtechca@gmail.com" className="text-gold hover:underline">webgemtechca@gmail.com</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">9. Cookies</h2>
                        <p className="text-ink-3">
                            We use essential cookies to maintain your login session and remember your preferences. We do not use tracking or advertising cookies.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">10. Security</h2>
                        <p className="text-ink-3">
                            We use industry-standard security measures including encryption in transit (HTTPS), encrypted data storage via Supabase, and access controls. However, no system is completely secure and we cannot guarantee absolute security of your data.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">11. Children's privacy</h2>
                        <p className="text-ink-3">
                            LemonAssistant is not directed at children under 13. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">12. Changes to this policy</h2>
                        <p className="text-ink-3">
                            We may update this privacy policy from time to time. We will notify you of significant changes via email or a notice on the platform. Your continued use of LemonAssistant after changes constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">13. Contact us</h2>
                        <p className="text-ink-3">
                            For any privacy-related questions or requests, contact us at:<br />
                            <a href="mailto:webgemtechca@gmail.com" className="text-gold hover:underline">webgemtechca@gmail.com</a>
                        </p>
                    </section>

                </div>
            </main>

            <footer className="border-t border-border py-8 px-6 text-center">
                <p className="text-xs font-sans text-ink-3">© 2026 LemonAssistant. <Link href="/terms" className="text-gold hover:underline">Terms of Service</Link> · <Link href="/privacy" className="text-gold hover:underline">Privacy Policy</Link></p>
            </footer>
        </div>
    )
}