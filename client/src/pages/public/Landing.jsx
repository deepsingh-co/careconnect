import { Link } from 'react-router-dom';
import {
  MessageCircle, HeartPulse, Car, ShoppingBasket, Home, Bell, Shield,
  Users, Pill, CalendarCheck, ArrowRight, CheckCircle2, Phone,
} from 'lucide-react';
import { Logo } from '../../components/Logo';

const steps = [
  { n: '1', t: 'Parent messages on WhatsApp', d: 'A simple message or voice note in Hindi, English or Hinglish — "Ride chahiye" or "Medicine reminder set karo".' },
  { n: '2', t: 'CareConnect understands and coordinates', d: 'The conversation engine identifies the request, asks for missing details and creates a structured booking.' },
  { n: '3', t: 'Worker receives the job', d: 'Verified local providers accept, complete and update the job status in their portal.' },
  { n: '4', t: 'Family sees everything on the dashboard', d: 'Consented updates, reminders, check-ins and alerts appear in real time for caregivers.' },
];

const features = [
  { icon: Pill, t: 'Medication reminders', d: 'Family-entered schedules from authorized instructions. Parents reply "taken", "later" or "need help" — acknowledgements are tracked. We never suggest dosages.' },
  { icon: CalendarCheck, t: 'Daily wellness check-ins', d: 'Morning and evening check-ins in the parent\'s language. Missed check-ins surface to caregivers — never treated as proof of an emergency.' },
  { icon: Car, t: 'Ride coordination', d: 'Book transport to appointments with pickup, destination and time. Confirmation is required before any request is submitted.' },
  { icon: ShoppingBasket, t: 'Food & grocery requests', d: 'A configurable menu with cart, quantity and delivery address. Clearly labeled demo catalogue until a real provider is connected.' },
  { icon: Home, t: 'Household services', d: 'Cleaning, gardening, car wash, plumbing and electrical — one-time, hourly or recurring with worker assignment and status tracking.' },
  { icon: Bell, t: 'Family notifications', d: 'New bookings, cancellations, worker arrival, missed reminders and alerts notify the family through the dashboard.' },
];

