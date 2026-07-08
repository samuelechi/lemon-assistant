"use client"
import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/Logo"
import {
  Phone, Calendar, MessageSquare, Clock, Bell,
  AlertTriangle, BarChart3, ArrowRight,
  CheckCircle2, Zap, Globe, PhoneOff,
  ChevronDown, Star
} from "lucide-react"

const features = [
  {
    icon: <Phone size={18} />,
    title: "Answers like a real person",
    desc: "Natural voice, warm tone, full conversation. Callers don't know it's AI — they just know someone picked up.",
  },
  {
    icon: <Calendar size={18} />,
    title: "Books while you're on the job",
    desc: "Checks your live calendar mid-call and locks in the slot instantly. No double bookings, no back-and-forth.",
  },
  {
    icon: <MessageSquare size={18} />,
    title: "Texts the confirmation",
    desc: "Every booking fires a confirmation SMS to the caller automatically. No-shows drop dramatically.",
  },
  {
    icon: <Bell size={18} />,
    title: "Reminds them the day before",
    desc: "24-hour reminder sent automatically. They reply C to confirm or R to reschedule — Lisa handles both.",
  },
  {
    icon: <AlertTriangle size={18} />,
    title: "Flags urgent calls instantly",
    desc: "Lisa detects urgency in tone and language. You get an SMS alert immediately so nothing slips through.",
  },
  {
    icon: <PhoneOff size={18} />,
    title: "Texts back missed calls",
    desc: "If a call drops before Lisa picks up, the caller gets a text within seconds. You never lose a lead.",
  },
  {
    icon: <BarChart3 size={18} />,
    title: "Shows you everything",
    desc: "Every call logged with a summary, duration, outcome, and booking status. Full dashboard, always up to date.",
  },
  {
    icon: <Globe size={18} />,
    title: "Speaks their language",
    desc: "Caller switches to French or Spanish mid-sentence? Lisa follows without missing a beat.",
  },
]

const industries = [
  { emoji: "💈", name: "Hair salons & spas" },
  { emoji: "🏥", name: "Medical & dental" },
  { emoji: "🏗️", name: "Contractors" },
  { emoji: "🚛", name: "Moving companies" },
  { emoji: "🍽️", name: "Restaurants" },
  { emoji: "🏨", name: "Hotels & B&Bs" },
  { emoji: "🏠", name: "Real estate" },
  { emoji: "⚖️", name: "Law firms" },
  { emoji: "🔧", name: "Repair shops" },
  { emoji: "🐾", name: "Vet clinics" },
  { emoji: "⛪", name: "Churches" },
  { emoji: "🛍️", name: "Retail stores" },
]

const plans = [
  {
    name: "Growth",
    price: "$99",
    cadNote: "/ month",
    mins: "250 minutes included",
    featured: false,
    features: [
      "AI receptionist",
      "Live appointment booking",
      "SMS confirmations",
      "Appointment reminders",
      "Missed call text-back",
      "Urgent call alerts",
      "Call summaries & analytics",
      "Google Calendar sync",
    ],
  },
  {
    name: "Pro",
    price: "$199",
    cadNote: "/ month",
    mins: "600 minutes included",
    featured: true,
    features: [
      "Everything in Growth",
      "Custom AI voice & name",
      "Multi-language support",
      "Review collection after calls",
      "No-show follow-up texts",
      "Call transfer to owner",
      "White label option",
      "Priority support",
    ],
  },
]

const testimonials = [
  {
    quote: "I was losing patients every time I stepped into an exam room. LemonAssistant books while I work. My schedule's been full for two months straight.",
    name: "Dr. Chris Okafor",
    biz: "Chris Clinic · Brandon, MB",
    initials: "CO",
  },
  {
    quote: "I'm showing properties all day. I used to come back to three missed calls and no messages. Now I come back to a booked calendar.",
    name: "Aisha Nwosu",
    biz: "Nwosu Realty · Winnipeg, MB",
    initials: "AN",
  },
  {
    quote: "We're on job sites all day. Couldn't answer calls if we tried. Lisa gets it done. We haven't missed a quote request in weeks.",
    name: "Ryan Sinclair",
    biz: "Sinclair Construction · Brandon, MB",
    initials: "RS",
  },
]

