import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Select, Alert } from '../../components/ui';
import Logo from '../../components/Logo';

const roles = [
  { value: 'parent', label: 'Parent — I need care support' },
  { value: 'child', label: 'Child / Family — I want to care for a parent' },
  { value: 'provider', label: 'Service Provider — I offer household services' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'child' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.phone && !/^\+?[1-9]\d{6,14}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Invalid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ ...form, phone: form.phone || undefined });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Create your account</h1>
          <p className="text-gray-500 mt-1">Join to coordinate care for your family</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8">
          {serverError && <Alert type="error" className="mb-4">{serverError}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Select label="I am a" value={form.role} onChange={set('role')}>
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
            <Input label="Full Name" placeholder="Your name" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
            <Input label="Phone (optional)" type="tel" placeholder="+91XXXXXXXXXX" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
            <Input label="Password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
            <Button type="submit" loading={loading} className="w-full" size="lg">Create Account</Button>
          </form>

          <p className="mt-4 text-xs text-gray-400 text-center">
            By creating an account, you agree to our Terms and Privacy Policy.
          </p>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-teal-600 font-medium hover:text-teal-700">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
