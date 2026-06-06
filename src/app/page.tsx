import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/ui/Logo"
import {
  Phone, Calendar, MessageSquare, Clock, Bell,
  AlertTriangle, BarChart3, Star, ArrowRight,
  CheckCircle2, Zap, Globe
} from "lucide-react"

const steps = [
  { n: "01", icon: <Zap size={20} />, title: "Set up your business", desc: "Enter your business name, type, working hours, and what kind of appointments you take. Takes under 2 minutes." },
  { n: "02", icon: <Calendar size={20} />, title: "Connect your calendar", desc: "Link Google Calendar, Outlook, Calendly or Apple Calendar in one click. No calendar? We give you a built-in one." },
  { n: "03", icon: <Phone size={20} />, title: "Forward your calls", desc: "Set call forwarding on your existing phone to your LemonAssistant number. Done — your AI receptionist is live." },
]

const features = [
  { icon: <Phone size={20} />, title: "AI that sounds human", desc: "Natural voice, warm tone, real conversation. Customize the name, greeting, and personality to match your brand." },
  { icon: <Calendar size={20} />, title: "Real-time booking", desc: "Checks your actual calendar live during the call and books slots instantly. No double bookings, ever." },
  { icon: <MessageSquare size={20} />, title: "SMS confirmations", desc: "Every booking triggers an automatic confirmation text. Dramatically reduces no-shows." },
  { icon: <Bell size={20} />, title: "Appointment reminders", desc: "24 hours before the slot, clients get a reminder. They reply C to confirm or R to reschedule — AI handles both." },
  { icon: <AlertTriangle size={20} />, title: "Urgent call detection", desc: "Lisa detects urgency in tone and language. Immediately alerts you via SMS so you can call back fast." },
  { icon: <BarChart3 size={20} />, title: "Call analytics", desc: "Peak call times, booking rates, no-show rates. Know your business better than ever before." },
  { icon: <MessageSquare size={20} />, title: "Missed call text-back", desc: "If a call can't be answered, the caller immediately gets a text. Never lose a client again." },
  { icon: <Globe size={20} />, title: "Multi-language", desc: "Caller speaks French or Spanish? Lisa detects and responds in their language automatically." },
]

const industries = [
  { emoji: "💈", name: "Hair salons & spas", desc: "Cuts, colour, treatments" },
  { emoji: "🏥", name: "Medical & dental", desc: "Patient appointments" },
  { emoji: "🏗️", name: "Contractors", desc: "Quotes & site visits" },
  { emoji: "🚛", name: "Moving companies", desc: "Estimates & bookings" },
  { emoji: "🍽️", name: "Restaurants", desc: "Reservations & parties" },
  { emoji: "🏨", name: "Hotels & B&Bs", desc: "Room inquiries" },
  { emoji: "🏠", name: "Real estate", desc: "Viewings & consultations" },
  { emoji: "⚖️", name: "Law firms", desc: "Client consultations" },
  { emoji: "🔧", name: "Repair shops", desc: "Drop-offs & service" },
  { emoji: "🐾", name: "Vet clinics", desc: "Pet appointments" },
]

const plans = [
  {
    name: "Growth",
    price: "$99",
    period: "per month · 250 minutes",
    featured: false,
    features: [
      "AI receptionist (Lisa)",
      "Appointment booking",
      "SMS confirmations",
      "Call summaries",
      "Appointment reminders",
      "Missed call text-back",
      "Urgent call alerts",
      "Analytics dashboard",
      "Multi-calendar support",
    ],
  },
  {
    name: "Pro",
    price: "$199",
    period: "per month · 600 minutes",
    featured: true,
    features: [
      "Everything in Growth",
      "Custom AI voice & name",
      "Multi-language support",
      "Review collection",
      "No-show follow-up",
      "Call transfer to owner",
      "White label option",
      "Priority support",
    ],
  },
]

