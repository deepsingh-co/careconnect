import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Car,
  Check,
  CheckCheck,
  FileCheck2,
  HeartPulse,
  Home,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  PhoneCall,
  Pill,
  Plus,
  Send,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import Logo from '../../components/Logo';
import AnimatedFlow from '../../components/AnimatedFlow';

const currentYear = new Date().getFullYear();

const navLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#safety', label: 'Safety' },
  { href: '#faq', label: 'FAQ' },
];

const features = [
  {
    icon: Pill,
    title: 'Medicine reminders',
    desc: 'WhatsApp reminders with one-tap acknowledgement. Family gets notified if a dose is missed.',
    tag: 'Pill · dose · family alert',
    accent: 'bg-care-50 text-care-600',
  },
  {
    icon: HeartPulse,
    title: 'Daily wellness check-ins',
    desc: 'A simple daily check-in. Parents reply with one word, family sees the status in real time.',
    tag: 'One-word replies',
    accent: 'bg-care-green-soft text-care-green-dark',
  },
  {
    icon: Car,
    title: 'Ride booking',
    desc: 'Request rides to hospitals, clinics or appointments. Family can book on behalf of parents.',
    tag: 'Hospital · clinic · pharmacy',
    accent: 'bg-care-50 text-care-600',
  },
  {
    icon: UtensilsCrossed,
    title: 'Food & grocery',
    desc: 'Order home-style meals and groceries through a simple WhatsApp message.',
    tag: 'Meals · groceries',
    accent: 'bg-amber-50 text-amber-700',
  },
  {
    icon: Home,
    title: 'Household services',
    desc: 'Cleaning, gardening, car wash — verified local helpers at your doorstep.',
    tag: 'Verified local helpers',
    accent: 'bg-care-100 text-care-700',
  },
  {
    icon: Users,
    title: 'Family coordination',
    desc: 'One shared dashboard. Everyone stays informed without constant phone calls.',
    tag: 'Shared dashboard',
    accent: 'bg-care-green-soft text-care-green-dark',
  },
];

