"use client"
import { Phone, Calendar, Clock, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "../StatCard"
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

function formatDate(dateStr: string): string {
    const today = new Date(); const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    const date = new Date(dateStr)
    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"
    return date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })
}

type Props = {
    isDark: boolean; business: Business | null; calls: Call[]; appointments: Appointment[]
    callsToday: Call[]; bookingsToday: Call[]; minutesUsed: number; bookingRate: number
    subscription: SubscriptionStatus | null; settingUp: boolean
    onCompleteSetup: () => void; onNavTo: (tab: string) => void
}

export function OverviewTab({ isDark, business, calls, appointments, callsToday, bookingsToday, minutesUsed, bookingRate, subscription, settingUp, onCompleteSetup, onNavTo }: Props) {
    return (
        <div className="space-y-8 animate-[fadeIn_0.3s_ease]">
            {!business?.vapi_assistant_id && (
                <div className={`rounded-xl border p-5 flex items-center justify-between gap-4 ${isDark ? "bg-[#1A1A16] border-yellow-800" : "bg-yellow-50 border-yellow-200"}`}>
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
                <div className={`rounded-xl border p-5 ${isDark ? "bg-[#1A1A16] border-gold/30" : "bg-gold-pale border-gold-light"}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#E0B400] to-[#A07E00] rounded-xl flex items-center justify-center shadow-[var(--shadow-gold)] flex-shrink-0">
                                <Phone size={18} className="text-white" />
                            </div>
                            <div>
                                <p className={`text-sm font-sans font-500 mb-0.5 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Activate your free trial</p>
                                <p className="text-xs font-sans text-ink-3 leading-relaxed max-w-sm">
                                    Get your dedicated phone number for $2.50 and start your 13-minute free trial.
                                </p>
                            </div>
                        </div>
                        <Button variant="gold" size="sm" onClick={() => onNavTo("billing")} className="flex-shrink-0">Activate for $2.50 →</Button>
                    </div>
                </div>
            )}

            <div>
                <h2 className={`font-serif text-3xl md:text-4xl mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                    Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}.
                </h2>
                <p className="text-sm font-sans text-ink-3">
                    {calls.length > 0
                        ? `${business?.ai_name || "Lisa"} has handled ${callsToday.length} call${callsToday.length !== 1 ? "s" : ""} today.`
                        : `${business?.ai_name || "Lisa"} is ready and waiting for your first call.`}
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard isDark={isDark} icon={<Phone size={16} />} label="Calls today" value={String(callsToday.length)} sub={calls.length > 0 ? `${calls.length} total` : "No calls yet"} accent />
                <StatCard isDark={isDark} icon={<Calendar size={16} />} label="Bookings today" value={String(bookingsToday.length)} sub={`${appointments.length} upcoming`} />
                <StatCard isDark={isDark} icon={<Clock size={16} />} label="Minutes used" value={String(minutesUsed)} sub="This month" />
                <StatCard isDark={isDark} icon={<TrendingUp size={16} />} label="Booking rate" value={calls.length > 0 ? `${bookingRate}%` : "—"} sub="Calls that book" />
            </div>

            <div className={`rounded-xl border p-5 flex items-center justify-between shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#E0B400] to-[#A07E00] rounded-xl flex items-center justify-center shadow-[var(--shadow-gold)] font-serif text-lg font-600 text-ink">
                        {business?.ai_name?.charAt(0) || "L"}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className={`text-sm font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                {business?.ai_name || "Lisa"} {business?.vapi_assistant_id ? "is active" : "is not set up"}
                            </p>
                            <span className={`w-1.5 h-1.5 rounded-full ${business?.vapi_assistant_id ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
                        </div>
                        <p className="text-2xs font-sans text-ink-3">
                            {business?.phone_number ? `Answering calls at ${business.phone_number}` : "No phone number assigned yet"}
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => onNavTo("settings")}>Edit agent</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`rounded-xl border shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                        <h3 className={`font-serif text-lg ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Recent calls</h3>
                        <button onClick={() => onNavTo("calls")} className="text-xs font-sans text-gold hover:text-gold-dark transition-colors flex items-center gap-1">View all <ChevronRight size={12} /></button>
                    </div>
                    {calls.length === 0 ? (
                        <EmptyState isDark={isDark} icon={<Phone size={20} />} title="No calls yet" sub="Once calls come in they'll appear here in real time." />
                    ) : (
                        <div className="divide-y divide-border">
                            {calls.slice(0, 4).map(call => (
                                <div key={call.id} className={`px-5 py-3.5 flex items-center gap-3 transition-colors ${isDark ? "hover:bg-[#0F0F0D]" : "hover:bg-cream"}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-600 flex-shrink-0 ${call.urgent ? "bg-red-100 text-red-600" : "bg-gold-pale text-gold-dark"}`}>
                                        {(call.caller_name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-sans font-500 truncate ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{call.caller_name || call.caller_number || "Unknown"}</p>
                                        <p className="text-2xs font-sans text-ink-3 truncate">{call.reason || "No reason recorded"}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <StatusBadge status={call.appointment_booked ? "booked" : call.urgent ? "urgent" : call.status} />
                                        <span className="text-2xs font-sans text-ink-3">{timeAgo(call.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`rounded-xl border shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                        <h3 className={`font-serif text-lg ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Upcoming</h3>
                        <button onClick={() => onNavTo("appointments")} className="text-xs font-sans text-gold hover:text-gold-dark transition-colors flex items-center gap-1">View all <ChevronRight size={12} /></button>
                    </div>
                    {appointments.length === 0 ? (
                        <EmptyState isDark={isDark} icon={<Calendar size={20} />} title="No appointments yet" sub="Appointments booked by your AI will show up here." />
                    ) : (
                        <div className="divide-y divide-border">
                            {appointments.slice(0, 4).map(apt => (
                                <div key={apt.id} className={`px-5 py-3.5 flex items-center gap-3 transition-colors ${isDark ? "hover:bg-[#0F0F0D]" : "hover:bg-cream"}`}>
                                    <div className="w-8 h-8 bg-gold-pale rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Calendar size={14} className="text-gold" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-sans font-500 truncate ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{apt.caller_name}</p>
                                        <p className="text-2xs font-sans text-ink-3">{apt.type} · {formatDate(apt.date)} at {apt.time}</p>
                                    </div>
                                    <StatusBadge status={apt.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}