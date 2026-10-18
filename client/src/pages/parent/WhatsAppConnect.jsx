import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Send, LogOut } from 'lucide-react';

const QUICK_REPLIES = ['Khana chahiye', 'Ride chahiye', 'Safai karani hai', 'Dawai ka reminder lagao', 'Madad chahiye'];

function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function WhatsAppConnect() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      from: 'bot',
      text: `Namaste ${user?.name?.split(' ')[0] || ''} ji 🙏\nMain aapka CareConnect assistant hoon.\n\nYahan WhatsApp ki tarah message bhejein — jaise:\n• "Khana chahiye"\n• "Doctor ke paas jaana hai kal"\n• "Safai karani hai"`,
      time: nowTime(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function sendMessage(textArg) {
    const text = (textArg ?? input).trim();
    if (!text || sending) return;
    setInput('');
    setMessages((m) => [...m, { id: `u_${Date.now()}`, from: 'user', text, time: nowTime() }]);
    setSending(true);
    try {
      const res = await api.post('/simulator/whatsapp', { message: text });
      const replies = res.data?.data?.replies || [];
      if (!replies.length) {
        setMessages((m) => [...m, { id: `b_${Date.now()}`, from: 'bot', text: 'Ji, main sun raha hoon. Kuch aur batayein?', time: nowTime() }]);
      } else {
        setMessages((m) => [...m, ...replies.map((r, i) => ({ id: `b_${Date.now()}_${i}`, from: 'bot', text: r.text, time: nowTime() }))]);
      }
    } catch (err) {
      setMessages((m) => [...m, {
        id: `e_${Date.now()}`,
        from: 'bot',
        text: err.response?.data?.message || 'Kuch problem aa gayi. Dobara try karein.',
        time: nowTime(),
      }]);
    } finally {
      setSending(false);
    }
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="h-dvh flex flex-col bg-[#efeae2]">
      {/* WhatsApp-style header */}
      <header className="bg-[#008069] text-white px-4 py-2.5 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">CC</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight truncate">CareConnect Assistant</p>
          <p className="text-xs text-white/80">{sending ? 'typing…' : 'online'}</p>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white/10" title="Logout" aria-label="Logout">
          <LogOut size={20} />
        </button>
      </header>

      {/* Demo strip */}
      <div className="bg-amber-100 text-amber-900 text-center text-xs py-1.5 px-3 shrink-0">
        DEMO MODE — yeh WhatsApp ka simulated version hai. Koi real WhatsApp message nahi jata.
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                  m.from === 'user' ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'
                }`}
              >
                <p className="text-sm text-gray-800 whitespace-pre-line">{m.text}</p>
                <p className="text-[10px] text-gray-400 text-right mt-1">{m.time}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </main>

      {/* Quick replies */}
      <div className="px-3 sm:px-6 pb-2 shrink-0">
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto pb-1">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={sending}
              className="shrink-0 text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <footer className="bg-[#f0f2f5] px-3 sm:px-6 py-2.5 shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Message likhein…"
            className="flex-1 rounded-full px-4 py-2.5 text-base sm:text-sm bg-white border border-gray-200 focus:outline-none focus:border-teal-500"
          />
          <button
            onClick={() => sendMessage()}
            disabled={sending || !input.trim()}
            className="w-11 h-11 rounded-full bg-[#008069] text-white flex items-center justify-center hover:bg-[#006f5c] disabled:opacity-50 shrink-0"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="max-w-2xl mx-auto text-center text-[10px] text-gray-400 mt-1.5">
          Emergency ke liye 112 call karein. CareConnect medical service nahi hai.
        </p>
      </footer>
    </div>
  );
}
