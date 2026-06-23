"use client"
import { Phone, Calendar, Clock, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "../EmptyState"
import { StatusBadge } from "../StatusBadge"

type Call = { id: string; caller_name: string; caller_number: string; reason: string; status: string; urgent: boolean; duration_seconds: number; appointment_booked: boolean; summary: string; transcript: string; created_at: string }
type Appointment = { id: string; caller_name: string; caller_phone: string; type: string; date: string; time: string; status: string; created_at: string }
type Business = { name: string; ai_name: string; phone_number: string | null; vapi_assistant_id: string | null }
type SubscriptionStatus = { plan: string; status: string; minutesUsed: number; minutesLimit: number; isActive: boolean; isTrial: boolean; isExpired: boolean; currentPeriodEnd: string | null }

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
    return `${Math.floor(diff / 86400)} days ago`
}

function formatTime(timeStr: string): string {
    if (!timeStr) return ""
    const [h, m] = timeStr.split(":")
    const hour = parseInt(h)
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`
}

function getDateParts(dateStr: string): { month: string; day: string } {
    const d = new Date(dateStr)
    return {
        month: d.toLocaleString("en-CA", { month: "short" }).toUpperCase(),
        day: String(d.getDate()),
    }
}

type StatCardProps = {
    icon: React.ReactNode; label: string; value: string; sub?: string
    accent?: boolean; isDark: boolean; trend?: string
}

function StatCard({ icon, label, value, sub, accent, isDark, trend }: StatCardProps) {
    return (
        <div className={`rounded-xl border p-5 ${accent
            ? "bg-gradient-to-br from-[#E0B400] via-gold to-[#A07E00] border-gold-light shadow-[var(--shadow-gold)]"
            : isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-white/20 text-white" : isDark ? "bg-[#2A2A26] text-gold" : "bg-gold-pale text-gold"}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-2xs font-sans font-500 px-2 py-0.5 rounded-full ${accent ? "bg-white/20 text-white" : "bg-green-500/10 text-green-500"}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div className={`font-serif text-3xl mb-0.5 ${accent ? "text-white" : isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{value}</div>
            <div className={`text-xs font-sans font-500 mb-1 ${accent ? "text-white/90" : isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{label}</div>
            {sub && <div className={`text-2xs font-sans ${accent ? "text-white/60" : "text-ink-3"}`}>{sub}</div>}
        </div>
    )
}

type Props = {
    isDark: boolean; business: Business | null; calls: Call[]; appointments: Appointment[]
    callsToday: Call[]; bookingsToday: Call[]; minutesUsed: number; bookingRate: number
    subscription: SubscriptionStatus | null; settingUp: boolean
    onCompleteSetup: () => void; onNavTo: (tab: string) => void
}

export function OverviewTab({ isDark, business, calls, appointments, callsToday, bookingsToday, minutesUsed, bookingRate, subscription, settingUp, onCompleteSetup, onNavTo }: Props) {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease]">

            {/* Setup banners */}
            {!business?.vapi_assistant_id && (
                <div className={`rounded-xl border p-5 flex items-center justify-between gap-4 ${isDark ? "bg-[#1A1A16] border-yellow-800/50" : "bg-yellow-50 border-yellow-200"}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={18} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className={`text-sm font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Setup incomplete</p>
                            <p className="text-2xs font-sans text-ink-3">Your AI agent wasn&apos;t created yet. Complete setup to start receiving calls.</p>
                        </div>
                    </div>
                    <Button variant="gold" size="sm" onClick={onCompleteSetup} disabled={settingUp}>
                        {settingUp ? "Setting up..." : "Complete setup →"}
                    </Button>
                </div>
            )}

            {business?.vapi_assistant_id && !business?.phone_number && !subscription?.isActive && (
                <div className={`rounded-xl border p-5 ${isDark ? "bg-[#1A1A16] border-gold/20" : "bg-gold-pale border-gold-light"}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#E0B400] to-[#A07E00] rounded-xl flex items-center justify-center shadow-[var(--shadow-gold)] flex-shrink-0">
                                <Phone size={18} className="text-white" />
                            </div>
                            <div>
                                <p className={`text-sm font-sans font-500 mb-0.5 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Activate your free trial</p>
                                <p className="text-xs font-sans text-ink-3 leading-relaxed max-w-sm">Get your dedicated phone number for $2.50 and start your 13-minute free trial.</p>
                            </div>
                        </div>
                        <Button variant="gold" size="sm" onClick={() => onNavTo("billing")} className="flex-shrink-0">Activate for $2.50 →</Button>
                    </div>
                </div>
            )}

            {/* Greeting */}
            <div>
                <h2 className={`font-serif text-3xl md:text-4xl mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                    Good {greeting}, {business?.name || "there"}.
                </h2>
                <p className="text-sm font-sans text-ink-3">
                    {calls.length > 0
                        ? `${business?.ai_name || "Lisa"} has handled ${callsToday.length} call${callsToday.length !== 1 ? "s" : ""} today.`
                        : `${business?.ai_name || "Lisa"} is ready and waiting for your first call.`}
                </p>
            </div>

            {/* Stat cards + agent status */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard isDark={isDark} icon={<Phone size={15} />} label="Calls today" value={String(callsToday.length)}
                    sub={calls.length > 0 ? `${calls.length} total` : "No calls yet"} accent
                    trend={calls.length > 0 ? `↑ ${calls.length}` : undefined} />
                <StatCard isDark={isDark} icon={<Calendar size={15} />} label="Bookings today" value={String(bookingsToday.length)}
                    sub={`${appointments.length} upcoming`} />
                <StatCard isDark={isDark} icon={<Clock size={15} />} label="Minutes used" value={String(minutesUsed)}
                    sub={`of ${subscription?.minutesLimit ?? 13} this month`} />
                <StatCard isDark={isDark} icon={<TrendingUp size={15} />} label="Booking rate" value={calls.length > 0 ? `${bookingRate}%` : "—"}
                    sub="Calls that book" />

                {/* Live agent status card spans 2 cols */}
                <div className={`col-span-2 rounded-xl border p-5 flex items-center justify-between ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                    <div className="flex items-center gap-4">
                        {/* Avatar with pulse ring */}
                        <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#E0B400] to-[#A07E00] rounded-xl flex items-center justify-center shadow-[var(--shadow-gold)] font-serif text-xl font-600 text-ink">
                                {business?.ai_name?.charAt(0) || "L"}
                            </div>
                            {business?.vapi_assistant_id && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#1A1A16] animate-pulse" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className={`text-sm font-sans font-600 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                    {business?.ai_name || "Lisa"}
                                </p>
                                <span className={`text-2xs font-sans px-2 py-0.5 rounded-full ${business?.vapi_assistant_id ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                                    {business?.vapi_assistant_id ? "Live" : "Offline"}
                                </span>
                            </div>
                            <p className="text-xs font-sans text-ink-3">
                                {business?.phone_number ? `${business.phone_number}` : "No number assigned"}
                            </p>
                            {callsToday.length > 0 && (
                                <p className="text-2xs font-sans text-ink-3 mt-0.5">{callsToday.length} call{callsToday.length !== 1 ? "s" : ""} answered today</p>
                            )}
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onNavTo("settings")}>Edit agent</Button>
                </div>
            </div>

            {/* Recent calls + upcoming */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Recent calls */}
                <div className={`rounded-xl border ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                        <h3 className={`font-serif text-base ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Recent calls</h3>
                        <button onClick={() => onNavTo("calls")} className="text-xs font-sans text-gold hover:text-gold-dark transition-colors flex items-center gap-1">
                            View all <ChevronRight size={12} />
                        </button>
                    </div>
                    {calls.length === 0 ? (
                        <EmptyState isDark={isDark} icon={<Phone size={20} />} title="No calls yet" sub="Once calls come in they'll appear here." />
                    ) : (
                        <div className="divide-y divide-border">
                            {calls.slice(0, 5).map(call => {
                                const status = call.appointment_booked ? "booked" : call.urgent ? "urgent" : call.status
                                const accentBorder = call.appointment_booked ? "border-l-gold" : call.urgent ? "border-l-red-500" : "border-l-transparent"
                                return (
                                    <div key={call.id} className={`px-5 py-3 flex items-center gap-3 border-l-2 ${accentBorder} transition-colors ${isDark ? "hover:bg-[#0F0F0D]" : "hover:bg-cream"}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-600 flex-shrink-0 ${call.urgent ? "bg-red-500/15 text-red-400" : call.appointment_booked ? "bg-gold/15 text-gold" : isDark ? "bg-[#2A2A26] text-[#8A8A82]" : "bg-cream-2 text-ink-3"}`}>
                                            {(call.caller_name || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-sans font-500 truncate ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                                {call.caller_name || call.caller_number || "Unknown"}
                                            </p>
                                            <p className="text-2xs font-sans text-ink-3 truncate">{call.reason || "No reason recorded"}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <StatusBadge status={status} />
                                            <span className="text-2xs font-sans text-ink-3">{timeAgo(call.created_at)}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Upcoming appointments */}
                <div className={`rounded-xl border ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                        <h3 className={`font-serif text-base ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Upcoming</h3>
                        <button onClick={() => onNavTo("appointments")} className="text-xs font-sans text-gold hover:text-gold-dark transition-colors flex items-center gap-1">
                            View all <ChevronRight size={12} />
                        </button>
                    </div>
                    {appointments.length === 0 ? (
                        <EmptyState isDark={isDark} icon={<Calendar size={20} />} title="No appointments yet" sub="Appointments booked by your AI will show up here." />
                    ) : (
                        <div className="divide-y divide-border">
                            {appointments.slice(0, 5).map(apt => {
                                const { month, day } = getDateParts(apt.date)
                                return (
                                    <div key={apt.id} className={`px-5 py-3 flex items-center gap-3 transition-colors ${isDark ? "hover:bg-[#0F0F0D]" : "hover:bg-cream"}`}>
                                        <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${isDark ? "bg-[#0F0F0D]" : "bg-gold-pale"}`}>
                                            <span className="text-2xs font-sans font-600 text-gold leading-none">{month}</span>
                                            <span className={`font-serif text-base leading-tight ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{day}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-sans font-500 truncate ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{apt.caller_name}</p>
                                            <p className="text-2xs font-sans text-ink-3">{apt.type} · {formatTime(apt.time)}</p>
                                        </div>
                                        <StatusBadge status={apt.status} />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}