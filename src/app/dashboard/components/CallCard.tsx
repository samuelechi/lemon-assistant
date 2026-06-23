"use client"
import { useState } from "react"
import { Phone, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { StatusBadge } from "./StatusBadge"

type Call = {
    id: string
    caller_name: string
    caller_number: string
    reason: string
    status: string
    urgent: boolean
    duration_seconds: number
    appointment_booked: boolean
    summary: string
    transcript: string
    created_at: string
}

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
    return `${Math.floor(diff / 86400)} days ago`
}

function formatDuration(seconds: number): string {
    if (!seconds) return "0:00"
    return `${Math.floor(seconds / 60)}m ${(seconds % 60).toString().padStart(2, "0")}s`
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true })
}

export function CallCard({ call, isDark }: { call: Call; isDark: boolean }) {
    const [expanded, setExpanded] = useState(false)
    const status = call.appointment_booked ? "booked" : call.urgent ? "urgent" : call.status

    const accentColor = call.appointment_booked
        ? "border-l-gold"
        : call.urgent
            ? "border-l-red-500"
            : isDark ? "border-l-[#2A2A26]" : "border-l-border"

    return (
        <div
            onClick={() => setExpanded(p => !p)}
            className={`rounded-xl border border-l-4 ${accentColor} transition-all duration-200 cursor-pointer ${isDark
                ? "bg-[#1A1A16] border-[#2A2A26] hover:border-[#3A3A36] hover:bg-[#1E1E1A]"
                : "bg-white border-border hover:border-gold-light hover:shadow-sm"}`}
        >
            <div className="px-5 py-4 flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-sans font-600 flex-shrink-0 ring-2 ${call.urgent
                    ? "bg-red-500/20 text-red-400 ring-red-500/30"
                    : call.appointment_booked
                        ? "bg-gold/20 text-gold ring-gold/30"
                        : isDark ? "bg-[#2A2A26] text-[#8A8A82] ring-[#3A3A36]" : "bg-cream-2 text-ink-3 ring-border"}`}>
                    {(call.caller_name || "?").charAt(0).toUpperCase()}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-sans font-500 truncate ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                            {call.caller_name || call.caller_number || "Unknown caller"}
                        </p>
                        {call.caller_number && call.caller_name && (
                            <span className="text-2xs font-sans text-ink-3 flex-shrink-0">{call.caller_number}</span>
                        )}
                    </div>
                    <p className="text-xs font-sans text-ink-3 truncate">{call.reason || "No reason recorded"}</p>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                        {call.duration_seconds > 0 && (
                            <p className={`text-xs font-sans font-500 ${isDark ? "text-[#C0BFB8]" : "text-ink"}`}>
                                {formatDuration(call.duration_seconds)}
                            </p>
                        )}
                        <p className="text-2xs font-sans text-ink-3">{formatTime(call.created_at)}</p>
                    </div>
                    <StatusBadge status={status} />
                    <div className={`text-ink-3 transition-transform ${expanded ? "rotate-0" : ""}`}>
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                </div>
            </div>

            {expanded && (
                <div
                    className={`border-t px-5 pb-5 pt-4 space-y-3 ${isDark ? "border-[#2A2A26]" : "border-border"}`}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center gap-4 flex-wrap">
                        {call.caller_number && (
                            <span className="text-2xs font-sans text-ink-3 flex items-center gap-1">
                                <Phone size={10} /> {call.caller_number}
                            </span>
                        )}
                        {call.duration_seconds > 0 && (
                            <span className="text-2xs font-sans text-ink-3 flex items-center gap-1">
                                <Clock size={10} /> {formatDuration(call.duration_seconds)}
                            </span>
                        )}
                        <span className="text-2xs font-sans text-ink-3">
                            {new Date(call.created_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                    </div>

                    {call.summary && (
                        <div className={`rounded-lg p-3.5 ${isDark ? "bg-[#0F0F0D]" : "bg-cream"}`}>
                            <p className="text-2xs font-sans font-500 text-ink-3 uppercase tracking-wider mb-2">Summary</p>
                            <p className={`text-xs font-sans leading-relaxed ${isDark ? "text-[#C0BFB8]" : "text-ink"}`}>{call.summary}</p>
                        </div>
                    )}

                    {call.transcript && (
                        <div className={`rounded-lg p-3.5 ${isDark ? "bg-[#0F0F0D]" : "bg-cream"}`}>
                            <p className="text-2xs font-sans font-500 text-ink-3 uppercase tracking-wider mb-2">Transcript</p>
                            <p className={`text-xs font-sans leading-relaxed whitespace-pre-wrap ${isDark ? "text-[#8A8A82]" : "text-ink-3"}`}>{call.transcript}</p>
                        </div>
                    )}

                    {!call.summary && !call.transcript && (
                        <p className="text-xs font-sans text-ink-3 italic">No summary available for this call.</p>
                    )}
                </div>
            )}
        </div>
    )
}