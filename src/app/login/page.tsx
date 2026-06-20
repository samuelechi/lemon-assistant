"use client"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")!
        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
        resize()
        window.addEventListener("resize", resize)
        const lines = Array.from({ length: 18 }, () => ({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            angle: Math.random() * Math.PI * 2, speed: Math.random() * 0.2 + 0.05,
            length: Math.random() * 120 + 60, opacity: Math.random() * 0.12 + 0.03,
            width: Math.random() * 0.5 + 0.3,
        }))
        const dots = Array.from({ length: 40 }, () => ({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            r: Math.random() * 1.5 + 0.5, opacity: Math.random() * 0.15 + 0.05,
            pulse: Math.random() * Math.PI * 2,
        }))
        let raf: number
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            const grd = ctx.createRadialGradient(canvas.width * 0.3, canvas.height * 0.4, 0, canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.6)
            grd.addColorStop(0, "rgba(196,154,0,0.06)")
            grd.addColorStop(1, "transparent")
            ctx.fillStyle = grd
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.strokeStyle = "rgba(196,154,0,0.04)"
            ctx.lineWidth = 0.5
            for (let x = 0; x < canvas.width; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke() }
            for (let y = 0; y < canvas.height; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke() }
            lines.forEach(l => {
                l.angle += l.speed * 0.008
                ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.angle)
                ctx.strokeStyle = `rgba(196,154,0,${l.opacity})`; ctx.lineWidth = l.width
                ctx.beginPath(); ctx.moveTo(-l.length / 2, 0); ctx.lineTo(l.length / 2, 0); ctx.stroke()
                ctx.restore()
            })
            dots.forEach(d => {
                d.pulse += 0.02
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(196,154,0,${d.opacity * (0.5 + 0.5 * Math.sin(d.pulse))})`
                ctx.fill()
            })
            raf = requestAnimationFrame(draw)
        }
        draw()
        return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf) }
    }, [])
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError(error.message); setLoading(false) }
        else router.push("/dashboard")
    }

    const handleGoogleLogin = async () => {
        setGoogleLoading(true)
        setError("")
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) { setError(error.message); setGoogleLoading(false) }
    }

    return (
        <div className="min-h-screen flex flex-col md:grid md:grid-cols-2">
            {/* LEFT */}
            <div className="relative bg-ink flex flex-col justify-between p-6 md:p-12 overflow-hidden min-h-[260px] md:min-h-0 w-full">
                <AnimatedBackground />
                <div className="relative z-10">
                    <Link href="/"><Logo variant="dark" size="sm" className="mb-16" /></Link>
                    <h1 className="font-serif text-3xl md:text-5xl text-white leading-[1.1] mb-5">
                        Never miss a call.<br /><em className="text-gradient-gold not-italic">Never lose a client.</em>
                    </h1>
                    <p className="text-sm font-sans text-ink-3 leading-relaxed max-w-sm">
                        Your AI receptionist answers every missed call, books appointments, and sends confirmations — automatically.
                    </p>
                    <div className="flex gap-6 mt-8 flex-wrap">
                        {[["98%", "Calls answered"], ["3×", "More bookings"], ["5min", "To go live"]].map(([n, l]) => (
                            <div key={l}>
                                <div className="font-serif text-3xl text-gold">{n}</div>
                                <div className="text-2xs font-sans text-[#444440] tracking-wider uppercase mt-1">{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative z-10 rounded-xl p-5 hidden md:block" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="font-serif text-base text-[#AAAAAA] leading-relaxed italic mb-3">
                        &ldquo;My schedule has never been fuller. LemonAssistant books appointments while I work.&rdquo;
                    </p>
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gold rounded-full flex items-center justify-center text-xs font-600 text-ink font-sans">HS</div>
                        <span className="text-xs font-sans text-[#666]">Henry Smith · Smith Moving Co.</span>
                    </div>
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center justify-center px-6 py-12 bg-cream">
                <div className="w-full max-w-md">
                    <div className="md:hidden text-center mb-8">
                        <Link href="/"><Logo variant="white" size="sm" className="justify-center" /></Link>
                    </div>
                    <h2 className="font-serif text-3xl text-ink mb-1">Welcome back</h2>
                    <p className="text-sm font-sans text-ink-3 mb-8">Sign in to your account</p>
                    <div className="bg-white border border-border rounded-xl p-8 shadow-[var(--shadow-card)]">

                        {/* Google Sign In */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={googleLoading}
                            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-lg text-sm font-sans font-500 text-ink hover:bg-cream transition-colors disabled:opacity-50"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                            </svg>
                            {googleLoading ? "Redirecting..." : "Continue with Google"}
                        </button>

                        <div className="flex items-center gap-3 my-5">
                            <hr className="flex-1 border-border" />
                            <span className="text-2xs font-sans text-ink-3">or</span>
                            <hr className="flex-1 border-border" />
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-2xs font-sans font-500 text-ink mb-1.5 tracking-[0.12em] uppercase">Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.com" required
                                    className="w-full px-4 py-2.5 text-sm font-sans border border-border rounded-lg bg-white text-ink placeholder:text-ink-3 focus:outline-none focus:border-gold transition-colors" />
                            </div>
                            <div>
                                <label className="block text-2xs font-sans font-500 text-ink mb-1.5 tracking-[0.12em] uppercase">Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                                    className="w-full px-4 py-2.5 text-sm font-sans border border-border rounded-lg bg-white text-ink placeholder:text-ink-3 focus:outline-none focus:border-gold transition-colors" />
                            </div>
                            {error && <p className="text-xs text-red-500 font-sans">{error}</p>}
                            <Button variant="gold" size="lg" className="w-full mt-2" disabled={loading}>
                                {loading ? "Signing in..." : "Sign in →"}
                            </Button>
                        </form>

                        <hr className="border-border my-6" />
                        <p className="text-center text-xs font-sans text-ink-3">
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="text-gold hover:text-gold-dark font-500 transition-colors">Sign up free</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}