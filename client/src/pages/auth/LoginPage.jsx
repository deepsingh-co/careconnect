import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Alert } from '../../components/ui';
import Logo from '../../components/Logo';
import { MessageCircle, Mail, Phone } from 'lucide-react';

export default function LoginPage() {
  const { login, requestOtp, loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('password'); // 'password' | 'otp'

  // Password login
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // WhatsApp OTP login
  const [phone, setPhone] = useState('+91');
  const [otpSent, setOtpSent] = useState(null);
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [nameRequired, setNameRequired] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const afterLogin = () => {
    const from = location.state?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      afterLogin();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (ev) => {
    ev?.preventDefault?.();
    setOtpError('');
    if (!/^\+?[1-9]\d{6,14}$/.test(phone.trim())) {
      setOtpError('Valid number daaliye with country code (e.g. +919876543210)');
      return;
    }
    setSendingOtp(true);
    try {
      const data = await requestOtp(phone.trim());
      setOtpSent(data);
      setNameRequired(!data.existingUser);
      setOtp('');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Could not send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async (ev) => {
    ev.preventDefault();
    setOtpError('');
    setVerifyingOtp(true);
    try {
      await loginWithOtp({ phone: otpSent.phone, otp: otp.trim(), name: name.trim() || undefined });
      afterLogin();
    } catch (err) {
      const d = err.response?.data;
      if (d?.data?.needsName) setNameRequired(true);
      setOtpError(
        d?.data?.attemptsLeft != null
          ? `${d.message} (${d.data.attemptsLeft} attempts left)`
          : d?.message || 'Verification failed.'
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Logo size={40} />
            <span className="text-2xl font-bold text-[#1e3a5f]">CareConnect</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8">
          {/* Mode tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setMode('password'); setOtpError(''); }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'password' ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail size={15} /> Email & Password
            </button>
            <button
              type="button"
              onClick={() => { setMode('otp'); setServerError(''); }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'otp' ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle size={15} /> WhatsApp OTP
            </button>
          </div>

          {mode === 'password' ? (
            <>
              {serverError && <Alert type="error" className="mb-4">{serverError}</Alert>}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  error={errors.email}
                  autoComplete="email"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  error={errors.password}
                  autoComplete="current-password"
                />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Sign In
                </Button>
              </form>
            </>
          ) : (
            <>
              {otpError && <Alert type="error" className="mb-4">{otpError}</Alert>}

              {!otpSent ? (
                <form onSubmit={sendOtp} className="space-y-4" noValidate>
                  <p className="text-sm text-gray-500">
                    Children apne <span className="font-medium text-gray-700">WhatsApp number</span> se sign in karein —
                    OTP seedha WhatsApp par aayega. Naya number? Account apne aap ban jayega.
                  </p>
                  <Input
                    label="WhatsApp Number"
                    type="tel"
                    placeholder="+919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                  <Button type="submit" loading={sendingOtp} className="w-full" size="lg">
                    <Phone size={16} className="mr-1" /> Send OTP on WhatsApp
                  </Button>
                </form>
              ) : (
                <form onSubmit={verifyOtp} className="space-y-4" noValidate>
                  {otpSent.whatsappLinked === false && (
                    <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2.5">
                      WhatsApp number abhi linked nahi hai, isliye OTP is number par deliver nahi hoga.
                      Admin se <span className="font-semibold">Integrations</span> page par QR scan karwa lein,
                      phir yeh OTP WhatsApp par aayega.
                    </div>
                  )}
                  {otpSent.whatsappLinked !== false && (
                    <p className="text-sm text-gray-500">
                      OTP sent to <span className="font-medium text-gray-700">{otpSent.phone}</span> on WhatsApp.
                    </p>
                  )}
                  {nameRequired && (
                    <Input
                      label="Your Name"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  )}
                  <Input
                    label="6-digit OTP"
                    placeholder="••••••"
                    value={otp}
                    maxLength={6}
                    className="font-mono tracking-widest text-center text-lg"
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    autoComplete="one-time-code"
                  />
                  <Button type="submit" loading={verifyingOtp} className="w-full" size="lg">
                    Verify & Sign In
                  </Button>
                  <button
                    type="button"
                    className="w-full text-center text-xs text-teal-600 hover:underline"
                    onClick={() => { setOtpSent(null); setOtp(''); setOtpError(''); }}
                  >
                    ← Number badalna hai / dobara OTP bhejein
                  </button>
                </form>
              )}
            </>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-teal-600 font-medium hover:text-teal-700">Create one</Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          CareConnect is not a medical service. For emergencies, call 112.
        </div>
      </div>
    </div>
  );
}
