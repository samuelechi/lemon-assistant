import Link from "next/link"
import { Logo } from "@/components/ui/Logo"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-cream">
            <header className="bg-white border-b border-border px-6 py-5 flex items-center justify-between">
                <Link href="/"><Logo variant="white" size="sm" /></Link>
                <Link href="/privacy" className="text-xs font-sans text-ink-3 hover:text-ink transition-colors">Privacy Policy →</Link>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-16">
                <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Legal</p>
                <h1 className="font-serif text-5xl text-ink mb-3">Terms of Service</h1>
                <p className="text-sm font-sans text-ink-3 mb-12">Last updated: June 21, 2026</p>

                <div className="space-y-10 text-sm font-sans text-ink leading-relaxed">

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">1. Agreement to terms</h2>
                        <p className="text-ink-3">
                            By creating an account or using LemonAssistant ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. These terms apply to all users in Canada, the United States, the United Kingdom, Ireland, Australia, New Zealand, and any other supported country.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">2. The service</h2>
                        <p className="text-ink-3 mb-3">
                            LemonAssistant provides an AI-powered phone receptionist that answers calls, books appointments, sends SMS confirmations, and manages call summaries on behalf of your business.
                        </p>
                        <p className="text-ink-3">
                            The Service is provided "as is". We do not guarantee 100% uptime, and the AI may occasionally make errors in transcription, booking, or call handling. You are responsible for reviewing your call log and appointments regularly.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">3. Trial activation and billing</h2>
                        <div className="bg-gold-pale border border-gold-light rounded-xl p-5 mb-4">
                            <h3 className="font-sans font-500 text-ink mb-2">$2.50 trial activation fee</h3>
                            <p className="text-ink-3 text-xs leading-relaxed">
                                To activate your free trial, a one-time $2.50 activation fee is charged. This fee covers the cost of provisioning your dedicated local phone number. This fee is non-refundable. After paying the activation fee, you receive 13 minutes of free AI call time. Your phone number remains assigned to your account if you upgrade to a paid plan.
                            </p>
                        </div>
                        <h3 className="font-sans font-500 text-ink mb-2">Paid plans</h3>
                        <ul className="list-disc pl-5 space-y-1.5 text-ink-3 mb-4">
                            <li>Growth plan: $99/month · 250 minutes included</li>
                            <li>Pro plan: $199/month · 600 minutes included</li>
                            <li>Plans are billed monthly and renew automatically</li>
                            <li>You may cancel at any time from your dashboard — cancellation takes effect at the end of the current billing period</li>
                            <li>We do not offer refunds for partial months</li>
                        </ul>
                        <h3 className="font-sans font-500 text-ink mb-2">Minute limits</h3>
                        <p className="text-ink-3">
                            Each plan includes a set number of AI call minutes per month. When your trial or plan minutes are exhausted, incoming calls will no longer be answered by the AI until you upgrade or your plan renews. You will be notified via SMS when you approach your limit.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">4. Phone numbers</h2>
                        <p className="text-ink-3 mb-3">
                            Upon trial activation, a dedicated local phone number is assigned to your account in your selected country. This number is provisioned through Twilio and remains active as long as your account is active.
                        </p>
                        <p className="text-ink-3 mb-3">
                            You do not own this phone number — it is leased on your behalf. If your account is cancelled or suspended, the number may be released. We are not responsible for any disruption caused by number availability issues in specific regions.
                        </p>
                        <p className="text-ink-3">
                            You are responsible for setting up call forwarding from your existing business number to your LemonAssistant number.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">5. Call recording and compliance</h2>
                        <p className="text-ink-3 mb-3">
                            LemonAssistant records and transcribes calls to provide summaries and enable AI-powered responses. By using the Service, you acknowledge that:
                        </p>
                        <ul className="list-disc pl-5 space-y-1.5 text-ink-3">
                            <li>You are responsible for complying with all applicable laws regarding call recording in your jurisdiction</li>
                            <li>In many regions, you must notify callers that their call may be recorded</li>
                            <li>You may configure your AI greeting to include a recording disclosure</li>
                            <li>We are not liable for any legal claims arising from your failure to comply with call recording laws</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">6. SMS communications</h2>
                        <p className="text-ink-3 mb-3">
                            LemonAssistant sends SMS messages on your behalf to:
                        </p>
                        <ul className="list-disc pl-5 space-y-1.5 text-ink-3 mb-3">
                            <li>Callers who book appointments (confirmation texts)</li>
                            <li>You (the business owner) with call summaries and usage alerts</li>
                        </ul>
                        <p className="text-ink-3">
                            SMS delivery is provided through Twilio and is subject to carrier availability. We are not responsible for SMS delivery failures. Standard messaging rates may apply to recipients depending on their carrier plan.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">7. Acceptable use</h2>
                        <p className="text-ink-3 mb-3">You agree not to use LemonAssistant to:</p>
                        <ul className="list-disc pl-5 space-y-1.5 text-ink-3">
                            <li>Engage in illegal activities or violate any applicable law</li>
                            <li>Harass, deceive, or defraud callers</li>
                            <li>Impersonate a human without disclosure when required by law</li>
                            <li>Send unsolicited SMS messages (spam)</li>
                            <li>Attempt to reverse-engineer or abuse the AI system</li>
                            <li>Resell or white-label the Service without written permission</li>
                        </ul>
                        <p className="text-ink-3 mt-3">
                            We reserve the right to suspend or terminate accounts that violate these terms without refund.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">8. Google Calendar integration</h2>
                        <p className="text-ink-3">
                            If you connect Google Calendar, you grant LemonAssistant read and write access to your calendar to check availability and create bookings. You may disconnect at any time from your dashboard. Our use of Google user data complies with the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-gold hover:underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including Limited Use requirements.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">9. Intellectual property</h2>
                        <p className="text-ink-3">
                            LemonAssistant and all associated branding, code, and content are owned by Webgemtech. You retain ownership of your business data, call logs, and customer information. You grant us a limited license to process your data to provide the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">10. Disclaimer of warranties</h2>
                        <p className="text-ink-3">
                            The Service is provided "as is" without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or that the AI will handle all calls perfectly. The AI may mishear, misinterpret, or fail to complete bookings in some cases. You should monitor your dashboard regularly.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">11. Limitation of liability</h2>
                        <p className="text-ink-3">
                            To the maximum extent permitted by law, LemonAssistant and Webgemtech shall not be liable for any indirect, incidental, special, or consequential damages, including lost revenue, lost bookings, or missed calls. Our total liability to you for any claim shall not exceed the amount you paid us in the 3 months preceding the claim.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">12. Termination</h2>
                        <p className="text-ink-3">
                            You may cancel your account at any time from your dashboard. We may suspend or terminate your account for violation of these terms, non-payment, or extended inactivity. Upon termination, your data will be retained for 30 days before deletion, during which you may request an export.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">13. Governing law</h2>
                        <p className="text-ink-3">
                            These terms are governed by the laws of the Province of Manitoba, Canada, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Manitoba.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">14. Changes to these terms</h2>
                        <p className="text-ink-3">
                            We may update these terms from time to time. We will notify you of significant changes via email. Your continued use of the Service after changes constitutes acceptance of the updated terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-2xl text-ink mb-4">15. Contact</h2>
                        <p className="text-ink-3">
                            For questions about these terms, contact us at:<br />
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