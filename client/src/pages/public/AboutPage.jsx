import { Link } from 'react-router-dom';
import { MessageCircle, HeartPulse, Car, UtensilsCrossed, Users, Shield, Phone, Pill, Home } from 'lucide-react';
import InfoPageLayout, { Section } from './InfoPageLayout';

const values = [
  { icon: MessageCircle, title: 'WhatsApp-first', desc: 'Parents never need a new app or password. If they can send a WhatsApp message, they can use CareConnect.' },
  { icon: Users, title: 'Family at the centre', desc: 'One shared dashboard keeps every sibling informed — no repeated phone calls, no missed updates.' },
  { icon: Shield, title: 'Safety by design', desc: 'OTP verification, role-based access, audit logs and clear demo labels. We never fake a booking or a delivery.' },
  { icon: HeartPulse, title: 'Dignity for seniors', desc: 'Seniors stay independent in their own homes while family quietly stays in the loop.' },
];

const features = [
  { icon: Pill, title: 'Medicine reminders', desc: 'WhatsApp reminders with one-tap acknowledgement; family is notified when a dose is missed.' },
  { icon: HeartPulse, title: 'Wellness check-ins', desc: 'Daily check-ins where parents reply in one word and the family sees the status instantly.' },
  { icon: Car, title: 'Rides & appointments', desc: 'Book rides to hospitals and clinics, or hand off to the real Uber / Ola / Rapido app with the trip pre-filled.' },
  { icon: UtensilsCrossed, title: 'Food & essentials', desc: 'A simple WhatsApp menu for meals, plus direct links to order real food on Swiggy / Zomato.' },
  { icon: Home, title: 'Household help', desc: 'Verified local helpers for cleaning, gardening and small repairs.' },
  { icon: Phone, title: 'Emergency alerts', desc: 'One message alerts the whole family, with a clear reminder that emergencies need 112.' },
];

export default function AboutPage() {
  return (
    <InfoPageLayout
      title="About CareConnect"
      subtitle="Care coordination built around the tool every parent already knows — WhatsApp."
    >
      <Section title="Our mission">
        <p>
          Millions of Indian seniors live independently while their children work in other cities or countries. Staying
          connected should not mean constant phone calls, forgotten medicines or missed appointments. CareConnect closes
          that gap: parents keep using WhatsApp, children get a clear shared dashboard, and trusted helpers are one
          message away.
        </p>
        <p>
          We believe care technology should be simple enough for a 70-year-old, honest enough to never fake a service, and
          respectful enough to keep the senior in control of their own life.
        </p>
      </Section>

      <Section title="How it works">
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Parents use WhatsApp.</strong> They send a message or voice note in Hindi, English or Hinglish — the assistant understands and helps.</li>
          <li><strong>Children use the dashboard.</strong> Medication status, check-ins, bookings and alerts are visible from any device.</li>
          <li><strong>Helpers get assignments.</strong> Verified local providers receive, accept and complete jobs through their portal.</li>
        </ol>
      </Section>

      <Section title="What we offer">
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} className="border border-gray-200 rounded-xl p-4">
              <f.icon size={20} className="text-teal-600 mb-2" />
              <p className="font-semibold text-[#1e3a5f] text-sm">{f.title}</p>
              <p className="text-sm text-gray-600 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="What we stand for">
        <div className="grid sm:grid-cols-2 gap-4">
          {values.map((v) => (
            <div key={v.title} className="bg-gray-50 rounded-xl p-4">
              <v.icon size={20} className="text-teal-600 mb-2" />
              <p className="font-semibold text-[#1e3a5f] text-sm">{v.title}</p>
              <p className="text-sm text-gray-600 mt-1">{v.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Honest by design">
        <p>
          Public APIs for ride-hailing and consumer food ordering are partner-only, so CareConnect clearly labels estimated
          prices and hands real bookings off to the provider's own app. We would rather show you exactly how something
          works than pretend to be something we are not. CareConnect is a care-coordination tool — it is not a hospital,
          pharmacy or emergency service.
        </p>
      </Section>

      <Section title="Get in touch">
        <p>
          We would love to hear from your family. Visit the <Link to="/contact" className="text-teal-700 hover:underline">contact page</Link>{' '}
          or write to <a href="mailto:deepsinghcode@gmail.com" className="text-teal-700 hover:underline">deepsinghcode@gmail.com</a>.
        </p>
      </Section>
    </InfoPageLayout>
  );
}
