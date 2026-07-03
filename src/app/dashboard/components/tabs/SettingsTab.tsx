"use client"
import { useState, useRef, useEffect } from "react"
import { Play, Pause, Lock, Check, Mic, Globe, Star, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ELEVENLABS_VOICES, type ElevenLabsVoice } from "@/lib/elevenlabs-voices"
import { SUPPORTED_LANGUAGES } from "@/lib/vapi"
import { createClient } from "@/lib/supabase/client"
import CancelFlow from "@/components/settings/CancelFlow"
type SettingsForm = {
    aiName: string; aiGreeting: string; businessName: string; businessType: string
    about: string; hoursStart: string; hoursEnd: string; notificationPhone: string
}

type Props = {
    isDark: boolean; saving: boolean; isPro: boolean
    form: SettingsForm; currentVoiceId: string | null; currentLanguage: string | null
    currentReviewUrl: string | null; userEmail: string | null
    onFormChange: (updates: Partial<SettingsForm>) => void
    onSave: (section: string) => void
    onSaveVoice: (voiceId: string) => Promise<void>
    onSaveLanguage: (language: string) => Promise<void>
    onSaveReviewUrl: (url: string) => Promise<void>
}

// ─── Voice Picker ─────────────────────────────────────────────────────────────

function VoicePicker({ isDark, isPro, currentVoiceId, onSave }: {
    isDark: boolean; isPro: boolean; currentVoiceId: string | null
    onSave: (id: string) => Promise<void>
}) {
    const [selected, setSelected] = useState<string>(currentVoiceId || "21m00Tcm4TlvDq8ikWAM")
    const [playing, setPlaying] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [genderFilter, setGenderFilter] = useState<"all" | "female" | "male">("all")
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const filtered = ELEVENLABS_VOICES.filter(v => genderFilter === "all" || v.gender === genderFilter)
    const isDirty = selected !== (currentVoiceId || "21m00Tcm4TlvDq8ikWAM")
    const cardCls = `rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`

    function playPreview(voice: ElevenLabsVoice) {
        if (playing === voice.id) { audioRef.current?.pause(); setPlaying(null); return }
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = "" }
        const audio = new Audio(voice.previewUrl)
        audioRef.current = audio
        audio.onended = () => setPlaying(null)
        audio.onerror = () => setPlaying(null)
        audio.play()
        setPlaying(voice.id)
    }

    useEffect(() => () => { audioRef.current?.pause() }, [])

    async function handleSave() {
        setSaving(true)
        await onSave(selected)
        setSaving(false)
    }

    return (
        <div className={cardCls}>
            <div className="flex items-start justify-between mb-1">
                <h3 className={`font-serif text-lg ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>AI Voice</h3>
                {!isPro && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-sans font-500 bg-gold-pale text-gold-dark border border-gold-light">
                        <Lock size={9} /> Pro
                    </span>
                )}
            </div>
            <p className="text-xs font-sans text-ink-3 mb-5">
                {isPro ? "Choose the voice your AI receptionist uses on calls. Click play to preview." : "Upgrade to Pro to give your AI a custom voice."}
            </p>

            {!isPro ? (
                <div className={`rounded-xl border-2 border-dashed p-8 text-center ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-[#2A2A26]" : "bg-gold-pale"}`}>
                        <Mic size={20} className="text-gold" />
                    </div>
                    <p className={`text-sm font-sans font-500 mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Custom AI voice</p>
                    <p className="text-xs font-sans text-ink-3 mb-5 max-w-xs mx-auto leading-relaxed">
                        Choose from 12 professional voices to match your brand. Available on the Pro plan.
                    </p>
                    <Button variant="gold" size="sm" onClick={() => window.dispatchEvent(new CustomEvent("lemon:nav", { detail: "billing" }))}>
                        Upgrade to Pro →
                    </Button>
                </div>
            ) : (
                <>
                    <div className="flex gap-2 mb-4">
                        {(["all", "female", "male"] as const).map(g => (
                            <button key={g} onClick={() => setGenderFilter(g)}
                                className={`px-3 py-1.5 text-xs font-sans rounded-lg border transition-all capitalize ${genderFilter === g ? "bg-gradient-to-r from-gold to-[#A07E00] text-white border-transparent shadow-[var(--shadow-gold)]" : "border-border text-ink-3 hover:border-gold hover:text-gold"}`}>
                                {g === "all" ? "All voices" : g}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                        {filtered.map(voice => {
                            const isSelected = selected === voice.id
                            const isPlaying = playing === voice.id
                            return (
                                <div key={voice.id} onClick={() => setSelected(voice.id)}
                                    className={`relative flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected
                                        ? "border-gold bg-gold-pale shadow-[var(--shadow-gold)]"
                                        : isDark ? "border-[#2A2A26] hover:border-[#3A3A36] bg-[#0F0F0D]" : "border-border hover:border-gold/40 bg-cream"}`}>
                                    <button
                                        onClick={e => { e.stopPropagation(); playPreview(voice) }}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-gold text-white" : isDark ? "bg-[#2A2A26] text-[#F0EFE8] hover:bg-gold hover:text-white" : "bg-white border border-border text-ink-3 hover:bg-gold hover:text-white hover:border-gold"}`}>
                                        {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-sans font-500 truncate ${isSelected ? "text-gold-dark" : isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{voice.name}</p>
                                        <p className={`text-2xs font-sans truncate ${isSelected ? "text-gold" : "text-ink-3"}`}>{voice.accent} · {voice.description}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                                            <Check size={10} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <Button variant="gold" size="sm" disabled={!isDirty || saving} onClick={handleSave}>
                        {saving ? "Saving..." : isDirty ? "Save voice" : "Voice saved ✓"}
                    </Button>
                </>
            )}
        </div>
    )
}

