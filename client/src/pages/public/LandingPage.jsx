import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, HeartPulse, Car, UtensilsCrossed, Users, Shield, Phone, Pill, Calendar, Home } from 'lucide-react';
import Logo from '../../components/Logo';

const features = [
  { icon: Pill, title: 'Medicine Reminders', desc: 'WhatsApp reminders with one-tap acknowledgement. Family gets notified if a dose is missed.' },
  { icon: HeartPulse, title: 'Daily Wellness Check-ins', desc: 'Automated daily check-ins. Parents reply with one word, family sees the status in real time.' },
  { icon: Car, title: 'Ride Booking', desc: 'Request rides to hospitals, clinics or appointments. Family can book on behalf of parents.' },
  { icon: UtensilsCrossed, title: 'Food & Grocery', desc: 'Order home-style meals and groceries through a simple WhatsApp message.' },
  { icon: Home, title: 'Household Services', desc: 'Cleaning, gardening, car wash — verified local helpers at your doorstep.' },
  { icon: Users, title: 'Family Coordination', desc: 'One shared dashboard. Everyone stays informed without constant phone calls.' },
];

const howItWorks = [
  { step: '1', title: 'Parents use WhatsApp', desc: 'Send a message or voice note in Hindi, English or Hinglish. The AI understands and helps.' },
  { step: '2', title: 'Children use the dashboard', desc: 'View medication status, bookings, alerts and wellness check-ins from any device.' },
  { step: '3', title: 'Workers get assignments', desc: 'Verified local service providers receive, accept and complete jobs through their portal.' },
];

const faqs = [
  { q: 'Is CareConnect a medical service?', a: 'No. CareConnect does not diagnose, treat or prescribe. It helps coordinate reminders, check-ins, transport and household services with family involvement.' },
  { q: 'What happens if I miss a medicine reminder?', a: 'The system marks it as missed, sends follow-up reminders, and notifies your family member. A missed reminder is not treated as a medical emergency.' },
  { q: 'How is my data protected?', a: 'All data is encrypted in transit. Family members only see data you consent to share. Admins access data only for support with audit logging.' },
  { q: 'Does it work without internet?', a: 'Parents can use WhatsApp (which works on basic phones). The dashboard requires internet. Emergency contacts can also be called directly.' },
  { q: 'Do parents need the website?', a: 'No. Parents interact only through WhatsApp — no app, no website, no password to remember. The web dashboard is for children, service providers and admins.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={36} />
            <span className="text-xl font-bold text-[#1e3a5f]">CareConnect</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#how-it-works" className="hover:text-teal-700">How It Works</a>
            <a href="#features" className="hover:text-teal-700">Features</a>
            <a href="#faq" className="hover:text-teal-700">FAQ</a>
            <Link to="/auth/login" className="hover:text-teal-700">Sign In</Link>
            <Link to="/auth/register" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">Get Started</Link>
          </nav>
          <Link to="/auth/register" className="md:hidden bg-teal-600 text-white px-3 py-1.5 rounded-lg text-sm">Sign Up</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-14 md:pt-24 md:pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-medium mb-5 md:mb-6">
            <MessageCircle size={16} />
            WhatsApp-first elderly care platform
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-[#1e3a5f] leading-tight mb-5 md:mb-6">
            Stay close to your parents, even from miles away.
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
            CareConnect helps elderly parents living independently while their children study or work in other cities.
            Parents use simple WhatsApp messages. Children use a shared dashboard. One secure platform for medication
            reminders, wellness check-ins, rides, food and household help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/auth/register" className="bg-teal-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-teal-700 flex items-center justify-center gap-2">
              Create Free Account <ArrowRight size={20} />
            </Link>
            <Link to="/auth/login" className="border-2 border-gray-300 text-gray-700 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:border-teal-500 hover:text-teal-700 flex items-center justify-center">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gray-50 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#1e3a5f] mb-8 md:mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200">
                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#1e3a5f] mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
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
              <li className="flex items-center gap-2"><Phone size={14} /> Support: +91 8000-CARE (demo)</li>
              <li>📧 support@careconnect.health</li>
              <li>📍 Jaipur, Rajasthan, India</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#privacy" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#disclaimer" className="hover:text-white">Medical Disclaimer</a></li>
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
