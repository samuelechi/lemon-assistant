"use client"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    LayoutDashboard, Phone, Calendar, BarChart3,
    Settings, CreditCard, Sun, Moon, LogOut,
    PhoneIncoming, Clock, TrendingUp, Zap,
    AlertTriangle, CheckCircle2, ChevronRight,
    Menu, X, Bell, PhoneOff
} from "lucide-react"

const NAV_ITEMS = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
    { id: "calls", label: "Call log", icon: <Phone size={16} /> },
    { id: "appointments", label: "Appointments", icon: <Calendar size={16} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
    { id: "calendar", label: "Calendar", icon: <Calendar size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> },
    { id: "billing", label: "Billing", icon: <CreditCard size={16} /> },
]

type Business = {
    id: string
    name: string
    ai_name: string
    type: string
    phone_number: string | null
    vapi_assistant_id: string | null
    hours_start: string
    hours_end: string
    calendar_type: string
    about?: string
}

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
    created_at: string
}

type Appointment = {
    id: string
    caller_name: string
    caller_phone: string
    type: string
    date: string
    time: string
    status: string
    created_at: string
}

type SubscriptionStatus = {
    plan: string
    status: string
    minutesUsed: number
    minutesLimit: number
    percentUsed: number
    currentPeriodEnd: string | null
    isActive: boolean
    isTrial: boolean
    isExpired: boolean
}

function timeAgo(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
    return `${Math.floor(diff / 86400)} days ago`
}

function formatDuration(seconds: number): string {
    if (!seconds) return "0:00"
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
}

function formatDate(dateStr: string): string {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const date = new Date(dateStr)
    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"
    return date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })
}

// FIX 1: Timezone-safe local date string
// toISOString() returns UTC, which rolls over 5-6 hrs early in North America.
// This adjusts for the local timezone offset so "today" matches the user's clock.
function getLocalDateString(): string {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().split("T")[0]
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; color: string }> = {
        booked: { label: "Booked", color: "bg-green-50 text-green-700 border-green-200" },
        urgent: { label: "Urgent", color: "bg-red-50 text-red-700 border-red-200" },
        textback: { label: "Text sent", color: "bg-blue-50 text-blue-700 border-blue-200" },
        completed: { label: "Completed", color: "bg-cream-2 text-ink-3 border-border" },
        info: { label: "Info only", color: "bg-cream-2 text-ink-3 border-border" },
        cancelled: { label: "Cancelled", color: "bg-cream-2 text-ink-3 border-border" },
        confirmed: { label: "Confirmed", color: "bg-green-50 text-green-700 border-green-200" },
        pending: { label: "Pending", color: "bg-gold-pale text-gold-dark border-gold-light" },
    }
    const s = map[status] || map.completed
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-sans font-500 border ${s.color}`}>
            {s.label}
        </span>
    )
}

function StatCard({ icon, label, value, sub, accent, isDark }: {
    icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean; isDark: boolean
}) {
    return (
        <div className={`rounded-xl border p-5 transition-all duration-200 hover:shadow-sm ${accent ? "bg-gold border-gold-light" : isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"
            }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${accent ? "bg-white/20 text-white" : isDark ? "bg-[#2A2A26] text-gold" : "bg-gold-pale text-gold"
                }`}>
                {icon}
            </div>
            <div className={`font-serif text-3xl mb-1 ${accent ? "text-white" : isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                {value}
            </div>
            <div className={`text-xs font-sans font-500 ${accent ? "text-white/80" : isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                {label}
            </div>
            {sub && (
                <div className={`text-2xs font-sans mt-1 ${accent ? "text-white/60" : "text-ink-3"}`}>
                    {sub}
                </div>
            )}
        </div>
    )
}

function EmptyState({ icon, title, sub, isDark }: { icon: React.ReactNode; title: string; sub: string; isDark: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isDark ? "bg-[#2A2A26] text-[#444440]" : "bg-cream-2 text-ink-3"
                }`}>
                {icon}
            </div>
            <p className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{title}</p>
            <p className="text-xs font-sans text-ink-3 max-w-xs leading-relaxed">{sub}</p>
        </div>
    )
}

