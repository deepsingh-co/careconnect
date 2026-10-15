import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { Button, Input, Alert } from '../../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const dest =
        user.role === 'admin' ? '/admin'
        : user.role === 'provider' ? '/provider'
        : '/dashboard';
      navigate(location.state?.from?.pathname || dest, { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
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
            <h1 className="text-2xl font-bold text-[#1e3a5f]">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your CareConnect account</p>

            {apiError && <Alert type="error" className="mt-4">{apiError}</Alert>}

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
                required
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={errors.password}
                required
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign in
              </Button>
            </form>

            <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Demo accounts</div>
              <div className="text-xs text-gray-600 space-y-1 font-mono">
                <div>parent@demo.careconnect / Demo@1234</div>
                <div>child@demo.careconnect / Demo@1234</div>
                <div>provider@demo.careconnect / Demo@1234</div>
                <div>admin@demo.careconnect / Demo@1234</div>
              </div>
            </div>

            <p className="mt-6 text-sm text-center text-gray-600">
              New here?{' '}
              <Link to="/auth/register" className="text-[#0d9488] font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
