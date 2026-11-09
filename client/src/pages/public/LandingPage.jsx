import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Car,
  Check,
  CheckCheck,
  HeartPulse,
  Home,
  Menu,
  MessageCircle,
  Phone,
  PhoneCall,
  Pill,
  Send,
  Shield,
  Smartphone,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import Logo from '../../components/Logo';
import AnimatedFlow from '../../components/AnimatedFlow';

const navLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#safety', label: 'Safety' },
  { href: '#faq', label: 'FAQ' },
];

const features = [
  { icon: Pill, title: 'Medicine Reminders', desc: 'WhatsApp reminders with one-tap acknowledgement. Family gets notified if a dose is missed.' },
  { icon: HeartPulse, title: 'Daily Wellness Check-ins', desc: 'Automated daily check-ins. Parents reply with one word, family sees the status in real time.' },
  { icon: Car, title: 'Ride Booking', desc: 'Request rides to hospitals, clinics or appointments. Family can book on behalf of parents.' },
  { icon: UtensilsCrossed, title: 'Food & Grocery', desc: 'Order home-style meals and groceries through a simple WhatsApp message.' },
  { icon: Home, title: 'Household Services', desc: 'Cleaning, gardening, car wash — verified local helpers at your doorstep.' },
  { icon: Users, title: 'Family Coordination', desc: 'One shared dashboard. Everyone stays informed without constant phone calls.' },
];