export default function DashboardPage() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [active, setActive] = useState("overview")
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [business, setBusiness] = useState<Business | null>(null)
    const [calls, setCalls] = useState<Call[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [callFilter, setCallFilter] = useState("All")
    const [calendarStatus, setCalendarStatus] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [settingUp, setSettingUp] = useState(false)
    const [saving, setSaving] = useState(false)
    const [blockDate, setBlockDate] = useState("")
    const [blockReason, setBlockReason] = useState("")
    const [blockedDates, setBlockedDates] = useState<{ id: string; date: string; reason: string }[]>([])
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
    const [billingLoading, setBillingLoading] = useState(false)
    const [bellOpen, setBellOpen] = useState(false)
    const [notificationsRead, setNotificationsRead] = useState(false)
    const [settingsForm, setSettingsForm] = useState({
        aiName: "",
        aiGreeting: "",
        businessName: "",
        businessType: "",
        about: "",
        hoursStart: "09:00",
        hoursEnd: "17:00",
    })
    const [availability, setAvailability] = useState(
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => ({
            day,
            start: "09:00",
            end: "17:00",
            active: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day)
        }))
    )
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const cal = params.get("calendar")
        if (cal === "connected") setCalendarStatus("Google Calendar connected successfully!")
        if (cal === "error") setCalendarStatus("Failed to connect Google Calendar. Try again.")
    }, [])

    useEffect(() => {
        // FIX 2: try/catch/finally so a failed fetch doesn't leave the user
        // stuck on a permanent loading spinner with no way out.
        const load = async () => {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { router.push("/login"); return }

                const { data: biz } = await supabase
                    .from("businesses")
                    .select("id, name, ai_name, type, phone_number, vapi_assistant_id, hours_start, hours_end, calendar_type, about")
                    .eq("user_id", user.id)
                    .maybeSingle()

                if (!biz) { router.push("/onboarding"); return }
                setBusiness(biz)

                setSettingsForm({
                    aiName: biz.ai_name || "",
                    aiGreeting: "",
                    businessName: biz.name || "",
                    businessType: biz.type || "",
                    about: biz.about || "",
                    hoursStart: biz.hours_start || "09:00",
                    hoursEnd: biz.hours_end || "17:00",
                })

                const { data: blocked } = await supabase
                    .from("blocked_dates")
                    .select("id, date, reason")
                    .eq("business_id", biz.id)
                    .order("date", { ascending: true })
                setBlockedDates(blocked || [])

                const { data: avail } = await supabase
                    .from("availability")
                    .select("day_of_week, start_time, end_time, is_active")
                    .eq("business_id", biz.id)
                if (avail && avail.length > 0) {
                    setAvailability(prev => prev.map(a => {
                        const found = avail.find(v => v.day_of_week === a.day.toLowerCase())
                        return found ? { ...a, start: found.start_time, end: found.end_time, active: found.is_active } : a
                    }))
                }

                const { data: callData } = await supabase
                    .from("calls")
                    .select("*")
                    .eq("business_id", biz.id)
                    .order("created_at", { ascending: false })
                    .limit(50)
                setCalls(callData || [])

                const { data: aptData } = await supabase
                    .from("appointments")
                    .select("*")
                    .eq("business_id", biz.id)
                    .gte("date", new Date().toISOString().split("T")[0])
                    .order("date", { ascending: true })
                    .order("time", { ascending: true })
                    .limit(20)
                setAppointments(aptData || [])

                const subRes = await fetch("/api/stripe/status")
                if (subRes.ok) {
                    const subData = await subRes.json()
                    setSubscription(subData)
                }
            } catch (error) {
                console.error("Dashboard failed to load:", error)
                setCalendarStatus("Something went wrong loading your dashboard. Please refresh.")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/")
    }

    const handleUpgrade = async (plan: "growth" | "pro") => {
        setBillingLoading(true)
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            })
            const data = await res.json()
            if (data.url) window.location.href = data.url
            else setCalendarStatus("Failed to start checkout. Try again.")
        } catch {
            setCalendarStatus("Failed to start checkout. Try again.")
        }
        setBillingLoading(false)
    }

    const handleManageBilling = async () => {
        setBillingLoading(true)
        try {
            const res = await fetch("/api/stripe/portal")
            const data = await res.json()
            if (data.url) window.location.href = data.url
            else setCalendarStatus("Failed to open billing portal. Try again.")
        } catch {
            setCalendarStatus("Failed to open billing portal. Try again.")
        }
        setBillingLoading(false)
    }

    const completeSetup = async () => {
        if (!business) return
        setSettingUp(true)
        try {
            const res = await fetch("/api/vapi/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessName: business.name,
                    aiName: business.ai_name,
                    businessType: business.type,
                    hoursStart: business.hours_start || "09:00",
                    hoursEnd: business.hours_end || "17:00",
                    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    meetingTypes: ["Consultation"],
                    meetingDuration: 30,
                }),
            })
            const data = await res.json()
            if (data.phoneNumber) {
                setBusiness(prev => prev ? { ...prev, phone_number: data.phoneNumber, vapi_assistant_id: data.assistantId } : prev)
                setCalendarStatus("Setup complete! Your AI is now live.")
            } else {
                setCalendarStatus("Setup failed. Please try again.")
            }
        } catch {
            setCalendarStatus("Setup failed. Please try again.")
        }
        setSettingUp(false)
    }

    const saveSettings = async (section: string) => {
        setSaving(true)
        try {
            const res = await fetch("/api/business/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ai_name: settingsForm.aiName,
                    ai_greeting: settingsForm.aiGreeting,
                    name: settingsForm.businessName,
                    type: settingsForm.businessType,
                    about: settingsForm.about,
                    hours_start: settingsForm.hoursStart,
                    hours_end: settingsForm.hoursEnd,
                }),
            })
            if (res.ok) {
                setBusiness(prev => prev ? { ...prev, name: settingsForm.businessName, ai_name: settingsForm.aiName } : prev)
                setCalendarStatus(`${section} saved successfully!`)
            } else {
                setCalendarStatus("Failed to save. Try again.")
            }
        } catch { setCalendarStatus("Failed to save. Try again.") }
        setSaving(false)
    }

    async function switchToBuiltin() {
        setSaving(true)
        try {
            const res = await fetch("/api/calendar/disconnect", { method: "POST" })
            if (!res.ok) throw new Error("Failed to switch")
            setBusiness(prev => prev ? { ...prev, calendar_type: "builtin", calendar_token: null } : prev)
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    async function recreateAssistant() {
        setSaving(true)
        try {
            const res = await fetch("/api/vapi/recreate", { method: "POST" })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setBusiness(prev => prev ? {
                ...prev,
                vapi_assistant_id: data.assistantId,
                phone_number: data.phoneNumber,
            } : prev)
            alert(`Done! New number: ${data.phoneNumber}`)
        } catch (err) {
            console.error(err)
            alert("Failed to recreate assistant")
        } finally {
            setSaving(false)
        }
    }

    const saveAvailability = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/calendar/availability/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ availability }),
            })
            if (res.ok) setCalendarStatus("Availability saved!")
            else setCalendarStatus("Failed to save availability.")
        } catch { setCalendarStatus("Failed to save. Try again.") }
        setSaving(false)
    }

    const blockDateFn = async () => {
        if (!blockDate) return
        setSaving(true)
        try {
            const res = await fetch("/api/calendar/block", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: blockDate, reason: blockReason }),
            })
            if (res.ok) {
                setBlockedDates(prev => [...prev, { id: Date.now().toString(), date: blockDate, reason: blockReason }])
                setBlockDate("")
                setBlockReason("")
                setCalendarStatus("Date blocked!")
            }
        } catch { setCalendarStatus("Failed to block date.") }
        setSaving(false)
    }

    const removeBlockedDate = async (id: string) => {
        await supabase.from("blocked_dates").delete().eq("id", id)
        setBlockedDates(prev => prev.filter(b => b.id !== id))
    }

    const isDark = mounted && theme === "dark"

    // FIX 1 applied: use getLocalDateString() instead of new Date().toISOString().split("T")[0]
    const today = getLocalDateString()
    const callsToday = calls.filter(c => c.created_at?.startsWith(today))
    const bookingsToday = callsToday.filter(c => c.appointment_booked)
    const urgentCalls = calls.filter(c => c.urgent && c.created_at?.startsWith(today))
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const minutesUsed = Math.round(
        calls
            .filter(c => c.created_at >= startOfMonth)
            .reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60
    )
    const bookingRate = calls.length > 0 ? Math.round((calls.filter(c => c.appointment_booked).length / calls.length) * 100) : 0

    const filteredCalls = callFilter === "All" ? calls
        : callFilter === "Booked" ? calls.filter(c => c.appointment_booked)
            : callFilter === "Urgent" ? calls.filter(c => c.urgent)
                : calls.filter(c => !c.appointment_booked && !c.urgent)

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const weekData = weekDays.map((day, i) => {
        const d = new Date()
        d.setDate(d.getDate() - d.getDay() + i)
        const dateStr = d.toISOString().split("T")[0]
        return { day, calls: calls.filter(c => c.created_at?.startsWith(dateStr)).length }
    })
    const maxCalls = Math.max(...weekData.map(d => d.calls), 1)

    return (
        <div className={`min-h-screen flex ${isDark ? "dark bg-[#0F0F0D]" : "bg-cream"}`}>

            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* SIDEBAR */}
            <aside className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col border-r transition-transform duration-300 md:translate-x-0 md:static md:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } ${isDark ? "bg-[#0F0F0D] border-[#1A1A16]" : "bg-white border-border"}`}>

                <div className={`px-6 py-5 border-b ${isDark ? "border-[#1A1A16]" : "border-border"}`}>
                    <div className="flex items-center justify-between">
                        <Logo variant={isDark ? "dark" : "white"} size="sm" />
                        <button className="md:hidden text-ink-3" onClick={() => setSidebarOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {business && (
                    <div className={`px-6 py-4 border-b ${isDark ? "border-[#1A1A16]" : "border-border"}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center text-xs font-sans font-600 text-ink flex-shrink-0">
                                {business.name.charAt(0)}
                            </div>
                            <div>
                                <p className={`text-xs font-sans font-500 truncate ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                    {business.name}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${business.vapi_assistant_id ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
                                    <p className="text-2xs font-sans text-ink-3">
                                        {business.vapi_assistant_id ? `${business.ai_name} is live` : "Setup incomplete"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActive(item.id); setSidebarOpen(false) }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-all duration-150 text-left ${active === item.id
                                ? "bg-gold text-white font-500"
                                : isDark
                                    ? "text-[#6A6A62] hover:bg-[#1A1A16] hover:text-[#F0EFE8]"
                                    : "text-ink-3 hover:bg-cream hover:text-ink"
                                }`}
                        >
                            {item.icon}
                            {item.label}
                            {item.id === "calls" && urgentCalls.length > 0 && (
                                <span className="ml-auto w-5 h-5 bg-red-500 text-white text-2xs rounded-full flex items-center justify-center font-500">
                                    {urgentCalls.length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className={`px-3 py-4 border-t space-y-1 ${isDark ? "border-[#1A1A16]" : "border-border"}`}>
                    {mounted && (
                        <button
                            onClick={() => setTheme(isDark ? "light" : "dark")}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-all duration-150 ${isDark ? "text-[#6A6A62] hover:bg-[#1A1A16] hover:text-[#F0EFE8]" : "text-ink-3 hover:bg-cream hover:text-ink"
                                }`}
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                            {isDark ? "Light mode" : "Dark mode"}
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-all duration-150 ${isDark ? "text-[#6A6A62] hover:bg-[#1A1A16] hover:text-red-400" : "text-ink-3 hover:bg-cream hover:text-red-500"
                            }`}
                    >
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <div className="flex-1 flex flex-col min-w-0">

                <header className={`sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-4 border-b ${isDark ? "bg-[#0F0F0D] border-[#1A1A16]" : "bg-white border-border"
                    }`}>
                    <div className="flex items-center gap-4">
                        <button className="md:hidden text-ink-3" onClick={() => setSidebarOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <div>
                            <h1 className={`font-serif text-xl ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                {NAV_ITEMS.find(n => n.id === active)?.label}
                            </h1>
                            <p className="text-2xs font-sans text-ink-3 hidden md:block">
                                {new Date().toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button
                                onClick={() => { setBellOpen(p => !p); setNotificationsRead(true) }}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative ${isDark ? "hover:bg-[#1A1A16] text-[#6A6A62]" : "hover:bg-cream text-ink-3"}`}
                            >
                                <Bell size={17} />
                                {urgentCalls.length > 0 && !notificationsRead && (
                                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                                )}
                            </button>

                            {bellOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                                    <div className={`absolute right-0 top-11 z-50 w-80 rounded-xl border shadow-lg overflow-hidden ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                        <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                                            <p className={`text-xs font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Notifications</p>
                                            {urgentCalls.length > 0 && (
                                                <span className="text-2xs font-sans text-red-500 font-500">{urgentCalls.length} urgent</span>
                                            )}
                                        </div>
                                        {urgentCalls.length === 0 ? (
                                            <div className="px-4 py-8 text-center">
                                                <p className={`text-xs font-sans ${isDark ? "text-[#6A6A62]" : "text-ink-3"}`}>No urgent alerts today</p>
                                            </div>
                                        ) : (
                                            <div className="max-h-72 overflow-y-auto">
                                                {urgentCalls.map(call => (
                                                    <button
                                                        key={call.id}
                                                        onClick={() => { setActive("calls"); setBellOpen(false) }}
                                                        className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors border-b last:border-0 ${isDark ? "border-[#2A2A26] hover:bg-[#0F0F0D]" : "border-border hover:bg-cream"}`}
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <AlertTriangle size={12} className="text-red-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-sans font-500 truncate ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                                                {call.caller_name || call.caller_number || "Unknown caller"}
                                                            </p>
                                                            <p className="text-2xs font-sans text-ink-3 truncate mt-0.5">
                                                                {call.reason || "Flagged as urgent"}
                                                            </p>
                                                            <p className="text-2xs font-sans text-ink-3 mt-0.5">{timeAgo(call.created_at)}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {urgentCalls.length > 0 && (
                                            <div className={`px-4 py-2.5 border-t ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                                                <button
                                                    onClick={() => { setActive("calls"); setCallFilter("Urgent"); setBellOpen(false) }}
                                                    className="text-xs font-sans text-gold hover:text-gold-dark transition-colors"
                                                >
                                                    View all urgent calls →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="w-9 h-9 bg-gold rounded-lg flex items-center justify-center text-xs font-sans font-600 text-ink">
                            {business?.name?.charAt(0) || "B"}
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-4 md:px-8 py-6 md:py-8 overflow-auto">

                    {calendarStatus && (
                        <div className={`mb-6 px-5 py-3 rounded-lg text-sm font-sans flex items-center justify-between ${calendarStatus.includes("success") || calendarStatus.includes("saved") || calendarStatus.includes("complete") || calendarStatus.includes("blocked")
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                            {calendarStatus}
                            <button onClick={() => setCalendarStatus(null)} className="text-lg leading-none ml-4">×</button>
                        </div>
                    )}

                    {/* OVERVIEW */}
                    {active === "overview" && (
                        <div className="space-y-8 animate-[fadeIn_0.3s_ease]">

                            {!business?.vapi_assistant_id && (
                                <div className={`rounded-xl border p-5 flex items-center justify-between gap-4 ${isDark ? "bg-[#1A1A16] border-yellow-800" : "bg-yellow-50 border-yellow-200"
                                    }`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <AlertTriangle size={18} className="text-yellow-600" />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                                Setup incomplete
                                            </p>
                                            <p className="text-2xs font-sans text-ink-3">
                                                Your AI agent wasn&apos;t created yet. Complete setup to start receiving calls.
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="gold" size="sm" onClick={completeSetup} disabled={settingUp}>
                                        {settingUp ? "Setting up..." : "Complete setup →"}
                                    </Button>
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
                                <StatCard isDark={isDark} icon={<PhoneIncoming size={16} />} label="Calls today" value={String(callsToday.length)} sub={calls.length > 0 ? `${calls.length} total` : "No calls yet"} accent />
                                <StatCard isDark={isDark} icon={<Calendar size={16} />} label="Bookings today" value={String(bookingsToday.length)} sub={`${appointments.length} upcoming`} />
                                <StatCard isDark={isDark} icon={<Clock size={16} />} label="Minutes used" value={String(minutesUsed)} sub="This month" />
                                <StatCard isDark={isDark} icon={<TrendingUp size={16} />} label="Booking rate" value={calls.length > 0 ? `${bookingRate}%` : "—"} sub="Calls that book" />
                            </div>

                            <div className={`rounded-xl border p-5 flex items-center justify-between ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center font-serif text-lg font-600 text-ink">
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
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={recreateAssistant} disabled={saving}>
                                        {saving ? "Recreating..." : "Recreate"}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setActive("settings")}>
                                        Edit agent
                                    </Button>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className={`rounded-xl border ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                                        <h3 className={`font-serif text-lg ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Recent calls</h3>
                                        <button onClick={() => setActive("calls")} className="text-xs font-sans text-gold hover:text-gold-dark transition-colors flex items-center gap-1">
                                            View all <ChevronRight size={12} />
                                        </button>
                                    </div>
                                    {calls.length === 0 ? (
                                        <EmptyState isDark={isDark} icon={<Phone size={20} />} title="No calls yet" sub="Once calls come in they'll appear here in real time." />
                                    ) : (
                                        <div className="divide-y divide-border">
                                            {calls.slice(0, 4).map(call => (
                                                <div key={call.id} className={`px-5 py-3.5 flex items-center gap-3 transition-colors ${isDark ? "hover:bg-[#0F0F0D]" : "hover:bg-cream"}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-600 flex-shrink-0 ${call.urgent ? "bg-red-100 text-red-600" : "bg-gold-pale text-gold-dark"
                                                        }`}>
                                                        {(call.caller_name || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-sans font-500 truncate ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                                            {call.caller_name || call.caller_number || "Unknown"}
                                                        </p>
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

                                <div className={`rounded-xl border ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                                        <h3 className={`font-serif text-lg ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Upcoming</h3>
                                        <button onClick={() => setActive("appointments")} className="text-xs font-sans text-gold hover:text-gold-dark transition-colors flex items-center gap-1">
                                            View all <ChevronRight size={12} />
                                        </button>
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
                                                        <p className={`text-xs font-sans font-500 truncate ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                                            {apt.caller_name}
                                                        </p>
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
                    )}

                    {/* CALL LOG */}
                    {active === "calls" && (
                        <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <p className="text-sm font-sans text-ink-3">
                                    {calls.length} total call{calls.length !== 1 ? "s" : ""}
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    {["All", "Booked", "Urgent", "Missed"].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setCallFilter(f)}
                                            className={`px-3 py-1.5 text-xs font-sans rounded-lg border transition-colors ${callFilter === f
                                                ? "bg-gold text-white border-gold"
                                                : "border-border text-ink-3 hover:border-gold hover:text-gold"
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={`rounded-xl border overflow-hidden ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                {filteredCalls.length === 0 ? (
                                    <EmptyState isDark={isDark} icon={<PhoneOff size={20} />} title="No calls found" sub="Calls will appear here after your AI answers them." />
                                ) : (
                                    filteredCalls.map((call, i) => (
                                        <div
                                            key={call.id}
                                            className={`px-6 py-4 flex items-center gap-4 transition-colors ${isDark ? "hover:bg-[#0F0F0D]" : "hover:bg-cream"} ${i < filteredCalls.length - 1 ? `border-b ${isDark ? "border-[#2A2A26]" : "border-border"}` : ""
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-sans font-600 flex-shrink-0 ${call.urgent ? "bg-red-100 text-red-600" : "bg-gold-pale text-gold-dark"
                                                }`}>
                                                {(call.caller_name || "?").charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className={`text-sm font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                                        {call.caller_name || call.caller_number || "Unknown caller"}
                                                    </p>
                                                    {call.urgent && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                                                </div>
                                                <p className="text-xs font-sans text-ink-3 truncate">{call.reason || "No reason recorded"}</p>
                                            </div>
                                            <div className="hidden md:flex items-center gap-1.5 text-2xs font-sans text-ink-3 flex-shrink-0">
                                                <Clock size={11} /> {formatDuration(call.duration_seconds)}
                                            </div>
                                            <StatusBadge status={call.appointment_booked ? "booked" : call.urgent ? "urgent" : call.status} />
                                            <span className="text-2xs font-sans text-ink-3 hidden md:block whitespace-nowrap flex-shrink-0">
                                                {timeAgo(call.created_at)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* APPOINTMENTS */}
                    {active === "appointments" && (
                        <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-sans text-ink-3">
                                    {appointments.length} upcoming appointment{appointments.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <div className={`rounded-xl border overflow-hidden ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                {appointments.length === 0 ? (
                                    <EmptyState isDark={isDark} icon={<Calendar size={20} />} title="No appointments yet" sub="When your AI books appointments they'll appear here with all the details." />
                                ) : (
                                    appointments.map((apt, i) => (
                                        <div
                                            key={apt.id}
                                            className={`px-6 py-4 flex items-center gap-4 transition-colors ${isDark ? "hover:bg-[#0F0F0D]" : "hover:bg-cream"} ${i < appointments.length - 1 ? `border-b ${isDark ? "border-[#2A2A26]" : "border-border"}` : ""
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-[#2A2A26]" : "bg-gold-pale"}`}>
                                                <Calendar size={16} className="text-gold" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{apt.caller_name}</p>
                                                <p className="text-xs font-sans text-ink-3">
                                                    {apt.type} · {formatDate(apt.date)} at {apt.time}
                                                    {apt.caller_phone && ` · ${apt.caller_phone}`}
                                                </p>
                                            </div>
                                            <StatusBadge status={apt.status} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ANALYTICS */}
                    {active === "analytics" && (
                        <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard isDark={isDark} icon={<Phone size={16} />} label="Total calls" value={String(calls.length)} sub="All time" accent />
                                <StatCard isDark={isDark} icon={<CheckCircle2 size={16} />} label="Bookings" value={String(calls.filter(c => c.appointment_booked).length)} sub={`${bookingRate}% booking rate`} />
                                <StatCard isDark={isDark} icon={<Clock size={16} />} label="Minutes used" value={String(minutesUsed)} sub="All time" />
                                <StatCard isDark={isDark} icon={<Zap size={16} />} label="Urgent calls" value={String(calls.filter(c => c.urgent).length)} sub="Flagged as urgent" />
                            </div>
                            <div className={`rounded-xl border p-6 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                <h3 className={`font-serif text-lg mb-6 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Calls this week</h3>
                                {calls.length === 0 ? (
                                    <EmptyState isDark={isDark} icon={<BarChart3 size={20} />} title="No data yet" sub="Call analytics will appear here once calls start coming in." />
                                ) : (
                                    <div className="flex items-end gap-3 h-32">
                                        {weekData.map(d => (
                                            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                                                <div
                                                    className="w-full bg-gold rounded-sm transition-all duration-500"
                                                    style={{
                                                        height: d.calls > 0 ? `${(d.calls / maxCalls) * 100}%` : "4px",
                                                        opacity: d.calls > 0 ? 0.7 + (d.calls / maxCalls) * 0.3 : 0.2
                                                    }}
                                                />
                                                <span className="text-2xs font-sans text-ink-3">{d.day}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className={`rounded-xl border p-6 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                    <h3 className={`font-serif text-lg mb-4 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Call outcomes</h3>
                                    {calls.length === 0 ? (
                                        <p className="text-xs font-sans text-ink-3">No data yet</p>
                                    ) : (
                                        [
                                            ["Appointment booked", calls.filter(c => c.appointment_booked).length, "bg-green-400"],
                                            ["Urgent", calls.filter(c => c.urgent).length, "bg-red-400"],
                                            ["Info only", calls.filter(c => !c.appointment_booked && !c.urgent).length, "bg-gold"],
                                        ].map(([l, count, c]) => {
                                            const pct = calls.length > 0 ? Math.round((Number(count) / calls.length) * 100) : 0
                                            return (
                                                <div key={String(l)} className="flex items-center gap-3 mb-3">
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c}`} />
                                                    <span className="text-xs font-sans text-ink-3 flex-1">{l}</span>
                                                    <span className="text-xs font-sans text-ink-3">{count} ({pct}%)</span>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                                <div className={`rounded-xl border p-6 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                    <h3 className={`font-serif text-lg mb-4 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Your number</h3>
                                    <div className={`rounded-lg p-4 ${isDark ? "bg-[#0F0F0D]" : "bg-cream"} border ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                                        <p className="text-2xs font-sans text-ink-3 uppercase tracking-widest mb-1">LemonAssistant number</p>
                                        <p className={`font-serif text-2xl ${business?.phone_number ? "text-gold" : "text-ink-3"}`}>
                                            {business?.phone_number || "Not assigned yet"}
                                        </p>
                                        <p className="text-2xs font-sans text-ink-3 mt-1">Forward your business number to this</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CALENDAR */}
                    {active === "calendar" && (
                        <div className="space-y-6 animate-[fadeIn_0.3s_ease] max-w-2xl">
                            <div className={`rounded-xl border p-6 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Your availability</h3>
                                <p className="text-xs font-sans text-ink-3 mb-6">Set when your AI can book appointments.</p>
                                <div className="space-y-3">
                                    {availability.map((a, i) => (
                                        <div key={a.day} className={`flex items-center gap-3 p-4 rounded-lg border ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                                            <div className="w-24 flex-shrink-0">
                                                <p className={`text-xs font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{a.day}</p>
                                            </div>
                                            <input type="time" value={a.start}
                                                onChange={e => setAvailability(prev => prev.map((d, j) => j === i ? { ...d, start: e.target.value } : d))}
                                                disabled={!a.active}
                                                className={`px-3 py-1.5 text-xs font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors disabled:opacity-40 ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8]" : "bg-white border-border text-ink"}`} />
                                            <span className="text-ink-3 text-xs">→</span>
                                            <input type="time" value={a.end}
                                                onChange={e => setAvailability(prev => prev.map((d, j) => j === i ? { ...d, end: e.target.value } : d))}
                                                disabled={!a.active}
                                                className={`px-3 py-1.5 text-xs font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors disabled:opacity-40 ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8]" : "bg-white border-border text-ink"}`} />
                                            <button
                                                onClick={() => setAvailability(prev => prev.map((d, j) => j === i ? { ...d, active: !d.active } : d))}
                                                className={`ml-auto flex-shrink-0 w-10 h-5 rounded-full transition-colors ${a.active ? "bg-gold" : isDark ? "bg-[#2A2A26]" : "bg-cream-2"}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${a.active ? "translate-x-5" : "translate-x-0"}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="gold" size="sm" className="mt-6" disabled={saving} onClick={saveAvailability}>
                                    {saving ? "Saving..." : "Save availability"}
                                </Button>
                            </div>

                            <div className={`rounded-xl border p-6 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Block dates</h3>
                                <p className="text-xs font-sans text-ink-3 mb-5">Add holidays or days off — the AI won&apos;t book these dates.</p>
                                <div className="flex gap-3 flex-wrap mb-4">
                                    <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)}
                                        className={`flex-1 min-w-32 px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8]" : "bg-white border-border text-ink"}`} />
                                    <input type="text" placeholder="Reason (optional)" value={blockReason} onChange={e => setBlockReason(e.target.value)}
                                        className={`flex-1 min-w-32 px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`} />
                                    <Button variant="gold" size="sm" onClick={blockDateFn} disabled={saving || !blockDate}>Block</Button>
                                </div>
                                {blockedDates.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-2xs font-sans text-ink-3 uppercase tracking-wider mb-2">Blocked dates</p>
                                        {blockedDates.map(b => (
                                            <div key={b.id} className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${isDark ? "border-[#2A2A26] bg-[#0F0F0D]" : "border-border bg-cream"}`}>
                                                <div>
                                                    <p className={`text-xs font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{b.date}</p>
                                                    {b.reason && <p className="text-2xs font-sans text-ink-3">{b.reason}</p>}
                                                </div>
                                                <button onClick={() => removeBlockedDate(b.id)} className="text-ink-3 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={`rounded-xl border p-6 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Calendar connection</h3>
                                <p className="text-xs font-sans text-ink-3 mb-5">Connect your calendar so appointments sync automatically.</p>
                                <div className="space-y-3">
                                    {[
                                        { id: "google", label: "Google Calendar", icon: "🗓️", desc: "Bookings appear automatically in Google Calendar" },
                                        { id: "builtin", label: "Built-in calendar", icon: "⚡", desc: "View all bookings inside LemonAssistant dashboard" },
                                    ].map(cal => (
                                        <div key={cal.id} className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                                            <span className="text-2xl">{cal.icon}</span>
                                            <div className="flex-1">
                                                <p className={`text-sm font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{cal.label}</p>
                                                <p className="text-2xs text-ink-3 font-sans mt-0.5">{cal.desc}</p>
                                            </div>
                                            {cal.id === "google" ? (
                                                <a href="/api/auth/google">
                                                    <Button variant={business?.calendar_type === "google" ? "gold" : "outline"} size="sm">
                                                        {business?.calendar_type === "google" ? "Connected ✓" : "Connect"}
                                                    </Button>
                                                </a>
                                            ) : (
                                                <Button
                                                    variant={business?.calendar_type === "builtin" ? "gold" : "secondary"}
                                                    size="sm"
                                                    onClick={business?.calendar_type !== "builtin" ? switchToBuiltin : undefined}
                                                    disabled={saving || business?.calendar_type === "builtin"}
                                                >
                                                    {business?.calendar_type === "builtin" ? "Active" : "Use this"}
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS */}
                    {active === "settings" && (
                        <div className="space-y-6 animate-[fadeIn_0.3s_ease] max-w-2xl">
                            <div className={`rounded-xl border p-6 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>AI Agent</h3>
                                <p className="text-xs font-sans text-ink-3 mb-5">Customize how your AI receptionist sounds and behaves.</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase">Agent name</label>
                                        <input type="text" value={settingsForm.aiName}
                                            onChange={e => setSettingsForm(p => ({ ...p, aiName: e.target.value }))}
                                            placeholder="Lisa"
                                            className={`w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`} />
                                        <p className="text-2xs text-ink-3 font-sans mt-1">This is the name callers will hear</p>
                                    </div>
                                    <div>
                                        <label className="block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase">Custom greeting</label>
                                        <input type="text" value={settingsForm.aiGreeting}
                                            onChange={e => setSettingsForm(p => ({ ...p, aiGreeting: e.target.value }))}
                                            placeholder={`Thank you for calling ${business?.name || "us"}, this is ${business?.ai_name || "Lisa"}, how can I help?`}
                                            className={`w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`} />
                                    </div>
                                </div>
                                <Button variant="gold" size="sm" className="mt-5" disabled={saving} onClick={() => saveSettings("AI Agent")}>
                                    {saving ? "Saving..." : "Save changes"}
                                </Button>
                            </div>

                            <div className={`rounded-xl border p-6 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Business profile</h3>
                                <p className="text-xs font-sans text-ink-3 mb-5">This is what your AI knows about your business.</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase">Business name</label>
                                        <input type="text" value={settingsForm.businessName}
                                            onChange={e => setSettingsForm(p => ({ ...p, businessName: e.target.value }))}
                                            placeholder="Your business name"
                                            className={`w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`} />
                                    </div>
                                    <div>
                                        <label className="block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase">Business type</label>
                                        <select value={settingsForm.businessType}
                                            onChange={e => setSettingsForm(p => ({ ...p, businessType: e.target.value }))}
                                            className={`w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8]" : "bg-white border-border text-ink"}`}>
                                            <option value="">Select business type</option>
                                            {["Medical / Dental clinic", "Hair salon & spa", "Contractor / Builder", "Moving company", "Restaurant", "Hotel / B&B", "Real estate", "Law firm", "Repair shop", "Vet clinic", "Grocery store", "Clothing & fashion", "Accountant / Finance", "Church & place of worship", "Retail store", "Other"].map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase">
                                            About your business
                                            <span className="ml-2 normal-case tracking-normal font-400 text-2xs">Tell the AI what makes you unique</span>
                                        </label>
                                        <textarea rows={4} value={settingsForm.about}
                                            onChange={e => setSettingsForm(p => ({ ...p, about: e.target.value }))}
                                            placeholder="e.g. We are a family-owned moving company specializing in local residential moves..."
                                            className={`w-full px-4 py-3 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors resize-none leading-relaxed ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`} />
                                        <p className="text-2xs text-ink-3 font-sans mt-1">This gets added directly to your AI&apos;s knowledge</p>
                                    </div>
                                </div>
                                <Button variant="gold" size="sm" className="mt-5" disabled={saving} onClick={() => saveSettings("Business profile")}>
                                    {saving ? "Saving..." : "Save changes"}
                                </Button>
                            </div>

                            <div className={`rounded-xl border p-6 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Working hours</h3>
                                <p className="text-xs font-sans text-ink-3 mb-5">Your AI will only book appointments during these hours.</p>
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase">Opens at</label>
                                        <input type="time" value={settingsForm.hoursStart}
                                            onChange={e => setSettingsForm(p => ({ ...p, hoursStart: e.target.value }))}
                                            className={`w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8]" : "bg-white border-border text-ink"}`} />
                                    </div>
                                    <div className="text-ink-3 pb-3 font-sans">→</div>
                                    <div className="flex-1">
                                        <label className="block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase">Closes at</label>
                                        <input type="time" value={settingsForm.hoursEnd}
                                            onChange={e => setSettingsForm(p => ({ ...p, hoursEnd: e.target.value }))}
                                            className={`w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8]" : "bg-white border-border text-ink"}`} />
                                    </div>
                                </div>
                                <Button variant="gold" size="sm" className="mt-5" disabled={saving} onClick={() => saveSettings("Working hours")}>
                                    {saving ? "Saving..." : "Save changes"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* BILLING */}
                    {active === "billing" && (
                        <div className="space-y-6 animate-[fadeIn_0.3s_ease] max-w-2xl">

                            <div className={`rounded-xl border p-6 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className={`font-serif text-lg ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Current plan</h3>
                                        <p className="text-xs font-sans text-ink-3 mt-0.5">
                                            {subscription?.isActive
                                                ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} · renews ${subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "—"}`
                                                : subscription?.isExpired
                                                    ? "Trial expired — upgrade to continue"
                                                    : "Free trial"}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-sans font-500 border ${subscription?.isActive
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : subscription?.isExpired
                                            ? "bg-red-50 text-red-700 border-red-200"
                                            : "bg-gold-pale text-gold-dark border-gold-light"
                                        }`}>
                                        {subscription?.isActive
                                            ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
                                            : subscription?.isExpired ? "Expired" : "Trial"}
                                    </span>
                                </div>

                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-xs font-sans font-500 text-ink-3">Minutes used this month</p>
                                    <p className={`text-xs font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                        {subscription?.minutesUsed ?? minutesUsed} / {subscription?.minutesLimit ?? 13} min
                                    </p>
                                </div>
                                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-[#2A2A26]" : "bg-cream-2"}`}>
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${(subscription?.percentUsed ?? 0) >= 90 ? "bg-red-400" : "bg-gold"}`}
                                        style={{ width: `${Math.min(subscription?.percentUsed ?? 0, 100)}%` }}
                                    />
                                </div>
                                {(subscription?.percentUsed ?? 0) >= 80 && (
                                    <p className="text-2xs font-sans text-red-500 mt-2 flex items-center gap-1">
                                        <AlertTriangle size={10} /> You&apos;re running low on minutes
                                    </p>
                                )}

                                {subscription?.isActive && (
                                    <Button variant="outline" size="sm" className="mt-5" onClick={handleManageBilling} disabled={billingLoading}>
                                        {billingLoading ? "Loading..." : "Manage subscription →"}
                                    </Button>
                                )}
                            </div>

                            {(!subscription?.isActive || subscription?.plan === "growth") && (
                                <div className={`rounded-xl border p-6 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                                    <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                        {subscription?.isActive ? "Upgrade your plan" : "Choose a plan"}
                                    </h3>
                                    <p className="text-xs font-sans text-ink-3 mb-6">
                                        {subscription?.isExpired ? "Your trial has ended. Upgrade to keep your AI receptionist running." : "Unlock more minutes and features."}
                                    </p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {[
                                            {
                                                id: "growth" as const,
                                                name: "Growth",
                                                price: "$99",
                                                mins: "250 minutes",
                                                features: ["AI receptionist", "Appointment booking", "SMS confirmations", "Call summaries", "Analytics dashboard"],
                                                current: subscription?.plan === "growth" && subscription?.isActive,
                                            },
                                            {
                                                id: "pro" as const,
                                                name: "Pro",
                                                price: "$199",
                                                mins: "600 minutes",
                                                features: ["Everything in Growth", "Custom AI voice", "Multi-language", "Review collection", "Priority support"],
                                                featured: true,
                                                current: subscription?.plan === "pro" && subscription?.isActive,
                                            },
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
                                                    <Button variant="outline" size="sm" className="w-full" disabled>
                                                        Current plan
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant={plan.featured ? "gold" : "secondary"}
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => handleUpgrade(plan.id)}
                                                        disabled={billingLoading}
                                                    >
                                                        {billingLoading ? "Loading..." : `Upgrade to ${plan.name} →`}
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {subscription?.isActive && subscription?.plan === "pro" && (
                                <div className={`rounded-xl border p-6 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
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
                    )}

                </main>
            </div>
        </div>
    )
}