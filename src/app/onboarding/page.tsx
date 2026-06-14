"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/button"
import {
    Building2, Clock, Calendar, Phone,
    CheckCircle2, ChevronRight, ChevronLeft
} from "lucide-react"

const BUSINESS_TYPES = [
    "Medical / Dental clinic", "Hair salon & spa", "Contractor / Builder",
    "Moving company", "Restaurant", "Hotel / B&B", "Real estate",
    "Law firm", "Repair shop", "Vet clinic", "Grocery store",
    "Clothing & fashion", "Accountant / Finance", "Church & place of worship",
    "Retail store", "Other"
]

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const MEETING_TYPES = [
    "Consultation", "Appointment", "Viewing", "Estimate",
    "Reservation", "Service call", "Follow-up", "Other"
]

const CALENDARS = [
    { id: "google", label: "Google Calendar", icon: "🗓️", desc: "Bookings appear automatically in Google Calendar" },
    { id: "builtin", label: "Use built-in calendar", icon: "⚡", desc: "View all bookings inside your LemonAssistant dashboard" },
]

const steps = [
    { n: 1, label: "Business", icon: <Building2 size={14} /> },
    { n: 2, label: "Schedule", icon: <Clock size={14} /> },
    { n: 3, label: "Calendar", icon: <Calendar size={14} /> },
    { n: 4, label: "Go live", icon: <Phone size={14} /> },
]

