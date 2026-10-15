import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { Button, Input, Select, Alert } from '../../components/ui';

const roles = [
  { value: 'child', label: 'Child / Family caregiver — monitor and manage care' },
  { value: 'parent', label: 'Parent — receive reminders and request help' },
  { value: 'provider', label: 'Service provider — receive and complete jobs' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'child', phone: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (form.password.length < 8) e.password = 'At least 8 characters';
    if (form.phone && !/^\+?[1-9]\d{6,14}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid phone number with country code (e.g. +919876543210)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'provider' ? '/provider' : '/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        const mapped = {};
        data.errors.forEach((x) => { mapped[x.field] = x.message; });
        setErrors(mapped);
        setApiError('');
      } else {
        setApiError(data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link to="/"><Logo size="lg" /></Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h1 className="text-2xl font-bold text-[#1e3a5f]">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Start coordinating care for your family</p>

            {apiError && <Alert type="error" className="mt-4">{apiError}</Alert>}

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              <Input
                label="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
                placeholder="Your name"
                required
              />
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
                placeholder="you@example.com"
                required
              />
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={errors.password}
                placeholder="At least 8 characters"
                required
              />
              <Input
                label="Phone (with country code)"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                error={errors.phone}
                placeholder="+919876543210"
              />
              <Select
                label="I am a..."
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                By registering you agree that CareConnect stores only the information needed to
                coordinate care. CareConnect does not provide medical advice or emergency dispatch.
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Create account
              </Button>
            </form>

            <p className="mt-6 text-sm text-center text-gray-600">
              Already registered?{' '}
              <Link to="/auth/login" className="text-[#0d9488] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
