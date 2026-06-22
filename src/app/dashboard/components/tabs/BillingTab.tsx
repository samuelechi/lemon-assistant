"use client"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type SubscriptionStatus = { plan: string; status: string; minutesUsed: number; minutesLimit: number; isActive: boolean; isTrial: boolean; isExpired: boolean; currentPeriodEnd: string | null }
type Business = { phone_number: string | null }

const COUNTRY_OPTIONS = [
    { label: "🇨🇦 Canada", value: "CA" }, { label: "🇺🇸 United States", value: "US" },
    { label: "🇬🇧 United Kingdom", value: "GB" }, { label: "🇮🇪 Ireland", value: "IE" },
    { label: "🇦🇺 Australia", value: "AU" }, { label: "🇳🇿 New Zealand", value: "NZ" },
]

type Props = {
    isDark: boolean; business: Business | null; subscription: SubscriptionStatus | null
    minutesUsed: number; billingLoading: boolean; upgradeProvince: string
    onUpgradeProvinceChange: (v: string) => void
    onUpgrade: (plan: "growth" | "pro", country: string) => void
    onManageBilling: () => void
    onActivate: (country: string) => void
    onSetStatus: (msg: string) => void
}

export function BillingTab({ isDark, business, subscription, minutesUsed, billingLoading, upgradeProvince, onUpgradeProvinceChange, onUpgrade, onManageBilling, onActivate, onSetStatus }: Props) {
    const limit = subscription?.minutesLimit ?? 13
    const pct = Math.min(Math.round((minutesUsed / limit) * 100), 100)
    const cardCls = `rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease] max-w-2xl">

            {/* Current plan */}
            <div className={cardCls}>
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className={`font-serif text-lg ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Current plan</h3>
                        <p className="text-xs font-sans text-ink-3 mt-0.5">
                            {subscription?.isActive
                                ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} · renews ${subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "—"}`
                                : subscription?.isExpired ? "Trial expired — upgrade to continue" : "Free trial"}
                        </p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-sans font-500 border ${subscription?.isActive ? "bg-green-50 text-green-700 border-green-200" : subscription?.isExpired ? "bg-red-50 text-red-700 border-red-200" : "bg-gold-pale text-gold-dark border-gold-light"}`}>
                        {subscription?.isActive ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : subscription?.isExpired ? "Expired" : "Trial"}
                    </span>
                </div>
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-sans font-500 text-ink-3">Minutes used this month</p>
                    <p className={`text-xs font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{minutesUsed} / {limit} mins</p>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-[#2A2A26]" : "bg-cream-2"}`}>
                    <div className={`h-2 rounded-full transition-all duration-500 ${pct >= 90 ? "bg-red-400" : "bg-gradient-to-r from-[#A07E00] via-gold to-[#E6BE2E]"}`} style={{ width: `${pct}%` }} />
                </div>
                {pct >= 80 && <p className="text-2xs font-sans text-red-500 mt-2 flex items-center gap-1"><AlertTriangle size={10} /> You&apos;re running low on minutes</p>}
                {subscription?.isActive && (
                    <Button variant="outline" size="sm" className="mt-5" onClick={onManageBilling} disabled={billingLoading}>
                        {billingLoading ? "Loading..." : "Manage subscription →"}
                    </Button>
                )}
            </div>

            {/* Trial activation */}
            {!business?.phone_number && !subscription?.isActive && (
                <div className={cardCls}>
                    <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Activate your free trial</h3>
                    <p className="text-xs font-sans text-ink-3 mb-6">Get your dedicated phone number and start your 13-minute free trial.</p>
                    <div className="mb-5">
                        <label className="block text-2xs font-sans font-500 text-ink-3 mb-2 tracking-[0.1em] uppercase">Your country <span className="text-red-400">*</span></label>
                        <select value={upgradeProvince} onChange={e => onUpgradeProvinceChange(e.target.value)}
                            className={`w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8]" : "bg-white border-border text-ink"}`}>
                            <option value="">Select your country</option>
                            {COUNTRY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        {upgradeProvince && <p className="text-2xs text-ink-3 font-sans mt-1.5">You&apos;ll get a local <strong className="text-gold">{upgradeProvince}</strong> number.</p>}
                    </div>
                    <div className={`rounded-lg p-4 mb-5 text-xs font-sans leading-relaxed ${isDark ? "bg-[#0F0F0D] text-[#6A6A62]" : "bg-cream text-ink-3"}`}>
                        By activating, you agree to our trial terms: the $2.50 activation fee covers your dedicated phone number. Your 13 free minutes begin immediately.
                    </div>
                    <Button variant="gold" size="sm" className="w-full" disabled={billingLoading || !upgradeProvince}
                        onClick={() => { if (!upgradeProvince) { onSetStatus("Please select your country first."); return } onActivate(upgradeProvince) }}>
                        {billingLoading ? "Loading..." : "Activate for $2.50 →"}
                    </Button>
                </div>
            )}

            {/* Plan picker */}
            {(!subscription?.isActive || subscription?.plan === "growth") && (
                <div className={cardCls}>
                    <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                        {subscription?.isActive ? "Upgrade your plan" : "Choose a plan"}
                    </h3>
                    <p className="text-xs font-sans text-ink-3 mb-6">
                        {subscription?.isExpired ? "Your trial has ended. Upgrade to keep your AI receptionist running." : "Unlock more minutes and features."}
                    </p>
                    {business?.phone_number && (
                        <div className="mb-6">
                            <label className="block text-2xs font-sans font-500 text-ink-3 mb-2 tracking-[0.1em] uppercase">Your country <span className="text-red-400">*</span></label>
                            <select value={upgradeProvince} onChange={e => onUpgradeProvinceChange(e.target.value)}
                                className={`w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8]" : "bg-white border-border text-ink"}`}>
                                <option value="">Select your country</option>
                                {COUNTRY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { id: "growth" as const, name: "Growth", price: "$99", mins: "250 minutes", features: ["AI receptionist", "Appointment booking", "SMS confirmations", "Call summaries", "Analytics dashboard"], current: subscription?.plan === "growth" && subscription?.isActive },
                            { id: "pro" as const, name: "Pro", price: "$199", mins: "600 minutes", features: ["Everything in Growth", "Custom AI voice", "Multi-language", "Review collection", "Priority support"], featured: true, current: subscription?.plan === "pro" && subscription?.isActive },
                        ].map(plan => (
                            <div key={plan.name} className={`rounded-xl p-5 border ${plan.featured ? "bg-ink border-ink" : isDark ? "bg-[#0F0F0D] border-[#2A2A26]" : "bg-cream border-border"}`}>
                                <p className={`text-xs font-sans font-500 uppercase tracking-wider mb-1 ${plan.featured ? "text-gold" : "text-ink-3"}`}>{plan.name}</p>
                                <p className={`font-serif text-3xl mb-0.5 ${plan.featured ? "text-gold" : isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{plan.price}</p>
                                <p className="text-xs font-sans mb-4 text-ink-3">/mo · {plan.mins}</p>
                                <ul className="space-y-2 mb-5">
                                    {plan.features.map(f => (
                                        <li key={f} className={`flex items-center gap-2 text-xs font-sans ${plan.featured ? "text-[#AAAAAA]" : "text-ink-3"}`}>
                                            <CheckCircle2 size={12} className="text-gold flex-shrink-0" /> {f}
                                        </li>
                                    ))}
                                </ul>
                                {plan.current ? (
                                    <Button variant="outline" size="sm" className="w-full" disabled>Current plan</Button>
                                ) : (
                                    <Button variant={plan.featured ? "gold" : "secondary"} size="sm" className="w-full"
                                        onClick={() => onUpgrade(plan.id, upgradeProvince)} disabled={billingLoading}>
                                        {billingLoading ? "Loading..." : `Upgrade to ${plan.name} →`}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {subscription?.isActive && subscription?.plan === "pro" && (
                <div className={cardCls}>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gold-pale rounded-xl flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={18} className="text-gold" />
                        </div>
                        <div>
                            <p className={`text-sm font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>You&apos;re on the Pro plan</p>
                            <p className="text-xs font-sans text-ink-3 mt-0.5">You have access to all features and 600 minutes per month.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}