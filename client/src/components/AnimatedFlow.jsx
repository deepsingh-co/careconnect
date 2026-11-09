import { Fragment } from 'react';
import { MessageCircle, Bot, Zap, Users, CheckCheck, ShieldAlert } from 'lucide-react';

const steps = [
  {
    icon: MessageCircle,
    iconClass: 'bg-care-green-soft text-care-green-dark',
    title: 'Parent sends a WhatsApp message',
    desc: '“Dawai li”, “Ride chahiye” or a voice note — no app, no password to remember.',
  },
  {
    icon: Bot,
    iconClass: 'bg-care-50 text-care-600',
    title: 'CareConnect understands',
    desc: 'Hindi, English or Hinglish. Intent and urgency are detected instantly.',
  },
  {
    icon: Zap,
    iconClass: 'bg-amber-50 text-amber-700',
    title: 'System takes action',
    desc: 'Reminder logged, ride requested, helper assigned — family notified.',
  },
  {
    icon: Users,
    iconClass: 'bg-care-100 text-care-700',
    title: 'Family & helpers respond',
    desc: 'The dashboard updates live. Helpers accept jobs from their portal.',
  },
];

export default function AnimatedFlow() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-stretch">
        {steps.map((s, i) => (
          <Fragment key={s.title}>
            <div className="relative flex-1 rounded-3xl border border-care-100 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6">
              <span className="absolute -top-2.5 right-4 rounded-full border border-care-200 bg-care-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-care-700">
                Step {i + 1}
              </span>
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${s.iconClass}`}>
                <s.icon size={22} aria-hidden="true" />
              </div>
              <h3 className="mb-1.5 text-sm font-bold text-care-900 sm:text-base">{s.title}</h3>
              <p className="text-xs leading-relaxed text-ink-muted sm:text-sm">{s.desc}</p>
            </div>

            {i < steps.length - 1 && (
              <>
                {/* Horizontal connector — desktop */}
                <div className="hidden w-10 shrink-0 items-center md:flex lg:w-14" aria-hidden="true">
                  <div className="relative w-full border-t-2 border-dashed border-care-300">
                    <span className="flow-dot-x" style={{ animationDelay: `${i * 0.4}s` }} />
                  </div>
                </div>
                {/* Vertical connector — mobile */}
                <div
                  className="relative ml-7 h-7 border-l-2 border-dashed border-care-300 md:hidden"
                  aria-hidden="true"
                >
                  <span className="flow-dot-y" style={{ animationDelay: `${i * 0.4}s` }} />
                </div>
              </>
            )}
          </Fragment>
        ))}
      </div>

      {/* Reply loop */}
      <div className="relative mt-7 rounded-2xl border-2 border-dashed border-care-200 bg-care-50/70 px-4 py-3 sm:mt-9 sm:rounded-full sm:px-6">
        <span className="flow-dot-back" aria-hidden="true" />
        <div className="flex items-center justify-center gap-2 text-center">
          <CheckCheck size={18} className="shrink-0 text-care-600" aria-hidden="true" />
          <p className="text-xs font-semibold text-care-800 sm:text-sm">
            Confirmation goes back on WhatsApp — “Reminder set”, “Driver aa raha hai”, “Order placed”
          </p>
        </div>
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-ink-muted">
        <ShieldAlert size={14} className="shrink-0 text-amber-600" aria-hidden="true" />
        Emergency message? Family and emergency contacts are alerted immediately — with a reminder to call 112.
      </p>
    </div>
  );
}