const trustPillars = [
  {
    icon: LockKeyhole,
    title: 'Consent-based sharing',
    desc: 'Parents control what family members can see and do — and can change it at any time.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    desc: 'Strict server-side authorization keeps every role in its lane.',
  },
  {
    icon: Stethoscope,
    title: 'Not a medical device',
    desc: 'We coordinate care. We never diagnose, treat or prescribe.',
  },
  {
    icon: FileCheck2,
    title: 'Full audit trail',
    desc: 'Support access is logged, reviewed and traceable.',
  },
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

        <section aria-label="CareConnect at a glance" className="border-y border-care-100 bg-white/80">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:py-10">
            <p className="shrink-0 text-sm font-bold uppercase tracking-[0.16em] text-care-600">Care, coordinated</p>
            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4 sm:divide-x sm:divide-care-100">
              {[
                { value: '6', label: 'services in one place' },
                { value: '1', label: 'WhatsApp thread' },
                { value: '0', label: 'apps for parents' },
                { value: '3', label: 'languages understood' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse items-center gap-1 text-center sm:px-4">
                  <dt className="text-xs font-semibold leading-snug text-ink-muted sm:text-sm">{stat.label}</dt>
                  <dd className="font-display text-3xl font-bold tracking-tight text-care-800 sm:text-4xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="relative py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-care-600">How it works</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] text-care-900 sm:text-4xl md:text-5xl">
                One WhatsApp message. Everyone in sync.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
                Parents keep the conversation they already know. CareConnect handles the coordination behind it.
              </p>
            </div>

            <div className="mt-12 md:mt-16">
              <AnimatedFlow />
            </div>

            <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-care-100 bg-white/80 p-5 shadow-sm sm:flex-row sm:items-center">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-care-50 text-care-600">
                <Smartphone className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-bold text-care-900">Parents never install an app</p>
                <p className="text-sm text-ink-muted">
                  A normal phone with WhatsApp is enough. No password, no new device, no learning curve.
                </p>
              </div>
              <a
                href="#features"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-care-700 transition-colors hover:bg-care-50 hover:text-care-800 sm:ml-auto"
              >
                Explore features
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative overflow-hidden bg-white py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-care-600">Everything in one place</p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] text-care-900 sm:text-4xl md:text-5xl">
                  Six kinds of help. One family thread.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
                  From a missed dose to a ride to the clinic, CareConnect keeps the everyday logistics of care in one
                  calm place.
                </p>
              </div>
              <Link
                to="/auth/register"
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-care-200 bg-white px-4 py-2.5 text-sm font-semibold text-care-700 shadow-sm transition-colors hover:border-care-300 hover:bg-care-50"
              >
                Start free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <article
                  key={f.title}
                  className={`group relative overflow-hidden rounded-3xl border border-care-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-care-200 hover:shadow-lg hover:shadow-care-900/5 ${
                    i === 0 ? 'md:col-span-2 lg:col-span-2' : ''
                  } ${i === 5 ? 'md:col-span-2 lg:col-span-3' : ''}`}
                >
                  <div className={i === 5 ? 'lg:flex lg:items-center lg:gap-10' : ''}>
                    <div className={i === 5 ? 'lg:max-w-md' : ''}>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${f.accent}`}>
                        <f.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-care-900">{f.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.desc}</p>
                      <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-care-600">
                        <Check className="h-3.5 w-3.5 text-care-green" aria-hidden="true" />
                        {f.tag}
                      </p>
                    </div>

                    {i === 5 && (
                      <div className="mt-6 flex-1 rounded-2xl border border-care-100 bg-care-50/70 p-4 lg:mt-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">Family dashboard</p>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-care-green-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-care-green-dark">
                            <span className="h-1.5 w-1.5 rounded-full bg-care-green" aria-hidden="true" />
                            Live
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {[
                            { icon: Pill, label: 'Medicine', value: 'Taken · 8:02 AM' },
                            { icon: HeartPulse, label: 'Wellness', value: 'All good today' },
                            { icon: Car, label: 'Ride', value: 'Tomorrow · 10 AM' },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 shadow-sm">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-care-50 text-care-600">
                                <item.icon className="h-4 w-4" aria-hidden="true" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">{item.label}</p>
                                <p className="truncate text-xs font-bold text-care-900">{item.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          {['P', 'R', 'A'].map((initial) => (
                            <span
                              key={initial}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-care-600 text-[9px] font-bold text-white ring-2 ring-white"
                            >
                              {initial}
                            </span>
                          ))}
                          <span className="text-[11px] font-medium text-ink-muted">3 family members can see this</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {i === 0 && (
                    <div className="mt-6 rounded-2xl border border-care-100 bg-care-50/70 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-care-600 shadow-sm">
                          <Pill className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-care-900">Morning medicine</p>
                          <p className="text-xs font-medium text-ink-muted">Metformin 500 mg · 8:00 AM</p>
                        </div>
                        <span className="rounded-full bg-care-green-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-care-green-dark">
                          Taken
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-care-100 pt-3 text-xs text-ink-muted">
                        <span className="flex items-center gap-1.5">
                          <CheckCheck className="h-4 w-4 text-care-green" aria-hidden="true" />
                          Confirmed on WhatsApp
                        </span>
                        <span className="font-semibold text-care-700">Family notified</span>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Safety & Trust */}
        <section id="safety" className="relative overflow-hidden bg-care-900 py-20 text-white md:py-28">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-care-600/30 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 h-96 w-96 rounded-full bg-care-green/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-care-300">Safety, privacy & trust</p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl md:text-5xl">
                  Peace of mind is part of the product.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-care-100/85 sm:text-lg">
                  CareConnect is built around consent, clear roles and a full audit trail. Parents decide what is shared.
                  Family members only see what they need. We never sell data and never pretend to replace a doctor.
                </p>
                <Link
                  to="/privacy"
                  className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
                >
                  Read our privacy policy
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {trustPillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur transition-colors hover:border-white/20 hover:bg-white/[0.09]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-care-300/10 text-care-300">
                      <pillar.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-bold text-white">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-care-100/85">{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <ul className="mt-12 grid gap-3 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
              {['Encrypted in transit', 'Consent-based sharing', 'Role-based access', 'Audit logged'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-semibold text-care-100">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-care-green/15 text-care-green">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-care-600">Questions, answered</p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] text-care-900 sm:text-4xl md:text-5xl">
                  A few things families ask us.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-ink-muted">
                  Can’t find your answer? We’re a small team and we read every message.
                </p>
                <Link
                  to="/contact"
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-care-200 bg-care-50 px-4 py-2.5 text-sm font-semibold text-care-700 transition-colors hover:border-care-300 hover:bg-white"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Talk to us
                </Link>
              </div>

              <div className="space-y-3">
                {faqs.map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-2xl border border-care-100 bg-care-50/60 p-5 transition-colors open:border-care-200 open:bg-white open:shadow-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-bold text-care-900 [&::-webkit-details-marker]:hidden">
                      <span>{f.q}</span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-care-600 shadow-sm transition-transform duration-200 group-open:rotate-45">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </summary>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-care-600 py-16 text-white md:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[24px] border-white/10" />
            <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full border-[24px] border-white/10" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Start in minutes
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl md:text-5xl">
              Ready to stay connected?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-care-100 sm:text-lg">
              Create your family account in minutes. No credit card. No app for parents — just WhatsApp.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/auth/register"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-care-green-dark px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-care-950/20 transition-all hover:-translate-y-0.5 hover:bg-[#166534]"
              >
                Create your free account
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                to="/auth/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-5 text-xs font-medium text-care-100">
              Parents only need WhatsApp. The dashboard is for children, providers and admins.
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-care-950 text-care-100">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
            <div>
              <Link to="/" className="inline-flex items-center gap-3 rounded-xl" aria-label="CareConnect home">
                <Logo size={32} />
                <span className="font-display text-lg font-bold text-white">
                  Care<span className="text-care-300">Connect</span>
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-care-200/80">
                WhatsApp-based coordination for families caring for elderly parents living independently.
              </p>
              <a
                href="tel:112"
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-care-100 transition-colors hover:bg-white/10"
              >
                <PhoneCall className="h-3.5 w-3.5 text-care-300" aria-hidden="true" />
                Medical emergency? Call 112
              </a>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-care-300">Product</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="#how-it-works" className="text-care-200 transition-colors hover:text-white">How it works</a></li>
                <li><a href="#features" className="text-care-200 transition-colors hover:text-white">Features</a></li>
                <li><a href="#safety" className="text-care-200 transition-colors hover:text-white">Safety & privacy</a></li>
                <li><a href="#faq" className="text-care-200 transition-colors hover:text-white">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-care-300">Account</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><Link to="/auth/login" className="text-care-200 transition-colors hover:text-white">Sign in</Link></li>
                <li><Link to="/auth/register" className="text-care-200 transition-colors hover:text-white">Create account</Link></li>
                <li><Link to="/contact" className="text-care-200 transition-colors hover:text-white">Contact us</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-care-300">Contact & legal</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a href="tel:+919653203776" className="flex items-start gap-2 text-care-200 transition-colors hover:text-white">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-care-400" aria-hidden="true" />
                    +91 96532 03776
                  </a>
                </li>
                <li>
                  <a href="mailto:deepsinghcode@gmail.com" className="flex items-start gap-2 break-all text-care-200 transition-colors hover:text-white">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-care-400" aria-hidden="true" />
                    deepsinghcode@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-2 text-care-200">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-care-400" aria-hidden="true" />
                  Jaipur, Rajasthan, India
                </li>
                <li><Link to="/privacy" className="text-care-200 transition-colors hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/about" className="text-care-200 transition-colors hover:text-white">About Us</Link></li>
                <li><a href="#safety" className="text-care-200 transition-colors hover:text-white">Medical Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6">
            <p className="text-xs leading-relaxed text-care-300/80">
              © {currentYear} CareConnect. CareConnect coordinates care — it does not provide medical
              diagnosis, treatment, or emergency dispatch services. In a medical emergency, call 112 immediately.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