const faqs = [
  { q: 'Is CareConnect a medical service?', a: 'No. CareConnect does not diagnose, treat or prescribe. It helps coordinate reminders, check-ins, transport and household services with family involvement.' },
  { q: 'What happens if I miss a medicine reminder?', a: 'The system marks it as missed, sends follow-up reminders, and notifies your family member. A missed reminder is not treated as a medical emergency.' },
  { q: 'How is my data protected?', a: 'All data is encrypted in transit. Family members only see data you consent to share. Admins access data only for support with audit logging.' },
  { q: 'Does it work without internet?', a: 'Parents can use WhatsApp (which works on basic phones). The dashboard requires internet. Emergency contacts can also be called directly.' },
  { q: 'Do parents need the website?', a: 'No. Parents interact only through WhatsApp — no app, no website, no password to remember. The web dashboard is for children, service providers and admins.' },
];

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[27rem] lg:ml-auto lg:mr-0" aria-hidden="true">
      <div className="absolute inset-x-8 inset-y-12 rounded-[3rem] bg-care-400/25 blur-3xl" />

      <div className="relative rounded-[2.6rem] border border-care-200/80 bg-white/90 p-2.5 shadow-[0_32px_80px_-32px_rgba(3,105,161,0.55)] backdrop-blur">
        <div className="chat-paper overflow-hidden rounded-[2.1rem] border border-care-100">
          <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[11px] font-bold text-care-800">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-3 rounded-sm bg-care-700/70" />
              <span className="h-2 w-2 rounded-full bg-care-700/70" />
              <span className="h-2.5 w-4 rounded-sm border border-care-700/70" />
            </span>
          </div>

          <div className="flex items-center gap-3 border-b border-care-100 bg-white px-4 py-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-care-600 text-white shadow-sm">
              <HeartPulse className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-care-green" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-care-900">CareConnect</p>
              <p className="text-[11px] font-semibold text-care-green-dark">online · here for your family</p>
            </div>
            <MessageCircle className="ml-auto h-4 w-4 text-care-300" />
          </div>

          <div className="space-y-3 px-4 py-5 text-[12px] leading-relaxed">
            <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-[#d9fdd3] px-3.5 py-2.5 text-care-900 shadow-sm">
              <p className="font-medium">Dawai li</p>
              <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-medium text-care-800">
                8:02 AM <CheckCheck className="h-3 w-3 text-care-600" />
              </p>
            </div>

            <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 shadow-sm">
              <p className="text-care-800">Shabaash! Reminder marked as taken. I have let Priya know.</p>
              <p className="mt-1 text-[10px] font-medium text-ink-muted">8:02 AM</p>
            </div>

            <div className="rounded-2xl border border-care-100 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-care-50 text-care-600">
                  <Pill className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-care-900">Morning medicine</p>
                  <p className="text-[11px] font-medium text-ink-muted">Metformin 500 mg · 8:00 AM</p>
                </div>
                <span className="rounded-full bg-care-green-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-care-green-dark">
                  Taken
                </span>
              </div>
            </div>

            <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-[#d9fdd3] px-3.5 py-2.5 text-care-900 shadow-sm">
              <p className="font-medium">Ride chahiye kal 10 baje</p>
              <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-medium text-care-800">
                8:04 AM <CheckCheck className="h-3 w-3 text-care-600" />
              </p>
            </div>

            <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 shadow-sm">
              <p className="text-care-800">Ride requested for tomorrow at 10:00 AM. Driver details will arrive here.</p>
              <p className="mt-1 text-[10px] font-medium text-ink-muted">8:04 AM</p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-care-100 bg-white px-3 py-3">
            <div className="flex-1 rounded-full bg-care-50 px-3 py-2 text-[11px] font-semibold text-ink-muted">Message</div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-care-green text-white">
              <Send className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>

      <div className="animate-float absolute top-24 hidden w-44 rounded-2xl border border-care-100 bg-white/95 p-3 shadow-xl shadow-care-900/10 backdrop-blur sm:-left-20 sm:block lg:-left-10">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-care-green-soft text-care-green-dark">
            <HeartPulse className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Wellness check-in</p>
            <p className="text-xs font-bold text-care-900">All good today</p>
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-care-100">
          <div className="h-full w-[86%] rounded-full bg-care-green" />
        </div>
      </div>

      <div className="animate-float-delayed absolute bottom-16 hidden w-44 rounded-2xl border border-care-100 bg-white/95 p-3 shadow-xl shadow-care-900/10 backdrop-blur sm:-right-20 sm:block lg:-right-8">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-care-50 text-care-600">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Family notified</p>
            <p className="text-xs font-bold text-care-900">Priya saw it</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-care-600 text-[9px] font-bold text-white">P</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-care-green text-[9px] font-bold text-white">R</span>
          <span className="text-[10px] font-medium text-ink-muted">2 family members</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-care-50 font-body text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-care-800 focus:shadow-lg"
      >
        Skip to content
      </a>

      <div className="bg-care-900 text-care-100">
        <div className="mx-auto flex max-w-7xl items-start justify-center gap-2 px-4 py-2.5 text-center text-xs leading-relaxed sm:items-center sm:text-sm">
          <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-care-300 sm:mt-0" aria-hidden="true" />
          <p>
            CareConnect coordinates care — it does not replace emergency services.{' '}
            <a
              href="tel:112"
              className="font-semibold text-white underline decoration-care-400 underline-offset-2 hover:decoration-white"
            >
              For emergencies, call 112.
            </a>
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-care-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3 rounded-xl" aria-label="CareConnect home">
            <Logo size={38} />
            <span className="font-display text-xl font-bold tracking-tight text-care-900">
              Care<span className="text-care-600">Connect</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="landing-nav-link text-sm font-semibold text-ink-muted transition-colors hover:text-care-700"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              to="/auth/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-care-50 hover:text-care-800"
            >
              Sign in
            </Link>
            <Link
              to="/auth/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-care-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-care-600/20 transition-all hover:-translate-y-0.5 hover:bg-care-700 hover:shadow-md"
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-care-800 transition-colors hover:bg-care-50 lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>

        {mobileOpen && (
          <div id="mobile-nav" className="border-t border-care-100 bg-white lg:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-semibold text-ink transition-colors hover:bg-care-50"
                >
                  {link.label}
                </a>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <Link
                  to="/auth/login"
                  className="flex min-h-11 items-center justify-center rounded-xl border border-care-200 px-4 py-2.5 text-sm font-semibold text-care-800 transition-colors hover:bg-care-50"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/register"
                  className="flex min-h-11 items-center justify-center rounded-xl bg-care-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-care-700"
                >
                  Get started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="main" tabIndex={-1}>
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="landing-grid absolute inset-0" />
            <div className="absolute -right-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-care-200/50 blur-3xl" />
            <div className="absolute -left-40 top-64 h-96 w-96 rounded-full bg-care-green-soft/60 blur-3xl" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8 lg:px-8 lg:pb-28">
            <div className="max-w-2xl">
              <p className="animate-enter inline-flex items-center gap-2 rounded-full border border-care-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-care-700 shadow-sm backdrop-blur sm:text-sm sm:normal-case sm:tracking-normal">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-care-green opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-care-green" />
                </span>
                WhatsApp-first care for independent parents
              </p>

              <h1 className="animate-enter animate-enter-delay-1 mt-6 font-display text-4xl font-bold leading-[1.06] tracking-[-0.035em] text-care-900 sm:text-5xl lg:text-6xl xl:text-[4.1rem]">
                Stay close to your parents, even from{' '}
                <span className="relative whitespace-nowrap text-care-600">
                  miles away.
                  <svg
                    className="absolute -bottom-2 left-0 h-3 w-full text-care-300"
                    viewBox="0 0 240 12"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M3 9C58 3 154 2 237 7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="animate-enter animate-enter-delay-2 mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
                CareConnect helps parents live independently while their children stay in the loop. Parents use simple
                WhatsApp messages. Children get one shared dashboard for medicines, wellness, rides, food and home help.
              </p>

              <div className="animate-enter animate-enter-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/auth/register"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-care-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-care-600/20 transition-all hover:-translate-y-0.5 hover:bg-care-700 hover:shadow-xl"
                >
                  Create your free account
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-care-200 bg-white/80 px-6 py-3.5 text-base font-semibold text-care-800 shadow-sm transition-all hover:border-care-300 hover:bg-white"
                >
                  See how it works
                </a>
              </div>

              <ul className="animate-enter animate-enter-delay-4 mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink-muted">
                {['No app for parents', 'Family-controlled privacy', 'Works on any phone'].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-care-green" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="animate-enter animate-enter-delay-2 relative mx-auto w-full max-w-[28rem] lg:max-w-none">
              <HeroPreview />
            </div>
          </div>
        </section>

        {/* How it works */}
      <section id="how-it-works" className="bg-gray-50 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#1e3a5f] mb-3">How It Works</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-8 md:mb-12">
            One WhatsApp message from a parent — and the whole family is quietly in sync.
          </p>
          <AnimatedFlow />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#1e3a5f] mb-4">Everything Your Family Needs</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-8 md:mb-12">
            From medication reminders to household services — one platform that keeps families connected and parents independent.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={24} className="text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-[#1e3a5f] mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety & Trust */}
      <section className="bg-[#1e3a5f] py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Shield size={40} className="text-teal-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Safety, Privacy & Trust</h2>
            <p className="text-gray-300 leading-relaxed mb-8">
              CareConnect is built with healthcare-grade privacy standards. Consent-based family sharing, encrypted data,
              role-based access, and full audit trails. We never sell data, never claim to replace medical professionals,
              and clearly label all demo and simulated features.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              <div className="bg-white/10 rounded-xl p-5">
                <h4 className="text-teal-300 font-semibold mb-1">Consent-Based</h4>
                <p className="text-gray-300 text-sm">Parents control what family members can see and do.</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h4 className="text-teal-300 font-semibold mb-1">Role-Based Access</h4>
                <p className="text-gray-300 text-sm">Strict server-side authorization. No data leaks.</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h4 className="text-teal-300 font-semibold mb-1">Not a Medical Device</h4>
                <p className="text-gray-300 text-sm">We coordinate care — we never diagnose or prescribe.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#1e3a5f] mb-8 md:mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="bg-white rounded-xl border border-gray-200 p-5 group">
                <summary className="font-semibold text-[#1e3a5f] cursor-pointer flex items-center justify-between list-none">
                  {f.q}
                  <span className="text-teal-600 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-teal-600 py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to stay connected?</h2>
          <p className="text-teal-100 mb-8">Create your family account in minutes. No credit card required.</p>
          <Link to="/auth/register" className="bg-white text-teal-700 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-teal-50 inline-flex items-center gap-2">
            Get Started Free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#162d4a] text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Logo size={28} />
              <span className="text-white font-bold text-lg">CareConnect</span>
            </div>
            <p className="text-sm text-gray-400">WhatsApp-based smart elderly care and healthcare coordination platform.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} />
                <a href="tel:+919653203776" className="hover:text-white">+91 96532 03776</a>
              </li>
              <li>📧 <a href="mailto:deepsinghcode@gmail.com" className="hover:text-white">deepsinghcode@gmail.com</a></li>
              <li>📍 Jaipur, Rajasthan, India</li>
              <li><Link to="/contact" className="text-teal-300 hover:text-white">Contact page →</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><a href="#safety" className="hover:text-white">Medical Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-white/10 text-sm text-gray-500">
          © {new Date().getFullYear()} CareConnect. CareConnect does not provide medical diagnosis, treatment, or emergency dispatch services. In a medical emergency, call 112 immediately.
        </div>
      </footer>
    </div>
  );
}