// ─── Language Picker ──────────────────────────────────────────────────────────

function LanguagePicker({ isDark, isPro, currentLanguage, onSave }: {
    isDark: boolean; isPro: boolean; currentLanguage: string | null
    onSave: (code: string) => Promise<void>
}) {
    const [selected, setSelected] = useState<string>(currentLanguage || "en")
    const [saving, setSaving] = useState(false)
    const isDirty = selected !== (currentLanguage || "en")
    const cardCls = `rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`

    async function handleSave() {
        setSaving(true)
        await onSave(selected)
        setSaving(false)
    }

    return (
        <div className={cardCls}>
            <div className="flex items-start justify-between mb-1">
                <h3 className={`font-serif text-lg ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>AI Language</h3>
                {!isPro && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-sans font-500 bg-gold-pale text-gold-dark border border-gold-light">
                        <Lock size={9} /> Pro
                    </span>
                )}
            </div>
            <p className="text-xs font-sans text-ink-3 mb-5">
                {isPro ? "Set the language your AI speaks on every call." : "Upgrade to Pro to enable a non-English AI receptionist."}
            </p>

            {!isPro ? (
                <div className={`rounded-xl border-2 border-dashed p-8 text-center ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-[#2A2A26]" : "bg-gold-pale"}`}>
                        <Globe size={20} className="text-gold" />
                    </div>
                    <p className={`text-sm font-sans font-500 mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Multi-language support</p>
                    <p className="text-xs font-sans text-ink-3 mb-5 max-w-xs mx-auto leading-relaxed">
                        Let your AI receptionist speak French, Spanish, and 9 other languages. Available on the Pro plan.
                    </p>
                    <Button variant="gold" size="sm" onClick={() => window.dispatchEvent(new CustomEvent("lemon:nav", { detail: "billing" }))}>
                        Upgrade to Pro →
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                        {SUPPORTED_LANGUAGES.map(lang => {
                            const isSelected = selected === lang.code
                            return (
                                <div key={lang.code} onClick={() => setSelected(lang.code)}
                                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected
                                        ? "border-gold bg-gold-pale shadow-[var(--shadow-gold)]"
                                        : isDark ? "border-[#2A2A26] hover:border-[#3A3A36] bg-[#0F0F0D]" : "border-border hover:border-gold/40 bg-cream"}`}>
                                    <span className="text-xl flex-shrink-0">{lang.flag}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-sans font-500 truncate ${isSelected ? "text-gold-dark" : isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{lang.label}</p>
                                        <p className={`text-2xs font-sans truncate ${isSelected ? "text-gold" : "text-ink-3"}`}>
                                            {lang.code === "en" ? "Default" : lang.greeting}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                                            <Check size={10} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <Button variant="gold" size="sm" disabled={!isDirty || saving} onClick={handleSave}>
                        {saving ? "Saving..." : isDirty ? "Save language" : "Language saved ✓"}
                    </Button>
                </>
            )}
        </div>
    )
}

// ─── Review Collection ────────────────────────────────────────────────────────

function ReviewCollector({ isDark, isPro, currentReviewUrl, onSave }: {
    isDark: boolean; isPro: boolean; currentReviewUrl: string | null
    onSave: (url: string) => Promise<void>
}) {
    const [url, setUrl] = useState(currentReviewUrl || "")
    const [saving, setSaving] = useState(false)
    const isDirty = url !== (currentReviewUrl || "")
    const cardCls = `rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`
    const inputCls = `w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`

    async function handleSave() {
        setSaving(true)
        await onSave(url)
        setSaving(false)
    }

    return (
        <div className={cardCls}>
            <div className="flex items-start justify-between mb-1">
                <h3 className={`font-serif text-lg ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Review Collection</h3>
                {!isPro && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-sans font-500 bg-gold-pale text-gold-dark border border-gold-light">
                        <Lock size={9} /> Pro
                    </span>
                )}
            </div>
            <p className="text-xs font-sans text-ink-3 mb-5">
                {isPro ? "Your AI will ask callers for a review after booking and SMS them the link." : "Upgrade to Pro to automatically collect reviews after every booking."}
            </p>

            {!isPro ? (
                <div className={`rounded-xl border-2 border-dashed p-8 text-center ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-[#2A2A26]" : "bg-gold-pale"}`}>
                        <Star size={20} className="text-gold" />
                    </div>
                    <p className={`text-sm font-sans font-500 mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Automated review requests</p>
                    <p className="text-xs font-sans text-ink-3 mb-5 max-w-xs mx-auto leading-relaxed">
                        After every booking your AI asks the caller if they'd like to leave a review and texts them your link. Available on the Pro plan.
                    </p>
                    <Button variant="gold" size="sm" onClick={() => window.dispatchEvent(new CustomEvent("lemon:nav", { detail: "billing" }))}>
                        Upgrade to Pro →
                    </Button>
                </div>
            ) : (
                <>
                    <div className="mb-5">
                        <label className="block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase">Review link</label>
                        <input
                            type="url" value={url} onChange={e => setUrl(e.target.value)}
                            placeholder="https://g.page/r/your-google-review-link"
                            className={inputCls}
                        />
                        <p className="text-2xs text-ink-3 font-sans mt-1">
                            Paste your Google, Yelp, or any review page URL. Your AI will text this to callers after booking.
                        </p>
                    </div>
                    <Button variant="gold" size="sm" disabled={!isDirty || saving || !url} onClick={handleSave}>
                        {saving ? "Saving..." : isDirty ? "Save review link" : "Review link saved ✓"}
                    </Button>
                </>
            )}
        </div>
    )
}

// ─── Account Section ──────────────────────────────────────────────────────────

function AccountSection({ isDark, userEmail }: { isDark: boolean; userEmail: string | null }) {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
    const supabase = createClient()

    const cardCls = `rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`
    const inputCls = `w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`
    const labelCls = "block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase"

    async function handleChangePassword() {
        if (!newPassword || !confirmPassword) { setMsg({ text: "Please fill in all fields.", ok: false }); return }
        if (newPassword !== confirmPassword) { setMsg({ text: "New passwords don't match.", ok: false }); return }
        if (newPassword.length < 8) { setMsg({ text: "Password must be at least 8 characters.", ok: false }); return }

        setSaving(true)
        setMsg(null)
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) {
            setMsg({ text: error.message, ok: false })
        } else {
            setMsg({ text: "Password updated successfully.", ok: true })
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        }
        setSaving(false)
    }

    return (
        <div className={cardCls}>
            <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-[#2A2A26]" : "bg-gold-pale"}`}>
                    <User size={18} className="text-gold" />
                </div>
                <div>
                    <h3 className={`font-serif text-lg leading-tight ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Account</h3>
                    <p className="text-xs font-sans text-ink-3">{userEmail || "—"}</p>
                </div>
            </div>

            <div className="space-y-4">
                <p className={`text-xs font-sans font-500 text-ink-3 uppercase tracking-[0.1em]`}>Change password</p>
                <div>
                    <label className={labelCls}>New password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters" className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Confirm new password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password" className={inputCls} />
                </div>
            </div>

            {msg && (
                <p className={`text-xs font-sans mt-3 ${msg.ok ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>
            )}

            <Button variant="gold" size="sm" className="mt-5" disabled={saving || !newPassword || !confirmPassword} onClick={handleChangePassword}>
                {saving ? "Updating..." : "Update password"}
            </Button>
        </div>
    )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const BUSINESS_TYPES = [
    "Medical / Dental clinic", "Hair salon & spa", "Contractor / Builder", "Moving company",
    "Restaurant", "Hotel / B&B", "Real estate", "Law firm", "Repair shop", "Vet clinic",
    "Grocery store", "Clothing & fashion", "Accountant / Finance", "Church & place of worship",
    "Retail store", "Other",
]

export function SettingsTab({ isDark, saving, isPro, form, currentVoiceId, currentLanguage, currentReviewUrl, userEmail, onFormChange, onSave, onSaveVoice, onSaveLanguage, onSaveReviewUrl }: Props) {
    const inputCls = `w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`
    const labelCls = "block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase"
    const cardCls = `rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`
    const [showCancel, setShowCancel] = useState(false);

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease] max-w-2xl">

            {/* Account */}
            <AccountSection isDark={isDark} userEmail={userEmail} />

            {/* AI Agent */}
            <div className={cardCls}>
                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>AI Agent</h3>
                <p className="text-xs font-sans text-ink-3 mb-5">Customize how your AI receptionist sounds and behaves.</p>
                <div className="space-y-4">
                    <div>
                        <label className={labelCls}>Agent name</label>
                        <input type="text" value={form.aiName} onChange={e => onFormChange({ aiName: e.target.value })} placeholder="Lisa" className={inputCls} />
                        <p className="text-2xs text-ink-3 font-sans mt-1">This is the name callers will hear</p>
                    </div>
                    <div>
                        <label className={labelCls}>Custom greeting</label>
                        <input type="text" value={form.aiGreeting} onChange={e => onFormChange({ aiGreeting: e.target.value })}
                            placeholder={`Thank you for calling ${form.businessName || "us"}, this is ${form.aiName || "Lisa"}, how can I help?`}
                            className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Notification phone</label>
                        <input type="tel" value={form.notificationPhone} onChange={e => onFormChange({ notificationPhone: e.target.value })}
                            placeholder="+1 431 555 0123" className={inputCls} />
                        <p className="text-2xs text-ink-3 font-sans mt-1">Your personal cell — we text you a summary after each call</p>
                    </div>
                </div>
                <Button variant="gold" size="sm" className="mt-5" disabled={saving} onClick={() => onSave("AI Agent")}>
                    {saving ? "Saving..." : "Save changes"}
                </Button>
            </div>

            {/* Voice picker */}
            <VoicePicker isDark={isDark} isPro={isPro} currentVoiceId={currentVoiceId} onSave={onSaveVoice} />

            {/* Language picker */}
            <LanguagePicker isDark={isDark} isPro={isPro} currentLanguage={currentLanguage} onSave={onSaveLanguage} />

            {/* Review collection */}
            <ReviewCollector isDark={isDark} isPro={isPro} currentReviewUrl={currentReviewUrl} onSave={onSaveReviewUrl} />

            {/* Business profile */}
            <div className={cardCls}>
                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Business profile</h3>
                <p className="text-xs font-sans text-ink-3 mb-5">This is what your AI knows about your business.</p>
                <div className="space-y-4">
                    <div>
                        <label className={labelCls}>Business name</label>
                        <input type="text" value={form.businessName} onChange={e => onFormChange({ businessName: e.target.value })} placeholder="Your business name" className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Business type</label>
                        <select value={form.businessType} onChange={e => onFormChange({ businessType: e.target.value })}
                            className={`w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8]" : "bg-white border-border text-ink"}`}>
                            <option value="">Select business type</option>
                            {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>About your business <span className="ml-2 normal-case tracking-normal font-400 text-2xs">Tell the AI what makes you unique</span></label>
                        <textarea rows={4} value={form.about} onChange={e => onFormChange({ about: e.target.value })}
                            placeholder="e.g. We are a family-owned moving company specializing in local residential moves..."
                            className={`w-full px-4 py-3 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors resize-none leading-relaxed ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`} />
                        <p className="text-2xs text-ink-3 font-sans mt-1">This gets added directly to your AI&apos;s knowledge</p>
                    </div>
                </div>
                <Button variant="gold" size="sm" className="mt-5" disabled={saving} onClick={() => onSave("Business profile")}>
                    {saving ? "Saving..." : "Save changes"}
                </Button>
            </div>

            {/* Working hours */}
            <div className={cardCls}>
                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Working hours</h3>
                <p className="text-xs font-sans text-ink-3 mb-5">Your AI will only book appointments during these hours.</p>
                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <label className={labelCls}>Opens at</label>
                        <input type="time" value={form.hoursStart} onChange={e => onFormChange({ hoursStart: e.target.value })} className={inputCls} />
                    </div>
                    <div className="text-ink-3 pb-3 font-sans">→</div>
                    <div className="flex-1">
                        <label className={labelCls}>Closes at</label>
                        <input type="time" value={form.hoursEnd} onChange={e => onFormChange({ hoursEnd: e.target.value })} className={inputCls} />
                    </div>
                </div>
                <Button variant="gold" size="sm" className="mt-5" disabled={saving} onClick={() => onSave("Working hours")}>
                    {saving ? "Saving..." : "Save changes"}
                </Button>
            </div>

            {/* Subscription management */}
            <div className={cardCls}>
                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Subscription</h3>
                <p className="text-xs font-sans text-ink-3 mb-5">Manage or cancel your LemonAssistant plan.</p>
                <button
                    onClick={() => setShowCancel(true)}
                    className="text-xs font-sans text-ink-3 underline hover:text-ink transition-colors"
                >
                    Manage subscription
                </button>
            </div>

            {showCancel && <CancelFlow onClose={() => setShowCancel(false)} />}
        </div>
    )
}