const testimonials = [
  { quote: "I was losing patients every time I was busy. LemonAssistant books appointments while I work. My schedule has never been fuller.", name: "Dr. Chris Okafor", biz: "Chris Clinic · Brandon, MB", initials: "DC" },
  { quote: "Clients call to book while I'm showing properties. I came back from viewings to a full week already scheduled. Game changer.", name: "Aisha Nwosu", biz: "Nwosu Realty · Winnipeg, MB", initials: "AN" },
  { quote: "We miss so many calls on job sites. Now every caller gets answered and we get a full summary. Worth every single penny.", name: "Ryan Sinclair", biz: "Sinclair Construction · Brandon, MB", initials: "RS" },
]

const faqs = [
  { q: "Do I need to change my business phone number?", a: "No. You keep your existing number. Simply set call forwarding so unanswered calls go to your LemonAssistant number. Callers never notice a difference." },
  { q: "What calendars does it connect to?", a: "We support Google Calendar, Outlook, Calendly, and Apple Calendar. No calendar? We give you a built-in scheduling tool inside your dashboard." },
  { q: "Will callers know they're talking to an AI?", a: "Only if you tell them. Lisa uses a natural voice and handles conversation fluidly. You can also give her a custom name to match your business." },
  { q: "What happens if I go over my minute limit?", a: "You're charged a small overage fee rather than having calls cut off. You can also upgrade your plan at any time." },
  { q: "Can I customize what Lisa says?", a: "Yes, fully. Control the greeting, services mentioned, questions asked, and how she handles different caller types — all from your dashboard." },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-gold-pale border border-gold-light rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
              <span className="text-xs font-sans font-500 text-gold-dark tracking-wide">AI receptionist · live 24/7</span>
            </div>
            <h1 className="font-serif text-6xl leading-[1.05] text-ink mb-6">
              Your business<br />never misses a<br />
              <em className="text-gold not-italic">call again.</em>
            </h1>
            <p className="text-sm font-sans text-ink-3 leading-relaxed mb-8 max-w-md">
              LemonAssistant answers every missed call, books appointments automatically, and sends confirmations — so you can focus on the work, not the phone.
            </p>
            <div className="flex gap-3 items-center">
              <Button variant="gold" size="lg">Start free — 5 min setup</Button>
              <Button variant="secondary" size="lg">See a demo call</Button>
            </div>
            <div className="flex items-center gap-2 mt-6 text-xs text-ink-3 font-sans">
              <div className="flex text-gold">{"★★★★★"}</div>
              <span>Trusted by 200+ businesses across Canada</span>
            </div>
          </div>

          {/* Live call mockup */}
          <div className="flex justify-center">
            <div className="bg-ink rounded-2xl p-3 w-72 shadow-2xl">
              <div className="bg-[#1A1A16] rounded-xl overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 text-[10px] text-ink-3">
                  <span>9:41</span><span>●●● 5G</span>
                </div>
                <div className="px-4 pb-5">
                  <p className="font-serif text-white text-center text-base font-500">Dr. Chris Clinic</p>
                  <p className="text-[10px] text-ink-3 text-center mb-4">Forwarded · AI answering</p>
                  <div className="w-14 h-14 bg-gold rounded-full flex items-center justify-center mx-auto mb-2 font-serif text-xl font-600 text-ink relative">
                    L
                    <span className="absolute inset-[-6px] rounded-full border border-gold opacity-30 animate-ping" />
                  </div>
                  <p className="font-sans text-white text-center text-sm font-500 mt-2">Lisa</p>
                  <p className="text-[10px] text-ink-3 text-center mb-4">AI Receptionist · LemonAssistant</p>
                  <div className="bg-[#242420] rounded-xl p-3 space-y-3 mb-3">
                    <div>
                      <p className="text-[8px] text-ink-3 mb-1 uppercase tracking-wider">Caller</p>
                      <p className="text-[11px] text-white leading-snug">Hi, I need to book — back pain</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-ink-3 mb-1 uppercase tracking-wider">Lisa</p>
                      <p className="text-[11px] text-gold leading-snug">Of course! Could I get your name and preferred day?</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-ink-3 mb-1 uppercase tracking-wider">Caller</p>
                      <p className="text-[11px] text-white leading-snug">James Morris — Thursday works</p>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <div className="w-5 h-5 bg-gold rounded-full flex items-center justify-center text-[8px] font-700 text-ink">L</div>
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-green-400 font-sans">Live call · Lisa is booking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="bg-ink py-4 overflow-hidden">
        <div className="flex gap-12 animate-[marquee_20s_linear_infinite] whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="flex gap-12 flex-shrink-0">
              {["Answer every call", "Book appointments", "SMS confirmations", "24/7 availability", "Calendar sync", "Appointment reminders", "Call summaries", "Urgent alerts", "Review collection"].map(t => (
                <span key={t} className="text-[11px] font-sans font-500 text-gold tracking-widest uppercase flex items-center gap-8">
                  {t} <span className="w-1 h-1 bg-gold rounded-full" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { n: "98%", l: "Calls answered first ring" },
            { n: "3×", l: "More appointments booked" },
            { n: "24/7", l: "Never sleeps, never off" },
            { n: "5min", l: "To go fully live" },
          ].map((s, i) => (
            <div key={i} className="py-8 px-6 text-center border-r border-border last:border-r-0">
              <div className="font-serif text-4xl text-ink mb-1">{s.n}</div>
              <div className="text-xs font-sans text-ink-3">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">How it works</p>
          <h2 className="font-serif text-5xl text-ink mb-4">Live in <em className="text-gold not-italic">five minutes.</em></h2>
          <p className="text-sm font-sans text-ink-3 leading-relaxed max-w-lg mb-14">No tech skills needed. Sign up, connect your calendar, forward your calls.</p>
          <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
            {steps.map(s => (
              <div key={s.n} className="bg-white p-8 hover:bg-cream transition-colors">
                <div className="font-serif text-5xl text-border mb-6">{s.n}</div>
                <div className="w-10 h-10 bg-gold-pale border border-gold-light rounded-md flex items-center justify-center text-gold mb-5">{s.icon}</div>
                <h3 className="font-serif text-lg text-ink mb-2">{s.title}</h3>
                <p className="text-sm font-sans text-ink-3 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 bg-white border-t border-b border-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Features</p>
          <h2 className="font-serif text-5xl text-ink mb-4">Everything your front desk<br />does — <em className="text-gold not-italic">automated.</em></h2>
          <p className="text-sm font-sans text-ink-3 leading-relaxed max-w-lg mb-14">From booking to reminders to urgent alerts — LemonAssistant handles the full caller journey.</p>
          <div className="grid md:grid-cols-2 gap-px bg-border border border-border rounded-lg overflow-hidden">
            {features.map((f, i) => (
              <div key={i} className="bg-white p-8 hover:bg-cream transition-colors">
                <div className="w-10 h-10 bg-gold-pale border border-gold-light rounded-md flex items-center justify-center text-gold mb-5">{f.icon}</div>
                <h3 className="font-serif text-lg text-ink mb-2">{f.title}</h3>
                <p className="text-sm font-sans text-ink-3 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="py-24 px-6 bg-ink">
        <div className="max-w-6xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Industries</p>
          <h2 className="font-serif text-5xl text-white mb-4">Built for every business<br />that <em className="text-gold not-italic">takes calls.</em></h2>
          <p className="text-sm font-sans text-ink-3 leading-relaxed max-w-lg mb-14">Any service business with customers calling to book, inquire, or reach someone — LemonAssistant handles it.</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#1A1A16] border border-[#1A1A16] rounded-lg overflow-hidden">
            {industries.map((ind, i) => (
              <div key={i} className="bg-[#141412] hover:bg-[#1E1E1A] transition-colors p-6 text-center group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{ind.emoji}</div>
                <div className="font-sans font-500 text-xs text-white mb-1">{ind.name}</div>
                <div className="text-2xs font-sans text-ink-3">{ind.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 bg-white border-t border-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">Pricing</p>
          <h2 className="font-serif text-5xl text-ink mb-4">Simple pricing.<br /><em className="text-gold not-italic">No surprises.</em></h2>
          <p className="text-sm font-sans text-ink-3 leading-relaxed max-w-lg mb-14">Start with Growth, upgrade to Pro when you need more. All plans include your AI receptionist, SMS, and calendar booking.</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            {plans.map(p => (
              <div key={p.name} className={`rounded-lg p-8 ${p.featured ? "bg-ink text-white" : "bg-white border border-border"}`}>
                {p.featured && <Badge variant="gold" className="mb-4">Most popular</Badge>}
                <p className={`text-xs font-sans font-500 tracking-wider uppercase mb-2 ${p.featured ? "text-gold" : "text-ink-3"}`}>{p.name}</p>
                <div className={`font-serif text-5xl mb-1 ${p.featured ? "text-gold" : "text-ink"}`}>{p.price}</div>
                <p className={`text-xs font-sans mb-6 ${p.featured ? "text-ink-3" : "text-ink-3"}`}>{p.period}</p>
                <ul className="space-y-3 mb-8">
                  {p.features.map(f => (
                    <li key={f} className={`flex items-center gap-2.5 text-sm font-sans ${p.featured ? "text-[#AAAAAA]" : "text-ink-3"}`}>
                      <CheckCircle2 size={14} className={p.featured ? "text-gold flex-shrink-0" : "text-gold flex-shrink-0"} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant={p.featured ? "gold" : "secondary"} size="lg" className="w-full">
                  Get started
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs font-sans text-ink-3 mt-6">No credit card required to start · Cancel anytime · Save 20% with annual billing</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6 bg-gold-pale border-t border-gold-light border-b">
        <div className="max-w-6xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">What businesses say</p>
          <h2 className="font-serif text-5xl text-ink mb-14">Businesses that run on calls <em className="text-gold not-italic">love it.</em></h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white border border-gold-light rounded-lg p-7">
                <div className="text-gold text-sm mb-4">★★★★★</div>
                <p className="font-serif text-lg text-ink leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
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

      {/* FAQ */}
      <section className="py-24 px-6 bg-white border-b border-border">
        <div className="max-w-3xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-3">FAQ</p>
          <h2 className="font-serif text-5xl text-ink mb-12">Your questions, <em className="text-gold not-italic">answered.</em></h2>
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {faqs.map((f, i) => (
              <details key={i} className="group bg-white">
                <summary className="flex justify-between items-center px-7 py-5 cursor-pointer list-none hover:bg-cream transition-colors">
                  <span className="font-sans font-500 text-sm text-ink">{f.q}</span>
                  <span className="text-gold text-xl font-sans group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-7 pb-5 text-sm font-sans text-ink-3 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 text-center bg-cream">
        <div className="max-w-2xl mx-auto">
          <p className="text-2xs font-sans font-500 tracking-[0.14em] uppercase text-gold mb-4">Get started today</p>
          <h2 className="font-serif text-6xl text-ink mb-5">Your AI receptionist<br />is one setup <em className="text-gold not-italic">away.</em></h2>
          <p className="text-sm font-sans text-ink-3 mb-10 leading-relaxed">Takes 5 minutes. No credit card required. Cancel any time.<br />Your customers will never reach voicemail again.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="gold" size="lg">Start for free <ArrowRight size={16} className="ml-1" /></Button>
            <Button variant="secondary" size="lg">Book a demo call</Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink border-t border-[#1A1A16] py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <Logo variant="dark" size="sm" className="mb-4" />
              <p className="text-xs font-sans text-ink-3 leading-relaxed max-w-48">AI receptionist for businesses. Never miss a call, never lose a client.</p>
            </div>
            {[
              { title: "Product", links: ["How it works", "Features", "Pricing", "Integrations"] },
              { title: "Industries", links: ["Medical clinics", "Hair salons", "Real estate", "Contractors"] },
              { title: "Company", links: ["About", "Blog", "Contact", "Privacy policy"] },
            ].map(col => (
              <div key={col.title}>
                <h5 className="text-2xs font-sans font-500 tracking-[0.12em] uppercase text-ink-3 mb-4">{col.title}</h5>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l} className="text-xs font-sans text-[#444440] hover:text-ink-3 cursor-pointer transition-colors">{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[#1A1A16] pt-6 flex justify-between items-center">
            <p className="text-2xs font-sans text-[#333330]">© 2026 LemonAssistant. All rights reserved.</p>
            <p className="text-2xs font-sans text-[#333330]">Made for all businesses 🍋</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
