import { useState } from 'react';
import { Mail, MapPin, Clock, Send, ShieldAlert, ExternalLink } from 'lucide-react';
import InfoPageLayout, { Section } from './InfoPageLayout';

const CONTACT_EMAIL = 'support@careconnect.health';

const topics = [
  'General question',
  'Help with my account',
  'Add or manage a parent',
  'Service provider enquiry',
  'Privacy or data request',
  'Report a problem',
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: topics[0], message: '' });
  const [opened, setOpened] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const subject = `[CareConnect] ${form.topic}${form.name ? ` — ${form.name}` : ''}`;
    const body = `Name: ${form.name}\nEmail: ${form.email}\nTopic: ${form.topic}\n\n${form.message}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <InfoPageLayout
      title="Contact Us"
      subtitle="Questions, feedback, or need help getting your family set up? We are here."
    >
      <Section title="Support details">
        <div className="grid sm:grid-cols-3 gap-3">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="border border-gray-200 rounded-xl p-4 hover:border-teal-400 transition-colors"
          >
            <Mail size={20} className="text-teal-600 mb-2" />
            <p className="font-semibold text-[#1e3a5f] text-sm">Email us</p>
            <p className="text-sm text-gray-600 mt-1 break-all">{CONTACT_EMAIL}</p>
          </a>
          <div className="border border-gray-200 rounded-xl p-4">
            <Clock size={20} className="text-teal-600 mb-2" />
            <p className="font-semibold text-[#1e3a5f] text-sm">Response time</p>
            <p className="text-sm text-gray-600 mt-1">Within 1–2 business days</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <MapPin size={20} className="text-teal-600 mb-2" />
            <p className="font-semibold text-[#1e3a5f] text-sm">Location</p>
            <p className="text-sm text-gray-600 mt-1">Jaipur, Rajasthan, India</p>
          </div>
        </div>
      </Section>

      <Section title="Send us a message">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input
                id="contact-name"
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">Your email</label>
              <input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="contact-topic" className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <select
              id="contact-topic"
              value={form.topic}
              onChange={(e) => update('topic', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {topics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              id="contact-message"
              rows={5}
              required
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
              placeholder="Tell us how we can help…"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            <Send size={16} /> Send message
          </button>
          <p className="text-xs text-gray-500">
            This opens your email app with the message pre-filled. If nothing opens, email us directly at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal-700 hover:underline">{CONTACT_EMAIL}</a>.
          </p>
          {opened && (
            <p className="text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
              Your email app should be open now — press send there and we will get back to you soon.
            </p>
          )}
        </form>
      </Section>

      <Section title="Emergencies">
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-semibold">CareConnect support is not an emergency service.</p>
            <p className="mt-1">
              For a medical emergency, call <strong>112</strong> immediately. For a free video consultation with a doctor,
              use the Government of India's eSanjeevani service.
            </p>
            <a
              href="https://esanjeevani.mohfw.gov.in/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-2 font-medium underline"
            >
              eSanjeevani <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </Section>
    </InfoPageLayout>
  );
}
