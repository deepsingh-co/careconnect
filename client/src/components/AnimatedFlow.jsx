import { Fragment } from 'react';
import { MessageCircle, Bot, Zap, Users, CheckCheck, ShieldAlert } from 'lucide-react';

const steps = [
  {
    icon: MessageCircle,
    iconClass: 'bg-green-100 text-green-700',
    title: 'Parent sends a WhatsApp message',
    desc: '“Dawai li”, “Ride chahiye” or a voice note — no app, no password to remember.',
  },
  {
    icon: Bot,
    iconClass: 'bg-teal-100 text-teal-700',
    title: 'CareConnect understands',
    desc: 'Hindi, English or Hinglish. Intent and urgency are detected instantly.',
  },
  {
    icon: Zap,
    iconClass: 'bg-amber-100 text-amber-700',
    title: 'System takes action',
    desc: 'Reminder logged, ride requested, helper assigned — family notified.',
  },
  {
    icon: Users,
    iconClass: 'bg-blue-100 text-blue-700',
    title: 'Family & helpers respond',
    desc: 'The dashboard updates live. Helpers accept jobs from their portal.',
  },
];

export default function AnimatedFlow() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-stretch">
        {steps.map((s, i) => (
          <Fragment key={s.title}>
            <div
              className="flow-node flex-1 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 relative"
              style={{ animationDelay: `${i * 0.9}s` }}
            >
              <span className="absolute -top-2.5 right-4 text-[10px] font-bold tracking-wider uppercase text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                Step {i + 1}
              </span>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${s.iconClass}`}>
                <s.icon size={22} />
              </div>
              <h3 className="font-semibold text-[#1e3a5f] text-sm sm:text-base mb-1.5">{s.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{s.desc}</p>
            </div>

            {i < steps.length - 1 && (
              <>
                {/* Horizontal connector — desktop */}
                <div className="hidden md:flex items-center w-10 lg:w-14 shrink-0" aria-hidden="true">
                  <div className="relative w-full border-t-2 border-dashed border-teal-300">
                    <span className="flow-dot-x" style={{ animationDelay: `${i * 0.4}s` }} />
                  </div>
                </div>
                {/* Vertical connector — mobile */}
                <div className="md:hidden ml-7 h-7 border-l-2 border-dashed border-teal-300 relative" aria-hidden="true">
                  <span className="flow-dot-y" style={{ animationDelay: `${i * 0.4}s` }} />
                </div>
              </>
            )}
          </Fragment>
        ))}
      </div>

      {/* Reply loop */}
      <div className="relative mt-7 md:mt-9 border-2 border-dashed border-teal-300 bg-teal-50/60 rounded-2xl sm:rounded-full px-4 sm:px-6 py-3">
        <span className="flow-dot-back" aria-hidden="true" />
        <div className="flex items-center justify-center gap-2 text-center">
          <CheckCheck size={18} className="text-teal-700 shrink-0" />
          <p className="text-xs sm:text-sm text-teal-900 font-medium">
            Confirmation goes back on WhatsApp — “Reminder set”, “Driver aa raha hai”, “Order placed”
          </p>
        </div>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-500 mt-3">
        <ShieldAlert size={14} className="text-amber-600 shrink-0" />
        Emergency message? Family and emergency contacts are alerted immediately — with a reminder to call 112.
      </p>
    </div>
  );
}