export default function OnboardingPage() {
    const router = useRouter()
    const supabase = createClient()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [attempted, setAttempted] = useState(false)

    const [form, setForm] = useState({
        name: "",
        type: "",
        aiName: "Lisa",
        hoursStart: "09:00",
        hoursEnd: "17:00",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        meetingTypes: ["Consultation"],
        meetingDuration: 30,
        calendarType: "builtin",
    })

    const update = (key: string, value: unknown) =>
        setForm(f => ({ ...f, [key]: value }))

    const toggleDay = (day: string) => {
        update("workingDays", form.workingDays.includes(day)
            ? form.workingDays.filter(d => d !== day)
            : [...form.workingDays, day])
    }

    const toggleMeeting = (type: string) => {
        update("meetingTypes", form.meetingTypes.includes(type)
            ? form.meetingTypes.filter(t => t !== type)
            : [...form.meetingTypes, type])
    }

    const canNext = () => {
        if (step === 1) return form.name.trim() && form.type
        if (step === 2) return form.workingDays.length > 0 && form.meetingTypes.length > 0
        return true
    }

    const handleNext = () => {
        if (!canNext()) {
            setAttempted(true)
            return
        }
        setAttempted(false)
        setStep(s => s + 1)
    }

    const handleFinish = async () => {
        setLoading(true)
        setError("")

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push("/login"); return }

        const { data: existing } = await supabase
            .from("businesses")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle()

        let dbError
        if (existing) {
            const { error: updateError } = await supabase
                .from("businesses")
                .update({
                    name: form.name,
                    type: form.type,
                    ai_name: form.aiName,
                    hours_start: form.hoursStart,
                    hours_end: form.hoursEnd,
                    working_days: form.workingDays,
                    meeting_types: form.meetingTypes,
                    meeting_duration: form.meetingDuration,
                    calendar_type: form.calendarType,
                    onboarding_complete: true,
                })
                .eq("user_id", user.id)
            dbError = updateError
        } else {
            const { error: insertError } = await supabase
                .from("businesses")
                .insert({
                    user_id: user.id,
                    name: form.name,
                    type: form.type,
                    ai_name: form.aiName,
                    hours_start: form.hoursStart,
                    hours_end: form.hoursEnd,
                    working_days: form.workingDays,
                    meeting_types: form.meetingTypes,
                    meeting_duration: form.meetingDuration,
                    calendar_type: form.calendarType,
                    onboarding_complete: true,
                })
            dbError = insertError
        }

        if (dbError) { setError(dbError.message); setLoading(false); return }

        try {
            const res = await fetch("/api/vapi/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessName: form.name,
                    aiName: form.aiName,
                    businessType: form.type,
                    hoursStart: form.hoursStart,
                    hoursEnd: form.hoursEnd,
                    workingDays: form.workingDays,
                    meetingTypes: form.meetingTypes,
                    meetingDuration: form.meetingDuration,
                }),
            })

            const data = await res.json()
            if (data.phoneNumber) setPhoneNumber(data.phoneNumber)
        } catch (err) {
            console.error("Vapi setup error:", err)
        }

        router.push("/dashboard")
    }

    return (
        <div className="min-h-screen bg-cream flex flex-col overflow-x-hidden">

            {/* TOP NAV */}
            <div className="bg-white border-b border-border px-4 md:px-8 py-4 flex items-center justify-between gap-4">
                <Logo variant="white" size="sm" />
                <div className="flex items-center gap-1 md:gap-2">
                    {steps.map((s, i) => (
                        <div key={s.n} className="flex items-center gap-1 md:gap-2">
                            <div className={`flex items-center gap-1.5 rounded-full transition-all duration-300 ${step === s.n
                                ? "bg-gold text-white px-3 py-1.5"
                                : step > s.n
                                    ? "bg-gold-pale text-gold w-7 h-7 justify-center"
                                    : "bg-cream-2 text-ink-3 w-7 h-7 justify-center"
                                }`}>
                                {step > s.n ? <CheckCircle2 size={13} /> : s.icon}
                                {step === s.n && (
                                    <span className="text-xs font-sans font-500 hidden sm:inline">{s.label}</span>
                                )}
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-3 md:w-6 h-px transition-colors duration-300 ${step > s.n ? "bg-gold" : "bg-border"}`} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="text-xs font-sans text-ink-3 whitespace-nowrap">{step} / 4</div>
            </div>

            {/* PROGRESS BAR */}
            <div className="h-0.5 bg-border">
                <div
                    className="h-full bg-gold transition-all duration-500 ease-out"
                    style={{ width: `${(step / 4) * 100}%` }}
                />
            </div>

            {/* CONTENT */}
            <div className="flex-1 flex items-start md:items-center justify-center px-4 md:px-6 py-8 md:py-12">
                <div className="w-full max-w-lg">

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div>
                            <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Step 1 of 4</p>
                            <h1 className="font-serif text-4xl md:text-5xl text-ink mb-2 leading-[1.1]">
                                Tell us about<br /><em className="text-gold not-italic">your business.</em>
                            </h1>
                            <p className="text-sm font-sans text-ink-3 mb-8 leading-relaxed">
                                This helps us personalize your AI receptionist to sound exactly like your business.
                            </p>
                            <div className="bg-white border border-border rounded-xl p-6 md:p-8 space-y-6">
                                <div>
                                    <label className="block text-2xs font-sans font-500 text-ink mb-2 tracking-[0.12em] uppercase">Business name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => { update("name", e.target.value); setAttempted(false) }}
                                        placeholder="e.g. Smith Moving Co."
                                        className={`w-full px-4 py-3 text-sm font-sans border rounded-lg bg-white text-ink placeholder:text-ink-3 focus:outline-none transition-colors ${attempted && !form.name.trim() ? "border-red-400 focus:border-red-400" : "border-border focus:border-gold"}`}
                                    />
                                    {attempted && !form.name.trim() && (
                                        <p className="text-2xs text-red-500 font-sans mt-1.5">Please enter your business name</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-2xs font-sans font-500 text-ink mb-3 tracking-[0.12em] uppercase">
                                        Business type
                                        <span className="ml-1 text-red-400">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {BUSINESS_TYPES.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => { update("type", type); setAttempted(false) }}
                                                className={`px-3 py-2.5 text-xs font-sans rounded-lg border transition-all duration-150 text-left ${form.type === type
                                                    ? "bg-gold-pale border-gold text-gold-dark font-500"
                                                    : attempted && !form.type
                                                        ? "bg-white border-red-200 text-ink-3 hover:border-gold-light hover:bg-gold-pale/50"
                                                        : "bg-white border-border text-ink-3 hover:border-gold-light hover:bg-gold-pale/50"
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    {attempted && !form.type && (
                                        <p className="text-2xs text-red-500 font-sans mt-2">Please select a business type to continue</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-2xs font-sans font-500 text-ink mb-2 tracking-[0.12em] uppercase">
                                        AI receptionist name
                                        <span className="ml-2 text-ink-3 normal-case tracking-normal font-400 text-2xs">What should callers hear?</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.aiName}
                                        onChange={e => update("aiName", e.target.value)}
                                        placeholder="Lisa"
                                        className="w-full px-4 py-3 text-sm font-sans border border-border rounded-lg bg-white text-ink placeholder:text-ink-3 focus:outline-none focus:border-gold transition-colors"
                                    />
                                    <p className="text-2xs text-ink-3 font-sans mt-1.5">Default is Lisa — change to anything you like</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div>
                            <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Step 2 of 4</p>
                            <h1 className="font-serif text-4xl md:text-5xl text-ink mb-2 leading-[1.1]">
                                Set your<br /><em className="text-gold not-italic">schedule.</em>
                            </h1>
                            <p className="text-sm font-sans text-ink-3 mb-8 leading-relaxed">
                                Your AI will only book appointments during these hours and days.
                            </p>
                            <div className="bg-white border border-border rounded-xl p-6 md:p-8 space-y-6">
                                <div>
                                    <label className="block text-2xs font-sans font-500 text-ink mb-3 tracking-[0.12em] uppercase">Working hours</label>
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <p className="text-2xs text-ink-3 font-sans mb-1.5">Opens at</p>
                                            <input
                                                type="time"
                                                value={form.hoursStart}
                                                onChange={e => update("hoursStart", e.target.value)}
                                                className="w-full px-4 py-3 text-sm font-sans border border-border rounded-lg bg-white text-ink focus:outline-none focus:border-gold transition-colors"
                                            />
                                        </div>
                                        <div className="text-ink-3 pb-3">→</div>
                                        <div className="flex-1">
                                            <p className="text-2xs text-ink-3 font-sans mb-1.5">Closes at</p>
                                            <input
                                                type="time"
                                                value={form.hoursEnd}
                                                onChange={e => update("hoursEnd", e.target.value)}
                                                className="w-full px-4 py-3 text-sm font-sans border border-border rounded-lg bg-white text-ink focus:outline-none focus:border-gold transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-2xs font-sans font-500 text-ink mb-3 tracking-[0.12em] uppercase">Working days</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {DAYS.map(day => (
                                            <button
                                                key={day}
                                                onClick={() => toggleDay(day)}
                                                className={`px-3 py-2 text-xs font-sans rounded-lg border transition-all duration-150 ${form.workingDays.includes(day)
                                                    ? "bg-gold-pale border-gold text-gold-dark font-500"
                                                    : "bg-white border-border text-ink-3 hover:border-gold-light"
                                                    }`}
                                            >
                                                {day.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                    {attempted && form.workingDays.length === 0 && (
                                        <p className="text-2xs text-red-500 font-sans mt-2">Please select at least one working day</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-2xs font-sans font-500 text-ink mb-3 tracking-[0.12em] uppercase">Appointment types</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {MEETING_TYPES.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => toggleMeeting(type)}
                                                className={`px-3 py-2.5 text-xs font-sans rounded-lg border transition-all duration-150 text-left ${form.meetingTypes.includes(type)
                                                    ? "bg-gold-pale border-gold text-gold-dark font-500"
                                                    : "bg-white border-border text-ink-3 hover:border-gold-light hover:bg-gold-pale/50"
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    {attempted && form.meetingTypes.length === 0 && (
                                        <p className="text-2xs text-red-500 font-sans mt-2">Please select at least one appointment type</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-2xs font-sans font-500 text-ink mb-3 tracking-[0.12em] uppercase">Default appointment duration</label>
                                    <div className="flex gap-2">
                                        {[15, 30, 45, 60, 90].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => update("meetingDuration", d)}
                                                className={`flex-1 py-2.5 text-xs font-sans rounded-lg border transition-all duration-150 ${form.meetingDuration === d
                                                    ? "bg-gold-pale border-gold text-gold-dark font-500"
                                                    : "bg-white border-border text-ink-3 hover:border-gold-light"
                                                    }`}
                                            >
                                                {d}m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <div>
                            <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Step 3 of 4</p>
                            <h1 className="font-serif text-4xl md:text-5xl text-ink mb-2 leading-[1.1]">
                                Connect your<br /><em className="text-gold not-italic">calendar.</em>
                            </h1>
                            <p className="text-sm font-sans text-ink-3 mb-8 leading-relaxed">
                                Your AI checks real availability and books directly into your calendar. No double bookings, ever.
                            </p>
                            <div className="bg-white border border-border rounded-xl p-6 md:p-8">
                                <div className="space-y-3">
                                    {CALENDARS.map(cal => (
                                        <button
                                            key={cal.id}
                                            onClick={() => update("calendarType", cal.id)}
                                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-150 text-left ${form.calendarType === cal.id
                                                ? "bg-gold-pale border-gold"
                                                : "bg-white border-border hover:border-gold-light hover:bg-gold-pale/30"
                                                }`}
                                        >
                                            <span className="text-2xl">{cal.icon}</span>
                                            <div className="flex-1">
                                                <p className={`text-sm font-sans font-500 ${form.calendarType === cal.id ? "text-gold-dark" : "text-ink"}`}>
                                                    {cal.label}
                                                </p>
                                                <p className="text-2xs text-ink-3 font-sans mt-0.5">{cal.desc}</p>
                                            </div>
                                            {form.calendarType === cal.id && (
                                                <CheckCircle2 size={18} className="text-gold flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {form.calendarType === "google" && (
                                    <div className="mt-5 p-4 bg-gold-pale border border-gold-light rounded-lg">
                                        <p className="text-xs font-sans text-gold-dark leading-relaxed">
                                            🗓️ You&apos;ll connect Google Calendar from your dashboard after setup is complete.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 4 */}
                    {step === 4 && (
                        <div>
                            <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Step 4 of 4</p>
                            <h1 className="font-serif text-4xl md:text-5xl text-ink mb-2 leading-[1.1]">
                                You&apos;re almost<br /><em className="text-gold not-italic">live.</em>
                            </h1>
                            <p className="text-sm font-sans text-ink-3 mb-8 leading-relaxed">
                                One last step — forward your calls to your LemonAssistant number and your AI is live.
                            </p>
                            <div className="bg-white border border-border rounded-xl p-6 md:p-8 space-y-6">
                                <div className="bg-ink rounded-xl p-5 text-center">
                                    <p className="text-2xs font-sans text-ink-3 uppercase tracking-widest mb-2">Your LemonAssistant number</p>
                                    <p className="font-serif text-3xl text-gold tracking-wider">
                                        {phoneNumber || "Will be assigned on setup"}
                                    </p>
                                    <p className="text-2xs font-sans text-ink-3 mt-2">Forward your existing number to this</p>
                                </div>
                                <div>
                                    <p className="text-2xs font-sans font-500 text-ink mb-4 tracking-[0.12em] uppercase">How to set up call forwarding</p>
                                    <div className="space-y-3">
                                        {[
                                            { device: "📱 iPhone", steps: "Settings → Phone → Call Forwarding → Enter your LemonAssistant number" },
                                            { device: "🤖 Android", steps: "Phone app → Settings → Supplementary Services → Call Forwarding" },
                                            { device: "☎️ Any carrier", steps: "Dial *72 followed by your LemonAssistant number and press call" },
                                        ].map(item => (
                                            <div key={item.device} className="flex gap-3 p-4 bg-cream rounded-lg border border-border">
                                                <span className="text-base flex-shrink-0">{item.device.split(" ")[0]}</span>
                                                <div>
                                                    <p className="text-xs font-sans font-500 text-ink mb-0.5">{item.device.split(" ").slice(1).join(" ")}</p>
                                                    <p className="text-2xs font-sans text-ink-3 leading-relaxed">{item.steps}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-gold-pale border border-gold-light rounded-lg">
                                    <CheckCircle2 size={16} className="text-gold flex-shrink-0 mt-0.5" />
                                    <p className="text-xs font-sans text-gold-dark leading-relaxed">
                                        Your AI receptionist will answer as <strong>{form.aiName}</strong> for <strong>{form.name || "your business"}</strong>. You can change everything from your dashboard anytime.
                                    </p>
                                </div>
                                {error && <p className="text-xs text-red-500 font-sans">{error}</p>}
                            </div>
                        </div>
                    )}

                    {/* NAV BUTTONS */}
                    <div className="flex justify-between items-center mt-8 pb-8">
                        <button
                            onClick={() => { setStep(s => s - 1); setAttempted(false) }}
                            className={`flex items-center gap-2 text-sm font-sans text-ink-3 hover:text-ink transition-colors ${step === 1 ? "invisible" : ""}`}
                        >
                            <ChevronLeft size={16} /> Back
                        </button>
                        {step < 4 ? (
                            <Button
                                variant="gold"
                                size="lg"
                                onClick={handleNext}
                                className="flex items-center gap-2"
                            >
                                Continue <ChevronRight size={16} />
                            </Button>
                        ) : (
                            <Button
                                variant="gold"
                                size="lg"
                                onClick={handleFinish}
                                disabled={loading}
                            >
                                {loading ? "Setting up..." : "Go live →"}
                            </Button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}