const faqs = [
  { q: 'Does CareConnect give medical advice?', a: 'No. CareConnect never diagnoses, prescribes, recommends dosages, or replaces healthcare professionals. Reminder schedules are entered by family from authorized prescriptions only.' },
  { q: 'Is CareConnect an ambulance service?', a: 'No. Emergency alerts notify your family contacts. CareConnect does not dispatch emergency services — always call 112 for life-threatening emergencies.' },
  { q: 'What happens without WhatsApp credentials?', a: 'The app runs in clearly-labeled DEMO MODE. All workflows work end-to-end with simulated messages, and every simulated action is explicitly marked as simulated.' },
  { q: 'Who can see my parent\'s data?', a: 'Only family members linked with explicit consent, plus assigned workers for their specific job. Providers never see full addresses before accepting an assignment.' },
  { q: 'What languages are supported?', a: 'English, Hindi and Hinglish for WhatsApp conversations and check-in responses. The dashboard supports English.' },
  { q: 'Do you work with real service providers?', a: 'Provider accounts are verified and approved by an administrator before receiving real assignments. Without a live network, demo providers are clearly labeled as fictional.' },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#f0fdfa] to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#0d9488]/10 text-[#0d9488] px-3 py-1 rounded-full text-sm font-medium mb-6">
              <MessageCircle size={15} /> Parents use WhatsApp. Family uses the dashboard.
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#1e3a5f] leading-tight">
              Coordinate care for aging parents — without changing how they live.
            </h1>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              When children live in other cities, elderly parents often struggle with medicines,
              appointments and daily chores. CareConnect lets parents simply message on WhatsApp
              while the family coordinates everything from one secure dashboard.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-[#0d9488] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#0f766e] transition-colors text-base"
              >
                Create a family account <ArrowRight size={18} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#1e3a5f] border border-gray-300 px-6 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-base"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Demo application · Healthcare hackathon build · Not a medical device
            </p>
          </div>

          {/* WhatsApp preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden max-w-md mx-auto w-full">
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center font-semibold">KV</div>
              <div>
                <div className="text-sm font-semibold">CareConnect (Demo)</div>
                <div className="text-xs opacity-80">WhatsApp</div>
              </div>
            </div>
            <div className="p-4 space-y-3 bg-[#ece5dd] min-h-[280px]">
              <div className="bg-white rounded-lg rounded-tl-none p-3 max-w-[85%] text-sm shadow-sm">
                <p>Namaste! Aaj aapki dawa ka reminder hai: Metformin 500mg — subah 8:30 baje.</p>
                <div className="text-[10px] text-gray-500 mt-1 text-right">8:30 AM</div>
              </div>
              <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none p-3 max-w-[75%] ml-auto text-sm shadow-sm">
                <p>Liya ✓</p>
                <div className="text-[10px] text-gray-500 mt-1 text-right">8:34 AM</div>
              </div>
              <div className="bg-white rounded-lg rounded-tl-none p-3 max-w-[85%] text-sm shadow-sm">
                <p>Shukriya! Recorded as taken. Aaj shaam 7 baje aapko fir yaad dilayenge.</p>
                <div className="text-[10px] text-gray-500 mt-1 text-right">8:34 AM</div>
              </div>
              <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none p-3 max-w-[75%] ml-auto text-sm shadow-sm">
                <p>Kal doctor ke liye ride chahiye, 10 baje</p>
                <div className="text-[10px] text-gray-500 mt-1 text-right">9:02 AM</div>
              </div>
              <div className="bg-white rounded-lg rounded-tl-none p-3 max-w-[85%] text-sm shadow-sm">
                <p>Ride booking shuru karte hain. Pickup address aur hospital ka naam bataiye?</p>
                <div className="text-[10px] text-gray-500 mt-1 text-right">9:02 AM</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="features">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1e3a5f]">One platform, three connected experiences</h2>
          <p className="mt-3 text-gray-600">
            No app to install for parents. No new workflow for workers. One secure backend for everyone.
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            { t: 'Parents', d: 'Message on WhatsApp in the language they already use. No forms, no passwords to remember.', icon: MessageCircle },
            { t: 'Children & caregivers', d: 'A clear dashboard with reminders, bookings, check-ins, alerts and consent management.', icon: Users },
            { t: 'Local workers', d: 'Accept jobs, update status and complete work — with verification before real assignments.', icon: Home },
          ].map((x) => (
            <div key={x.t} className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#0d9488]/40 transition-colors">
              <div className="h-11 w-11 rounded-xl bg-[#0d9488]/10 text-[#0d9488] flex items-center justify-center mb-4">
                <x.icon size={22} />
              </div>
              <h3 className="text-lg font-semibold text-[#1e3a5f]">{x.t}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#1e3a5f] text-white py-16" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold">How CareConnect works</h2>
            <p className="mt-3 text-gray-300">
              From a WhatsApp message to a completed job — with the family informed at every step.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="h-9 w-9 rounded-lg bg-[#2dd4bf] text-[#1e3a5f] font-bold flex items-center justify-center mb-4">
                  {s.n}
                </div>
                <h3 className="font-semibold text-lg">{s.t}</h3>
                <p className="mt-2 text-sm text-gray-300 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1e3a5f]">Everything a caregiving family needs</h2>
          <p className="mt-3 text-gray-600">Healthcare coordination, transport and household support in one place.</p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.t} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="h-11 w-11 rounded-xl bg-[#0d9488]/10 text-[#0d9488] flex items-center justify-center mb-4">
                <f.icon size={22} />
              </div>
              <h3 className="font-semibold text-[#1e3a5f] text-lg">{f.t}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="bg-gray-50 border-y border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#1e3a5f]">The family dashboard, at a glance</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Caregivers see only consented information: reminder acknowledgements, upcoming visits,
              wellness responses, ride and food requests, plus alerts when something needs attention.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Real data from the backend — never placeholder statistics',
                'Filters by status, category and date',
                'Consent management you can change at any time',
                'Clear loading, empty and error states throughout',
              ].map((x) => (
                <li key={x} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 size={18} className="text-[#16a34a] shrink-0 mt-0.5" />
                  {x}
                </li>
              ))}
            </ul>
            <Link
              to="/auth/register"
              className="mt-8 inline-flex items-center gap-2 bg-[#0d9488] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#0f766e] transition-colors"
            >
              Open the dashboard <ArrowRight size={17} />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'Reminders today', v: '2/2' },
                { l: 'Next visit', v: 'Wed' },
                { l: 'Check-in', v: 'Done' },
              ].map((s) => (
                <div key={s.l} className="bg-[#f8fafc] rounded-xl p-3 border border-gray-100">
                  <div className="text-xl font-bold text-[#1e3a5f]">{s.v}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {[
                { t: 'Home cleaning', s: 'Accepted', c: 'teal' },
                { t: 'Medicine — morning dose', s: 'Taken 8:34 AM', c: 'green' },
                { t: 'Ride to SMS Hospital', s: 'Awaiting confirmation', c: 'amber' },
              ].map((r) => (
                <div key={r.t} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                  <div className="text-sm font-medium text-gray-800">{r.t}</div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                    r.c === 'green' ? 'bg-green-100 text-green-700'
                    : r.c === 'teal' ? 'bg-teal-100 text-teal-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>{r.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="safety">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-[#0d9488] mb-4">
            <Shield size={20} />
            <span className="text-sm font-semibold uppercase tracking-wide">Safety, privacy & trust</span>
          </div>
          <h2 className="text-3xl font-bold text-[#1e3a5f]">Built for sensitive family data</h2>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { t: 'Consent-first sharing', d: 'Family links require explicit consent that can be revoked. Providers never see full addresses before assignment.' },
            { t: 'Role-based access', d: 'Every API request is authorized on the server. Hiding buttons in the browser is not a security control.' },
            { t: 'No fake integrations', d: 'Simulated actions are always labeled. We never claim a message, booking or dispatch happened if it did not.' },
            { t: 'Data minimization', d: 'We collect only what the workflow needs, with audit logging and environment-based secrets.' },
          ].map((x) => (
            <div key={x.t} className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-[#1e3a5f]">{x.t}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-[#fffbeb] border border-[#fcd34d] rounded-2xl p-5 text-sm text-[#92400e]">
          <strong className="font-semibold">Important:</strong> CareConnect does not diagnose illness,
          prescribe treatment, or replace doctors, nurses or emergency services. In a life-threatening
          emergency, call <strong>112</strong> immediately.
        </div>
      </section>

      {/* Roadmap / impact */}
      <section className="bg-gray-50 border-y border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#1e3a5f] text-center">Implementation roadmap</h2>
          <div className="mt-10 grid md:grid-cols-4 gap-6">
            {[
              { p: 'Phase 1', t: 'Core coordination', d: 'WhatsApp conversation engine, family dashboard, service bookings and verified worker assignment.', live: true },
              { p: 'Phase 2', t: 'Health workflows', d: 'Medication acknowledgements, wellness check-ins and caregiver escalation alerts.', live: true },
              { p: 'Phase 3', t: 'Live integrations', d: 'Meta/Twilio WhatsApp credentials, real ride & food provider APIs, push notifications.', live: false },
              { p: 'Phase 4', t: 'Scale & compliance', d: 'Production hardening, DPDP Act review, healthcare data controls and regional rollout.', live: false },
            ].map((r) => (
              <div key={r.p} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="text-xs font-bold uppercase tracking-wide text-[#0d9488]">{r.p}</div>
                <h3 className="mt-2 font-semibold text-[#1e3a5f]">{r.t}</h3>
                <p className="mt-2 text-sm text-gray-600">{r.d}</p>
                <div className={`mt-4 text-xs font-medium px-2 py-1 rounded-full inline-block ${
                  r.live ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {r.live ? 'In this build' : 'Planned'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="faq">
        <h2 className="text-3xl font-bold text-[#1e3a5f] text-center">Frequently asked questions</h2>
        <div className="mt-8 space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="bg-white border border-gray-200 rounded-xl p-5 group">
              <summary className="font-semibold text-[#1e3a5f] cursor-pointer list-none flex justify-between items-center">
                {f.q}
                <span className="text-[#0d9488] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0d9488] py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white">Start coordinating care today</h2>
          <p className="mt-3 text-white/90">
            Create a family account, link your parent with a one-time code, and set up the first reminder.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth/register"
              className="bg-white text-[#0d9488] px-7 py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Get started free
            </Link>
            <Link
              to="/auth/login"
              className="bg-[#0f766e] text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-[#115e59] transition-colors border border-white/30"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-white/70 text-sm flex items-center justify-center gap-2">
            <Phone size={14} /> Emergency services: 112
          </p>
        </div>
      </section>
    </div>
  );
}
