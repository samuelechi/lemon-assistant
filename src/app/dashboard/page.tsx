"use client"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Sidebar } from "./components/Sidebar"
import { Header } from "./components/Header"
import { OverviewTab } from "./components/tabs/OverviewTab"
import { CallsTab } from "./components/tabs/CallsTab"
import { AppointmentsTab } from "./components/tabs/AppointmentsTab"
import { AnalyticsTab } from "./components/tabs/AnalyticsTab"
import { CalendarTab } from "./components/tabs/CalendarTab"
import { SettingsTab } from "./components/tabs/SettingsTab"
import { BillingTab } from "./components/tabs/BillingTab"

type Business = {
    id: string; name: string; ai_name: string; type: string
    phone_number: string | null; vapi_assistant_id: string | null
    hours_start: string; hours_end: string; calendar_type: string
    about?: string; notification_phone?: string
    voice_id?: string | null
    language?: string | null
    review_url?: string | null
}
type Call = { id: string; caller_name: string; caller_number: string; reason: string; status: string; urgent: boolean; duration_seconds: number; appointment_booked: boolean; summary: string; transcript: string; created_at: string }
type Appointment = { id: string; caller_name: string; caller_phone: string; type: string; date: string; time: string; status: string; created_at: string }
type SubscriptionStatus = { plan: string; status: string; minutesUsed: number; minutesLimit: number; percentUsed: number; currentPeriodEnd: string | null; isActive: boolean; isTrial: boolean; isExpired: boolean }

