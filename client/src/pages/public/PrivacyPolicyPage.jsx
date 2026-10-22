import { Link } from 'react-router-dom';
import InfoPageLayout, { Section } from './InfoPageLayout';

const UPDATED = '22 October 2026';
const CONTACT_EMAIL = 'deepsinghcode@gmail.com';
const CONTACT_PHONE = '+91 96532 03776';

export default function PrivacyPolicyPage() {
  return (
    <InfoPageLayout
      title="Privacy Policy"
      subtitle="How CareConnect collects, uses and protects the personal information of families, seniors and service providers."
      updated={UPDATED}
    >
      <Section title="1. Who we are">
        <p>
          CareConnect is a care-coordination platform that helps families look after elderly parents living independently.
          Parents interact through WhatsApp, while children, service providers and administrators use the CareConnect
          dashboard. In this policy, "we", "us" and "our" refer to CareConnect.
        </p>
        <p>
          We are committed to handling personal data with care and transparency, in line with applicable Indian law,
          including the Digital Personal Data Protection Act, 2023.
        </p>
      </Section>

      <Section title="2. Information we collect">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Account information:</strong> name, email address, phone number, role (child, parent, provider, admin) and a hashed password. We never store passwords in plain text.</li>
          <li><strong>Parent (senior) profile:</strong> name, age, phone number, medicines and reminder schedules, wellness check-ins, addresses, and emergency contact details — provided by you with the senior's consent.</li>
          <li><strong>WhatsApp interactions:</strong> messages exchanged with our WhatsApp number (e.g. "medicine liya", ride destinations, food orders, check-in replies). We process these to provide the service, and they are handled by Meta/WhatsApp under their own policies.</li>
          <li><strong>Service data:</strong> reminders and their acknowledgements, service bookings, ride and food requests, family links, notifications and alerts.</li>
          <li><strong>Technical data:</strong> limited logs (such as IP address, device/browser type and timestamps) used for security, debugging and audit purposes.</li>
        </ul>
        <p>
          We do not collect payment card details. Food and ride orders that you place through provider apps (e.g. Swiggy,
          Zomato, Uber, Ola) are governed by those providers' own terms and privacy policies.
        </p>
      </Section>

      <Section title="3. How we use information">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>To send and receive WhatsApp messages: medicine reminders, wellness check-ins, and confirmation of requests.</li>
          <li>To show family members a shared view of reminders, check-ins, bookings and alerts.</li>
          <li>To notify family members and emergency contacts when an emergency alert is raised.</li>
          <li>To coordinate verified service providers for household work, rides and other services.</li>
          <li>To keep the platform secure and reliable, including fraud prevention and audit logging.</li>
          <li>To answer support requests and improve the service.</li>
        </ul>
        <p>We do not sell your personal data, and we do not use health-related information for advertising.</p>
      </Section>

      <Section title="4. Consent and family sharing">
        <p>
          A family member (the child account holder) adds a parent after verifying the parent's phone number via OTP and
          confirming they have the parent's consent to coordinate their care. Parents can withdraw consent at any time by
          contacting us or telling us on WhatsApp.
        </p>
        <p>
          Information inside a family account is visible to linked family members and to administrators strictly for
          support and safety purposes, with access logged.
        </p>
      </Section>

      <Section title="5. Sharing with third parties">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Meta / WhatsApp:</strong> to deliver messages to the phone numbers you register.</li>
          <li><strong>Service providers:</strong> only the details needed to complete a job (e.g. address and task) are shared with the assigned provider.</li>
          <li><strong>Emergency contacts:</strong> when an emergency alert is triggered, we notify the contacts you configured.</li>
          <li><strong>Legal requirements:</strong> where required by law or to protect the safety of a person.</li>
        </ul>
      </Section>

      <Section title="6. Data retention">
        <p>
          We keep personal data while your account is active and for a reasonable period afterwards, to meet legal and
          operational needs. One-time codes (OTPs) expire within minutes. When data is no longer needed, we delete or
          anonymise it.
        </p>
      </Section>

      <Section title="7. Security">
        <p>
          Data is encrypted in transit (HTTPS). Passwords and OTPs are stored in hashed form. Access is role-based and
          limited, and administrative actions are recorded in audit logs. No system can be guaranteed 100% secure, but we
          work continuously to protect your information.
        </p>
      </Section>

      <Section title="8. Your rights">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Access and copy of the personal data we hold about you.</li>
          <li>Correction of inaccurate or incomplete information.</li>
          <li>Deletion of your account and associated data, subject to legal obligations.</li>
          <li>Withdrawal of consent — you can stop using the service at any time.</li>
        </ul>
        <p>
          To exercise any of these rights, email <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal-700 hover:underline">{CONTACT_EMAIL}</a>.
          We respond within a reasonable time and may verify your identity first.
        </p>
      </Section>

      <Section title="9. Children">
        <p>
          CareConnect is intended for adults — family caregivers and senior citizens. It is not directed at children
          under 18, and we do not knowingly collect their personal data.
        </p>
      </Section>

      <Section title="10. Not a medical or emergency service">
        <p>
          CareConnect does not diagnose, treat, prescribe or dispatch emergency services. The platform helps families
          coordinate care. In a medical emergency, call 112 immediately. Free teleconsultation is available through the
          Government of India's eSanjeevani service.
        </p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will be communicated through the platform or by
          email before they take effect. The "last updated" date above always reflects the current version.
        </p>
      </Section>

      <Section title="12. Contact us">
        <p>
          Questions about this policy or your data? Write to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal-700 hover:underline">{CONTACT_EMAIL}</a>, call{' '}
          <a href="tel:+919653203776" className="text-teal-700 hover:underline">{CONTACT_PHONE}</a>, or use the{' '}
          <Link to="/contact" className="text-teal-700 hover:underline">contact page</Link>. We aim to respond within 1–2
          business days.
        </p>
      </Section>
    </InfoPageLayout>
  );
}
