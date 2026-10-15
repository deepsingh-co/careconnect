import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import { Badge } from '../../components/ui';
import {
  MessageCircle, Sparkles, ShieldCheck, Car, UtensilsCrossed,
  Home, Pill, LogOut, CheckCircle2, Phone,
} from 'lucide-react';

const DEMO_WHATSAPP_NUMBER = '+91 98765 43210';

const examples = [
  { icon: UtensilsCrossed, text: 'Khana chahiye' },
  { icon: Car, text: 'Doctor ke paas jaana hai kal' },
  { icon: Pill, text: 'Dawai ka reminder lagao' },
  { icon: Home, text: 'Ghar ki safai karani hai' },
];

const steps = [
  {
    icon: MessageCircle,
    title: 'Aap WhatsApp par message karein',
    desc: 'Hindi, English ya Hinglish — jaise aap kisi apne ko message karte hain. Voice note bhi chalega.',
  },
  {
    icon: Sparkles,
    title: 'AI aapki baat samajhta hai',
    desc: 'Aapki zaroorat samajh kar turant help arrange karta hai — khana, ride, dawai ya ghar ka kaam.',
  },
  {
    icon: ShieldCheck,
    title: 'Bade kaam se pehle family ki approval',
    desc: 'Har important booking se pehle aapke bachche ko message jata hai — verify karne ke liye.',
  },
];

export default function WhatsAppConnect() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-white">
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-lg font-bold text-[#1e3a5f]">CareConnect</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <Badge variant="success" className="mb-4">WhatsApp-only account</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-3">
            Namaste, {user?.name?.split(' ')[0] || ''} ji 🙏
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Aapko kisi app ya website ki zaroorat nahi hai. Aapki saari care — dawai, khana, ride,
            ghar ka kaam — seedha <span className="font-semibold text-teal-700">WhatsApp</span> par hoti hai.
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-teal-200 shadow-sm p-6 md:p-8 mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
            <MessageCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#1e3a5f] mb-1">Start on WhatsApp</h2>
          <p className="text-gray-500 text-sm mb-4">
            Is number par "Hi" bhejein — baaki sab hum sambhal lenge.
          </p>
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-lg font-semibold text-[#1e3a5f]">
            <Phone size={18} className="text-green-600" />
            {DEMO_WHATSAPP_NUMBER}
          </div>
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
            DEMO MODE — messages are simulated for this demo. No real WhatsApp is connected.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {steps.map((s, i) => (
            <div key={s.title} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                <s.icon size={22} className="text-teal-600" />
              </div>
              <p className="text-xs font-semibold text-teal-600 mb-1">STEP {i + 1}</p>
              <h3 className="font-semibold text-[#1e3a5f] mb-2">{s.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-10">
          <h2 className="font-semibold text-[#1e3a5f] mb-4">Aise message bhejein</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {examples.map((e) => (
              <div key={e.text} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <e.icon size={18} className="text-teal-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">"{e.text}"</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> Ride me pehle Ola / Uber / Rapido ke price compare hote hain</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> Family ko verification message jata hai</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-8">
          CareConnect is not a medical service. For emergencies, call 112.
        </p>
      </main>
    </div>
  );
}