const faqs = [
  {
    q: "Do I need to change my phone number?",
    a: "No. Keep your existing number. Forward unanswered calls to your LemonAssistant number — callers never notice anything different.",
  },
  {
    q: "What does '$2.50 trial activation' mean?",
    a: "Your $2.50 covers your dedicated local phone number in your country. This filters out bots and ensures you get a real number immediately. Then you get 13 minutes of real AI call time — enough for several full conversations — before committing to a plan.",
  },
  {
    q: "Which countries are supported?",
    a: "Canada, United States, United Kingdom, Ireland, Australia, and New Zealand. More countries coming soon.",
  },
  {
    q: "What calendar does it connect to?",
    a: "Google Calendar or Calendly — connect either in a couple minutes from your dashboard. No calendar? We include a built-in one so you can view every booking right inside LemonAssistant.",
  },
  {
    q: "Will callers know they're talking to AI?",
    a: "Only if you tell them. Lisa uses a natural voice and handles conversation fluidly. You can name her whatever fits your brand.",
  },
  {
    q: "What happens when I hit my minute limit?",
    a: "You're notified well before you hit it. You can upgrade at any time or add minutes. Calls don't get cut off mid-conversation.",
  },
  {
    q: "How long does setup actually take?",
    a: "Under five minutes. Enter your business info, connect your calendar, set your hours, and forward your calls. That's it — Lisa is live.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0 cursor-pointer" onClick={() => setOpen(p => !p)}>
      <div className="flex justify-between items-center px-7 py-5">
        <span className="font-sans font-500 text-sm text-ink pr-8">{q}</span>
        <ChevronDown size={16} className={`text-gold flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div className="px-7 pb-5 text-sm font-sans text-ink-3 leading-relaxed">{a}</div>
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-6 bg-white border-b border-border overflow-hidden">
        <span className="glow-gold w-[34rem] h-[34rem] -top-40 -right-40 opacity-60 animate-[glow_5s_ease-in-out_infinite]" aria-hidden />
        <span className="glow-gold w-80 h-80 bottom-0 -left-24 opacity-40" aria-hidden />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex justify-center md:justify-start mb-10">
            <div className="inline-flex items-center gap-2.5 bg-gold-pale border border-gold-light rounded-full px-5 py-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
              <span className="text-xs font-sans font-500 text-gold-dark tracking-wide">
                Start for just $2.50 · Your dedicated number, instant setup
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="font-serif text-6xl leading-[1.05] text-ink mb-3">
                Every missed call<br />is a customer<br />
                <em className="text-gradient-gold not-italic">someone else booked.</em>
              </h1>
              <p className="text-sm font-sans text-ink-3 leading-relaxed mb-8 max-w-md mt-6">
                LemonAssistant answers your phone 24/7, books appointments live, and sends confirmations — so you can focus on the work, not the ring. Available in Canada, US, UK, Ireland, Australia & New Zealand.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-8">
                <Link href="/signup">
                  <Button variant="gold" size="lg">
                    Get started for $2.50
                    <ArrowRight size={15} className="ml-2" />
                  </Button>
                </Link>
                <a href="tel:+16513093510" className="group relative">
                  <Button variant="secondary" size="lg">
                    <span className="group-hover:hidden">Hear a demo call</span>
                    <span className="hidden group-hover:inline">Call +1 (651) 309-3510</span>
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-3 text-xs text-ink-3 font-sans">
                <div className="flex gap-0.5 text-gold text-sm">{"★★★★★"}</div>
                <span>Trusted by service businesses across 6 countries</span>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="relative flex justify-center">
              <span className="glow-gold w-72 h-72 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50" aria-hidden />
              <div className="relative float bg-ink rounded-[2rem] p-3 w-72 shadow-[0_30px_60px_-15px_rgba(15,15,13,0.55)] ring-1 ring-white/10">
                <div className="bg-[#1A1A16] rounded-[1.6rem] overflow-hidden">
                  <div className="flex justify-between items-center px-5 py-3 text-[10px] text-[#444440]">
                    <span>9:41</span>
                    <span className="w-20 h-4 bg-[#0F0F0D] rounded-full mx-auto" />
                    <span>5G ●●●</span>
                  </div>
                  <div className="px-5 pb-6">
                    <p className="font-serif text-white text-center text-base mb-0.5">Dr. Chris Clinic</p>
                    <p className="text-[10px] text-[#444440] text-center mb-5 font-sans">AI answering · forwarded</p>
                    <div className="relative w-16 h-16 mx-auto mb-1">
                      <div className="absolute inset-0 rounded-full bg-gold/10 animate-ping" />
                      <div className="absolute inset-2 rounded-full bg-gold/20 animate-ping [animation-delay:0.3s]" />
                      <div className="relative w-16 h-16 bg-gold rounded-full flex items-center justify-center font-serif text-2xl font-600 text-ink">L</div>
                    </div>
                    <p className="font-sans text-white text-center text-sm font-500 mt-3">Lisa</p>
                    <p className="text-[10px] text-[#444440] text-center mb-5 font-sans">AI Receptionist · LemonAssistant</p>
                    <div className="bg-[#111110] rounded-xl p-3.5 space-y-3 mb-4">
                      <div>
                        <p className="text-[8px] text-[#444440] mb-1 uppercase tracking-widest font-sans">Caller</p>
                        <p className="text-[11px] text-white leading-snug font-sans">Hi, I need to book — back pain</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-[#444440] mb-1 uppercase tracking-widest font-sans">Lisa</p>
                        <p className="text-[11px] text-gold leading-snug font-sans">Of course! Could I get your name and a day that works?</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-[#444440] mb-1 uppercase tracking-widest font-sans">Caller</p>
                        <p className="text-[11px] text-white leading-snug font-sans">James Morris — Thursday works</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gold rounded-full flex items-center justify-center text-[8px] font-700 text-ink font-sans flex-shrink-0">L</div>
                        <div className="flex gap-1 items-center">
                          {[0, 1, 2].map(i => (
                            <span key={i} className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${i * 0.18}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-[10px] text-green-400 font-sans">Lisa is booking Thursday 10 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-ink py-3.5 overflow-hidden">
        <div className="fade-x flex gap-0 animate-[marquee_25s_linear_infinite] whitespace-nowrap">
          {[...Array(3)].map((_, i) => (
            <span key={i} className="flex gap-0 flex-shrink-0">
              {[
                "Answers every call",
                "Books appointments live",
                "SMS confirmations",
                "24 / 7 availability",
                "Start for $2.50",
                "13 free minutes",
                "Urgent call alerts",
                "Calendar sync",
                "Call summaries",
                "6 countries supported",
              ].map(t => (
                <span key={t} className="text-[10px] font-sans font-500 text-gold tracking-[0.18em] uppercase flex items-center gap-0">
                  <span className="px-8">{t}</span>
                  <span className="w-1 h-1 bg-gold/40 rounded-full" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {[
            { n: "62%", l: "Of callers won't leave a voicemail" },
            { n: "7×", l: "More likely to convert if answered live" },
            { n: "24/7", l: "Answers — even at 2 AM" },
            { n: "5 min", l: "From signup to fully live" },
          ].map((s, i) => (
            <div key={i} className="py-9 px-6 text-center">
              <div className="font-serif text-4xl text-ink mb-1.5">{s.n}</div>
              <div className="text-xs font-sans text-ink-3 max-w-28 mx-auto leading-relaxed">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MISSED CALL COST ── */}
      <section className="py-20 px-6 bg-cream border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-4">The real cost of a missed call</p>
          <h2 className="font-serif text-5xl text-ink mb-6">
            You're not just losing a call.<br />
            <em className="text-gradient-gold not-italic">You're losing the booking.</em>
          </h2>
          <p className="text-sm font-sans text-ink-3 leading-relaxed max-w-xl mx-auto mb-14">
            The average service business misses 7 calls a day. At a $150 average booking value, that's over $1,000 gone every single week — not to a competitor, just to voicemail.
          </p>
          <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
            {[
              { stat: "7", label: "Missed calls per day", sub: "Industry average for service businesses" },
              { stat: "$1,050", label: "Lost revenue per week", sub: "At $150 average booking value" },
              { stat: "$54,600", label: "Per year, to voicemail", sub: "That's a full-time employee's salary" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 text-center">
                <div className="font-serif text-5xl text-gold mb-2">{item.stat}</div>
                <div className="font-sans font-500 text-sm text-ink mb-1">{item.label}</div>
                <div className="text-xs font-sans text-ink-3">{item.sub}</div>
              </div>
            ))}
          </div>
          <p className="text-xs font-sans text-ink-3 mt-5">LemonAssistant Growth plan costs $99/month. The math does itself.</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Setup</p>
          <h2 className="font-serif text-5xl text-ink mb-4">Live in <em className="text-gradient-gold not-italic">five minutes.</em></h2>
          <p className="text-sm font-sans text-ink-3 leading-relaxed max-w-lg mb-14">No tech skills. No developer. No downtime. Just sign up, connect your calendar, and forward your calls.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", icon: <Zap size={18} />, title: "Sign up free", desc: "Enter your business details. Takes 2 minutes. No credit card needed to create your account." },
              { step: "2", icon: <Calendar size={18} />, title: "Connect your calendar", desc: "Google Calendar or Calendly — one click. Lisa checks it live during every call." },
              { step: "3", icon: <Phone size={18} />, title: "Activate for $2.50", desc: "Pay $2.50 to get your dedicated local number. This is the only cost before your first plan." },
              { step: "4", icon: <ArrowRight size={18} />, title: "Forward your calls", desc: "Set unanswered calls to forward to your LemonAssistant number. Lisa is live and answering." },
            ].map(s => (
              <div key={s.step} className="lift bg-cream rounded-xl p-8 border border-border relative overflow-hidden hover:border-gold-light">
                <div className="font-serif text-8xl text-border/60 absolute -top-4 -right-2 select-none leading-none">{s.step}</div>
                <div className="w-10 h-10 bg-white border border-gold-light rounded-lg flex items-center justify-center text-gold mb-5 relative">{s.icon}</div>
                <h3 className="font-serif text-xl text-ink mb-2 relative">{s.title}</h3>
                <p className="text-sm font-sans text-ink-3 leading-relaxed relative">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 bg-cream border-b border-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Features</p>
          <h2 className="font-serif text-5xl text-ink mb-4">
            Everything your front desk does —<br />
            <em className="text-gradient-gold not-italic">without the overhead.</em>
          </h2>
          <p className="text-sm font-sans text-ink-3 leading-relaxed max-w-lg mb-14">
            From the first ring to the confirmation text, Lisa handles the full caller journey. You just see the results.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="lift bg-white border border-border rounded-xl p-6 hover:border-gold-light">
                <div className="w-9 h-9 bg-gold-pale border border-gold-light rounded-lg flex items-center justify-center text-gold mb-4">{f.icon}</div>
                <h3 className="font-serif text-base text-ink mb-2">{f.title}</h3>
                <p className="text-xs font-sans text-ink-3 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── $2.50 TRIAL SPOTLIGHT ── */}
      <section className="relative py-24 px-6 bg-ink border-b border-[#1A1A16] overflow-hidden">
        <span className="glow-gold w-[40rem] h-[40rem] -top-48 left-1/2 -translate-x-1/2 opacity-70" aria-hidden />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2 mb-8">
            <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
            <span className="text-xs font-sans font-500 text-gold tracking-wide">Get started for just $2.50</span>
          </div>
          <h2 className="font-serif text-6xl text-white mb-6">
            $2.50 gets you<br />
            <em className="text-gradient-gold not-italic">a real local number<br />+ 13 free minutes.</em>
          </h2>
          <p className="text-sm font-sans text-[#888880] leading-relaxed max-w-xl mx-auto mb-10">
            That's enough for several real conversations. See how Lisa answers, how she handles a booking, how she flags urgency — on your actual business, with your real callers.
            No demos. No sales calls. Just try it.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-12 text-left">
            {[
              { icon: <CheckCircle2 size={14} />, title: "Your own local number", desc: "CA, US, UK, IE, AU or NZ number assigned instantly after payment." },
              { icon: <CheckCircle2 size={14} />, title: "13 minutes of real AI calls", desc: "Not a sandbox. Your actual number, your actual callers." },
              { icon: <CheckCircle2 size={14} />, title: "Keep everything on upgrade", desc: "When you upgrade, your number and settings carry over instantly." },
            ].map((item, i) => (
              <div key={i} className="bg-[#1A1A16] border border-[#2A2A26] rounded-xl p-5">
                <div className="text-gold mb-3">{item.icon}</div>
                <p className="font-sans font-500 text-sm text-white mb-1">{item.title}</p>
                <p className="text-xs font-sans text-[#666660]">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/signup">
            <Button variant="gold" size="lg">
              Get started for $2.50
              <ArrowRight size={15} className="ml-2" />
            </Button>
          </Link>
          <p className="text-xs font-sans text-[#444440] mt-4">Takes 5 minutes to set up · No subscription until you're ready</p>
        </div>
      </section>

      {/* ── COUNTRIES ── */}
      <section className="py-16 px-6 bg-white border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-4">Available in</p>
          <h2 className="font-serif text-4xl text-ink mb-10">6 countries. <em className="text-gradient-gold not-italic">More coming.</em></h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { flag: "🇨🇦", name: "Canada" },
              { flag: "🇺🇸", name: "United States" },
              { flag: "🇬🇧", name: "United Kingdom" },
              { flag: "🇮🇪", name: "Ireland" },
              { flag: "🇦🇺", name: "Australia" },
              { flag: "🇳🇿", name: "New Zealand" },
            ].map((c, i) => (
              <div key={i} className="bg-cream border border-border rounded-xl p-5 text-center hover:border-gold-light transition-colors">
                <div className="text-3xl mb-2">{c.flag}</div>
                <p className="text-xs font-sans font-500 text-ink">{c.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDUSTRIES ── */}
      <section id="industries" className="py-24 px-6 bg-cream border-b border-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Who it's for</p>
          <h2 className="font-serif text-5xl text-ink mb-4">
            If your business<br />
            <em className="text-gradient-gold not-italic">takes calls, Lisa works.</em>
          </h2>
          <p className="text-sm font-sans text-ink-3 leading-relaxed max-w-lg mb-14">
            Any service business where customers call to book, inquire, or reach someone. Lisa handles the phone while you run the operation.
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-border border border-border rounded-xl overflow-hidden">
            {industries.map((ind, i) => (
              <div key={i} className="bg-white hover:bg-gold-pale transition-colors p-5 text-center group cursor-default">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-150">{ind.emoji}</div>
                <div className="font-sans text-xs font-500 text-ink leading-snug">{ind.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Pricing</p>
          <h2 className="font-serif text-5xl text-ink mb-4">Simple pricing.<br /><em className="text-gradient-gold not-italic">No surprises.</em></h2>
          <p className="text-sm font-sans text-ink-3 leading-relaxed max-w-lg mb-3">
            Start with a $2.50 activation — get your local number and 13 free minutes. Upgrade when you're ready. Both plans include your AI receptionist, SMS, and live calendar booking.
          </p>
          <p className="text-xs font-sans text-gold font-500 mb-14">Save 20% with annual billing</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            {plans.map(p => (
              <div key={p.name} className={`lift rounded-xl p-8 border ${p.featured ? "bg-ink border-[#2A2A26] shadow-[var(--shadow-lift)] ring-1 ring-gold/20" : "bg-cream border-border"}`}>
                {p.featured && (
                  <div className="inline-flex items-center gap-1.5 bg-gold/10 border border-gold/20 rounded-full px-3 py-1 mb-5">
                    <Star size={10} className="text-gold fill-gold" />
                    <span className="text-2xs font-sans font-500 text-gold">Most popular</span>
                  </div>
                )}
                <p className={`text-2xs font-sans font-500 tracking-[0.12em] uppercase mb-3 ${p.featured ? "text-gold" : "text-ink-3"}`}>{p.name}</p>
                <div className={`font-serif text-5xl mb-1 ${p.featured ? "text-gold" : "text-ink"}`}>{p.price}</div>
                <p className={`text-xs font-sans mb-1 ${p.featured ? "text-[#555550]" : "text-ink-3"}`}>{p.cadNote}</p>
                <p className={`text-xs font-sans mb-7 font-500 ${p.featured ? "text-[#888880]" : "text-ink-3"}`}>{p.mins}</p>
                <ul className="space-y-3 mb-8">
                  {p.features.map(f => (
                    <li key={f} className={`flex items-center gap-2.5 text-sm font-sans ${p.featured ? "text-[#888880]" : "text-ink-3"}`}>
                      <CheckCircle2 size={13} className="text-gold flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button variant={p.featured ? "gold" : "secondary"} size="lg" className="w-full">
                    Start for $2.50
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-xs font-sans text-ink-3 mt-6">$2.50 activation · No subscription until you're ready · Cancel any time</p>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 bg-cream border-b border-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">From the field</p>
          <h2 className="font-serif text-5xl text-ink mb-14">
            Businesses that run on calls<br />
            <em className="text-gradient-gold not-italic">run on Lisa.</em>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="lift bg-white border border-border rounded-xl p-7 flex flex-col hover:border-gold-light">
                <div className="flex gap-0.5 text-gold text-sm mb-5">{"★★★★★"}</div>
                <p className="font-serif text-lg text-ink leading-relaxed mb-6 italic flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-ink rounded-full flex items-center justify-center font-sans text-xs font-500 text-gold flex-shrink-0">{t.initials}</div>
                  <div>
                    <p className="font-sans font-500 text-sm text-ink">{t.name}</p>
                    <p className="font-sans text-xs text-ink-3">{t.biz}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 bg-white border-b border-border">
        <div className="max-w-3xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">FAQ</p>
          <h2 className="font-serif text-5xl text-ink mb-12">Your questions,<br /><em className="text-gradient-gold not-italic">answered.</em></h2>
          <div className="border border-border rounded-xl overflow-hidden bg-cream divide-y divide-border">
            {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-28 px-6 bg-ink overflow-hidden">
        <span className="glow-gold w-[44rem] h-[44rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 animate-[glow_6s_ease-in-out_infinite]" aria-hidden />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#E0B400] to-[#A07E00] rounded-2xl flex items-center justify-center font-serif text-3xl font-600 text-ink mx-auto mb-8 shadow-[var(--shadow-gold-lg)]">L</div>
          <h2 className="font-serif text-6xl text-white mb-5">
            Your next caller<br />
            <em className="text-gradient-gold not-italic">deserves an answer.</em>
          </h2>
          <p className="text-sm font-sans text-[#666660] mb-10 leading-relaxed">
            $2.50 gets you a local number and 13 free minutes.<br />
            Your customers will never reach voicemail again.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/signup">
              <Button variant="gold" size="lg">
                Get started for $2.50
                <ArrowRight size={15} className="ml-2" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="secondary" size="lg">Hear a demo</Button>
            </Link>
          </div>
          <p className="text-xs font-sans text-[#333330] mt-5">$2.50 activation · No subscription until you're ready · Cancel any time</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#080806] border-t border-[#111110] py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <Logo variant="dark" size="sm" className="mb-4" />
              <p className="text-xs font-sans text-[#333330] leading-relaxed max-w-44">
                AI receptionist for service businesses worldwide. Never miss a call, never lose a client.
              </p>
            </div>
            {[
              { title: "Product", links: ["How it works", "Features", "Pricing", "Integrations"] },
              { title: "Industries", links: ["Medical & dental", "Hair salons", "Real estate", "Contractors"] },
              {
                title: "Company", links: [
                  { label: "About", href: "#" },
                  { label: "Blog", href: "#" },
                  { label: "Contact", href: "#" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ]
              },
            ].map(col => (
              <div key={col.title}>
                <h5 className="text-2xs font-sans font-500 tracking-[0.12em] uppercase text-[#333330] mb-4">{col.title}</h5>
                <ul className="space-y-2.5">
                  {col.links.map((l: any) => (
                    <li key={typeof l === "string" ? l : l.label}>
                      <a href={typeof l === "string" ? "#" : l.href} className="text-xs font-sans text-[#2A2A26] hover:text-[#444440] transition-colors">
                        {typeof l === "string" ? l : l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[#111110] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-2xs font-sans text-[#222220]">© 2026 LemonAssistant. All rights reserved.</p>
            <p className="text-2xs font-sans text-[#222220]">Built for every business that answers a phone 🍋</p>
          </div>
        </div>
      </footer>
    </div>
  )
}