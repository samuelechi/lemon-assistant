"use client"
import { useState } from "react"
import { Menu, Bell, AlertTriangle, Phone } from "lucide-react"

type Call = { id: string; caller_name: string; caller_number: string; reason: string; urgent: boolean; created_at: string }

type HeaderProps = {
    active: string
    isDark: boolean
    business: { name: string } | null
    urgentCalls: Call[]
    onMenuOpen: () => void
    onNavTo: (tab: string) => void
    onFilterUrgent: () => void
}

const NAV_LABEL: Record<string, string> = {
    overview: "Overview", calls: "Call log", appointments: "Appointments",
    analytics: "Analytics", calendar: "Calendar", settings: "Settings", billing: "Billing",
}

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
    return `${Math.floor(diff / 86400)} days ago`
}

export function Header({ active, isDark, business, urgentCalls, onMenuOpen, onNavTo, onFilterUrgent }: HeaderProps) {
    const [bellOpen, setBellOpen] = useState(false)
    const [read, setRead] = useState(false)

    return (
        <header className={`sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-4 border-b backdrop-blur-xl shadow-[0_4px_24px_-18px_rgba(15,15,13,0.45)] ${isDark ? "bg-[#0F0F0D]/85 border-[#1A1A16]" : "bg-white/85 border-border"}`}>
            <div className="flex items-center gap-4">
                <button className="md:hidden text-ink-3" onClick={onMenuOpen}><Menu size={20} /></button>
                <div>
                    <h1 className={`font-serif text-xl ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{NAV_LABEL[active]}</h1>
                    <p className="text-2xs font-sans text-ink-3 hidden md:block">
                        {new Date().toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <button
                        onClick={() => { setBellOpen(p => !p); setRead(true) }}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative ${isDark ? "hover:bg-[#1A1A16] text-[#6A6A62]" : "hover:bg-cream text-ink-3"}`}
                    >
                        <Bell size={17} />
                        {urgentCalls.length > 0 && !read && (
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                        )}
                    </button>
                    {bellOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                            <div className={`absolute right-0 top-11 z-50 w-80 rounded-xl border shadow-lg overflow-hidden ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                                    <p className={`text-xs font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Notifications</p>
                                    {urgentCalls.length > 0 && <span className="text-2xs font-sans text-red-500 font-500">{urgentCalls.length} urgent</span>}
                                </div>
                                {urgentCalls.length === 0 ? (
                                    <div className="px-4 py-8 text-center">
                                        <p className={`text-xs font-sans ${isDark ? "text-[#6A6A62]" : "text-ink-3"}`}>No urgent alerts today</p>
                                    </div>
                                ) : (
                                    <div className="max-h-72 overflow-y-auto">
                                        {urgentCalls.map(call => (
                                            <button key={call.id} onClick={() => { onNavTo("calls"); setBellOpen(false) }}
                                                className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors border-b last:border-0 ${isDark ? "border-[#2A2A26] hover:bg-[#0F0F0D]" : "border-border hover:bg-cream"}`}>
                                                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <AlertTriangle size={12} className="text-red-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-sans font-500 truncate ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                                        {call.caller_name || call.caller_number || "Unknown caller"}
                                                    </p>
                                                    <p className="text-2xs font-sans text-ink-3 truncate mt-0.5">{call.reason || "Flagged as urgent"}</p>
                                                    <p className="text-2xs font-sans text-ink-3 mt-0.5">{timeAgo(call.created_at)}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {urgentCalls.length > 0 && (
                                    <div className={`px-4 py-2.5 border-t ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                                        <button onClick={() => { onFilterUrgent(); onNavTo("calls"); setBellOpen(false) }}
                                            className="text-xs font-sans text-gold hover:text-gold-dark transition-colors">
                                            View all urgent calls →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-[#E0B400] to-[#A07E00] rounded-lg flex items-center justify-center shadow-[var(--shadow-gold)] text-xs font-sans font-600 text-ink">
                    {business?.name?.charAt(0) || "B"}
                </div>
            </div>
        </header>
    )
}