function getLocalDateString() {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().split("T")[0]
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
    const [toast, setToast] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [settingUp, setSettingUp] = useState(false)
    const [saving, setSaving] = useState(false)
    const [blockDate, setBlockDate] = useState("")
    const [blockReason, setBlockReason] = useState("")
    const [blockedDates, setBlockedDates] = useState<{ id: string; date: string; reason: string }[]>([])
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
    const [billingLoading, setBillingLoading] = useState(false)
    const [upgradeProvince, setUpgradeProvince] = useState("")
    const [isPro, setIsPro] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [settingsForm, setSettingsForm] = useState({
        aiName: "", aiGreeting: "", businessName: "", businessType: "",
        about: "", hoursStart: "09:00", hoursEnd: "17:00", notificationPhone: "",
    })
    const [availability, setAvailability] = useState(
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => ({
            day, start: "09:00", end: "17:00",
            active: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day)
        }))
    )
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        const handler = (e: Event) => setActive((e as CustomEvent).detail)
        window.addEventListener("lemon:nav", handler)
        return () => window.removeEventListener("lemon:nav", handler)
    }, [])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const cal = params.get("calendar")
        if (cal === "connected") setToast("Google Calendar connected successfully!")
        if (cal === "error") setToast("Failed to connect Google Calendar. Try again.")
        const activation = params.get("activation")
        if (activation === "success") setToast("Trial activated! Your number will be assigned shortly.")
        if (activation === "cancelled") setToast("Activation cancelled. You can try again anytime.")
    }, [])

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { router.push("/login"); return }

                setUserEmail(user.email ?? null)

                const { data: biz } = await supabase
                    .from("businesses")
                    .select("id, name, ai_name, type, phone_number, vapi_assistant_id, hours_start, hours_end, calendar_type, about, notification_phone, voice_id, language, review_url")
                    .eq("user_id", user.id)
                    .maybeSingle()
                if (!biz) { router.push("/onboarding"); return }
                setBusiness(biz)

                setSettingsForm({
                    aiName: biz.ai_name || "", aiGreeting: "",
                    businessName: biz.name || "", businessType: biz.type || "",
                    about: biz.about || "", hoursStart: biz.hours_start || "09:00",
                    hoursEnd: biz.hours_end || "17:00", notificationPhone: biz.notification_phone || "",
                })

                const { data: blocked } = await supabase.from("blocked_dates").select("id, date, reason").eq("business_id", biz.id).order("date", { ascending: true })
                setBlockedDates(blocked || [])

                const { data: avail } = await supabase.from("availability").select("day_of_week, start_time, end_time, is_active").eq("business_id", biz.id)
                if (avail?.length) {
                    setAvailability(prev => prev.map(a => {
                        const found = avail.find(v => v.day_of_week === a.day.toLowerCase())
                        return found ? { ...a, start: found.start_time, end: found.end_time, active: found.is_active } : a
                    }))
                }

                const { data: callData } = await supabase.from("calls").select("*").eq("business_id", biz.id).order("created_at", { ascending: false }).limit(50)
                setCalls(callData || [])

                const localToday = new Date(); localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset())
                const { data: aptData } = await supabase.from("appointments").select("*").eq("business_id", biz.id).gte("date", localToday.toISOString().split("T")[0]).order("date", { ascending: true }).order("time", { ascending: true }).limit(20)
                setAppointments(aptData || [])

                const subRes = await fetch("/api/stripe/status")
                if (subRes.ok) {
                    const subData = await subRes.json()
                    setSubscription(subData)
                    setIsPro(subData.status === "active" && subData.plan === "pro")
                }
            } catch (err) {
                console.error("Dashboard load error:", err)
                setToast("Something went wrong loading your dashboard. Please refresh.")
            } finally { setLoading(false) }
        }
        load()
    }, [])

    useEffect(() => {
        if (active !== "billing") return
        fetch("/api/stripe/status").then(r => r.ok ? r.json() : null).then(d => { if (d) setSubscription(d) }).catch(() => { })
    }, [active])

    const handleLogout = async () => { await supabase.auth.signOut(); router.push("/") }

    const handleUpgrade = async (plan: "growth" | "pro", country: string) => {
        if (!business?.phone_number && !country) { setToast("Please select your country first."); return }
        setBillingLoading(true)
        try {
            const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, country: country || "existing" }) })
            const data = await res.json()
            if (data.url) window.location.href = data.url
            else setToast("Failed to start checkout. Try again.")
        } catch { setToast("Failed to start checkout. Try again.") }
        setBillingLoading(false)
    }

    const handleActivate = async (country: string) => {
        setBillingLoading(true)
        try {
            const res = await fetch("/api/stripe/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country }) })
            const data = await res.json()
            if (data.url) window.location.href = data.url
            else setToast("Failed to start activation. Try again.")
        } catch { setToast("Failed to start activation. Try again.") }
        setBillingLoading(false)
    }

    const handleManageBilling = async () => {
        setBillingLoading(true)
        try {
            const res = await fetch("/api/stripe/portal")
            const data = await res.json()
            if (data.url) window.location.href = data.url
            else setToast("Failed to open billing portal. Try again.")
        } catch { setToast("Failed to open billing portal. Try again.") }
        setBillingLoading(false)
    }

    const completeSetup = async () => {
        if (!business) return
        setSettingUp(true)
        try {
            const res = await fetch("/api/vapi/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: business.name, aiName: business.ai_name, businessType: business.type, hoursStart: business.hours_start || "09:00", hoursEnd: business.hours_end || "17:00", workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], meetingTypes: ["Consultation"], meetingDuration: 30 }) })
            const data = await res.json()
            if (data.assistantId) { setBusiness(prev => prev ? { ...prev, vapi_assistant_id: data.assistantId } : prev); setToast("Setup complete! Activate your trial to get your phone number.") }
            else setToast("Setup failed. Please try again.")
        } catch { setToast("Setup failed. Please try again.") }
        setSettingUp(false)
    }

    const saveSettings = async (section: string) => {
        setSaving(true)
        try {
            const res = await fetch("/api/business/update", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ai_name: settingsForm.aiName, ai_greeting: settingsForm.aiGreeting,
                    name: settingsForm.businessName, type: settingsForm.businessType,
                    about: settingsForm.about, hours_start: settingsForm.hoursStart,
                    hours_end: settingsForm.hoursEnd, notification_phone: settingsForm.notificationPhone,
                }),
            })
            if (res.ok) {
                setBusiness(prev => prev ? { ...prev, name: settingsForm.businessName, ai_name: settingsForm.aiName } : prev)
                setToast(`${section} saved successfully!`)
            } else setToast("Failed to save. Try again.")
        } catch { setToast("Failed to save. Try again.") }
        setSaving(false)
    }

    const saveVoice = async (voiceId: string) => {
        const res = await fetch("/api/business/update", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ voice_id: voiceId }),
        })
        if (res.ok) { setBusiness(prev => prev ? { ...prev, voice_id: voiceId } : prev); setToast("Voice saved!") }
        else { const d = await res.json(); setToast(d.error || "Failed to save voice.") }
    }

    const saveLanguage = async (language: string) => {
        const res = await fetch("/api/business/update", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language }),
        })
        if (res.ok) { setBusiness(prev => prev ? { ...prev, language } : prev); setToast("Language saved!") }
        else { const d = await res.json(); setToast(d.error || "Failed to save language.") }
    }

    const saveReviewUrl = async (review_url: string) => {
        const res = await fetch("/api/business/update", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ review_url }),
        })
        if (res.ok) { setBusiness(prev => prev ? { ...prev, review_url } : prev); setToast("Review link saved!") }
        else { const d = await res.json(); setToast(d.error || "Failed to save review link.") }
    }

    const saveAvailability = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/calendar/availability/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ availability }) })
            if (res.ok) setToast("Availability saved!"); else setToast("Failed to save availability.")
        } catch { setToast("Failed to save. Try again.") }
        setSaving(false)
    }

    const switchToBuiltin = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/calendar/disconnect", { method: "POST" })
            if (res.ok) setBusiness(prev => prev ? { ...prev, calendar_type: "builtin" } : prev)
        } catch (err) { console.error(err) }
        setSaving(false)
    }

    const blockDateFn = async () => {
        if (!blockDate) return
        setSaving(true)
        try {
            const res = await fetch("/api/calendar/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: blockDate, reason: blockReason }) })
            if (res.ok) { setBlockedDates(prev => [...prev, { id: Date.now().toString(), date: blockDate, reason: blockReason }]); setBlockDate(""); setBlockReason(""); setToast("Date blocked!") }
        } catch { setToast("Failed to block date.") }
        setSaving(false)
    }

    const removeBlockedDate = async (id: string) => {
        await supabase.from("blocked_dates").delete().eq("id", id)
        setBlockedDates(prev => prev.filter(b => b.id !== id))
    }

    const isDark = mounted && theme === "dark"
    const today = getLocalDateString()
    const callsToday = calls.filter(c => c.created_at?.startsWith(today))
    const bookingsToday = callsToday.filter(c => c.appointment_booked)
    const urgentCalls = calls.filter(c => c.urgent && c.created_at?.startsWith(today))
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const minutesUsed = Math.round(calls.filter(c => c.created_at >= startOfMonth).reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60)
    const bookingRate = calls.length > 0 ? Math.round((calls.filter(c => c.appointment_booked).length / calls.length) * 100) : 0

    if (loading) return (
        <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0F0F0D]" : "bg-cream"}`}>
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
    )

    return (
        <div className={`min-h-screen flex ${isDark ? "dark bg-[#0F0F0D]" : "bg-cream"}`}>
            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

            <Sidebar
                active={active} isDark={isDark} mounted={mounted} sidebarOpen={sidebarOpen}
                business={business} urgentCount={urgentCalls.length}
                onNav={setActive} onClose={() => setSidebarOpen(false)}
                onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
                onLogout={handleLogout}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    active={active} isDark={isDark} business={business} urgentCalls={urgentCalls}
                    onMenuOpen={() => setSidebarOpen(true)} onNavTo={setActive}
                    onFilterUrgent={() => setCallFilter("Urgent")}
                />

                <main className="flex-1 px-4 md:px-8 py-6 md:py-8 overflow-auto" style={{ backgroundImage: "radial-gradient(1000px 560px at 100% -5%, rgba(196,154,0,0.06), transparent 60%)" }}>
                    {toast && (
                        <div className={`mb-6 px-5 py-3 rounded-lg text-sm font-sans flex items-center justify-between ${toast.includes("success") || toast.includes("saved") || toast.includes("complete") ||
                            toast.includes("blocked") || toast.includes("Trial") || toast.includes("Voice") ||
                            toast.includes("Language") || toast.includes("Review") || toast.includes("Password")
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"}`}>
                            {toast}
                            <button onClick={() => setToast(null)} className="text-lg leading-none ml-4">×</button>
                        </div>
                    )}

                    {active === "overview" && <OverviewTab isDark={isDark} business={business} calls={calls} appointments={appointments} callsToday={callsToday} bookingsToday={bookingsToday} minutesUsed={minutesUsed} bookingRate={bookingRate} subscription={subscription} settingUp={settingUp} onCompleteSetup={completeSetup} onNavTo={setActive} />}
                    {active === "calls" && <CallsTab isDark={isDark} calls={calls} callFilter={callFilter} onFilterChange={setCallFilter} />}
                    {active === "appointments" && <AppointmentsTab isDark={isDark} appointments={appointments} />}
                    {active === "analytics" && <AnalyticsTab isDark={isDark} calls={calls} business={business} minutesUsed={minutesUsed} bookingRate={bookingRate} />}
                    {active === "calendar" && <CalendarTab isDark={isDark} business={business} saving={saving} availability={availability} blockDate={blockDate} blockReason={blockReason} blockedDates={blockedDates} onAvailabilityChange={setAvailability} onBlockDateChange={setBlockDate} onBlockReasonChange={setBlockReason} onSaveAvailability={saveAvailability} onBlockDate={blockDateFn} onRemoveBlockedDate={removeBlockedDate} onSwitchToBuiltin={switchToBuiltin} />}
                    {active === "settings" && (
                        <SettingsTab
                            isDark={isDark} saving={saving} isPro={isPro}
                            form={settingsForm}
                            currentVoiceId={business?.voice_id ?? null}
                            currentLanguage={business?.language ?? null}
                            currentReviewUrl={business?.review_url ?? null}
                            userEmail={userEmail}
                            onFormChange={updates => setSettingsForm(p => ({ ...p, ...updates }))}
                            onSave={saveSettings}
                            onSaveVoice={saveVoice}
                            onSaveLanguage={saveLanguage}
                            onSaveReviewUrl={saveReviewUrl}
                        />
                    )}
                    {active === "billing" && <BillingTab isDark={isDark} business={business} subscription={subscription} minutesUsed={minutesUsed} billingLoading={billingLoading} upgradeProvince={upgradeProvince} onUpgradeProvinceChange={setUpgradeProvince} onUpgrade={handleUpgrade} onManageBilling={handleManageBilling} onActivate={handleActivate} onSetStatus={setToast} />}
                </main>
            </div>
        </div>
    )
}