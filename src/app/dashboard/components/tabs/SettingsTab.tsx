"use client"
import { useState, useRef, useEffect } from "react"
import { Play, Pause, Lock, Check, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ELEVENLABS_VOICES, type ElevenLabsVoice } from "@/lib/elevenlabs-voices"

type SettingsForm = {
    aiName: string; aiGreeting: string; businessName: string; businessType: string
    about: string; hoursStart: string; hoursEnd: string; notificationPhone: string
}

type Props = {
    isDark: boolean; saving: boolean; isPro: boolean
    form: SettingsForm; currentVoiceId: string | null
    onFormChange: (updates: Partial<SettingsForm>) => void
    onSave: (section: string) => void
    onSaveVoice: (voiceId: string) => Promise<void>
}

function VoicePicker({ isDark, isPro, currentVoiceId, onSave, saving }: {
    isDark: boolean; isPro: boolean; currentVoiceId: string | null
    onSave: (id: string) => Promise<void>; saving: boolean
}) {
    const [selected, setSelected] = useState<string>(currentVoiceId || "21m00Tcm4TlvDq8ikWAM")
    const [playing, setPlaying] = useState<string | null>(null)
    const [savingVoice, setSavingVoice] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [genderFilter, setGenderFilter] = useState<"all" | "female" | "male">("all")

    const filtered = ELEVENLABS_VOICES.filter(v => genderFilter === "all" || v.gender === genderFilter)
    const isDirty = selected !== (currentVoiceId || "21m00Tcm4TlvDq8ikWAM")

    function playPreview(voice: ElevenLabsVoice) {
        if (playing === voice.id) {
            audioRef.current?.pause()
            setPlaying(null)
            return
        }
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
        setSavingVoice(true)
        await onSave(selected)
        setSavingVoice(false)
    }

    return (
        <div className={`rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
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
                    {/* Gender filter */}
                    <div className="flex gap-2 mb-4">
                        {(["all", "female", "male"] as const).map(g => (
                            <button key={g} onClick={() => setGenderFilter(g)}
                                className={`px-3 py-1.5 text-xs font-sans rounded-lg border transition-all capitalize ${genderFilter === g ? "bg-gradient-to-r from-gold to-[#A07E00] text-white border-transparent shadow-[var(--shadow-gold)]" : "border-border text-ink-3 hover:border-gold hover:text-gold"}`}>
                                {g === "all" ? "All voices" : g}
                            </button>
                        ))}
                    </div>

                    {/* Voice grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                        {filtered.map(voice => {
                            const isSelected = selected === voice.id
                            const isPlaying = playing === voice.id
                            return (
                                <div
                                    key={voice.id}
                                    onClick={() => setSelected(voice.id)}
                                    className={`relative flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected
                                        ? "border-gold bg-gold-pale shadow-[var(--shadow-gold)]"
                                        : isDark
                                            ? "border-[#2A2A26] hover:border-[#3A3A36] bg-[#0F0F0D]"
                                            : "border-border hover:border-gold/40 bg-cream"}`}
                                >
                                    {/* Play button */}
                                    <button
                                        onClick={e => { e.stopPropagation(); playPreview(voice) }}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-gold text-white" : isDark ? "bg-[#2A2A26] text-[#F0EFE8] hover:bg-gold hover:text-white" : "bg-white border border-border text-ink-3 hover:bg-gold hover:text-white hover:border-gold"}`}
                                    >
                                        {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                                    </button>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-sans font-500 truncate ${isSelected ? "text-gold-dark" : isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                                            {voice.name}
                                        </p>
                                        <p className={`text-2xs font-sans truncate ${isSelected ? "text-gold" : "text-ink-3"}`}>
                                            {voice.accent} · {voice.description}
                                        </p>
                                    </div>

                                    {/* Selected checkmark */}
                                    {isSelected && (
                                        <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                                            <Check size={10} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <Button variant="gold" size="sm" disabled={!isDirty || savingVoice} onClick={handleSave}>
                        {savingVoice ? "Saving..." : isDirty ? "Save voice" : "Voice saved ✓"}
                    </Button>
                </>
            )}
        </div>
    )
}

const BUSINESS_TYPES = [
    "Medical / Dental clinic", "Hair salon & spa", "Contractor / Builder", "Moving company",
    "Restaurant", "Hotel / B&B", "Real estate", "Law firm", "Repair shop", "Vet clinic",
    "Grocery store", "Clothing & fashion", "Accountant / Finance", "Church & place of worship",
    "Retail store", "Other",
]

export function SettingsTab({ isDark, saving, isPro, form, currentVoiceId, onFormChange, onSave, onSaveVoice }: Props) {
    const inputCls = `w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`
    const labelCls = "block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase"
    const cardCls = `rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease] max-w-2xl">

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
            <VoicePicker isDark={isDark} isPro={isPro} currentVoiceId={currentVoiceId} onSave={onSaveVoice} saving={saving} />

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
        </div>
    )
}