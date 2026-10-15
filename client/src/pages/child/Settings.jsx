import { useState } from 'react';
import { Settings as SettingsIcon, User, Languages, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Card, Button, Input, Select, Alert } from '../../components/ui';

const languages = [
  { v: 'en', l: 'English' },
  { v: 'hi', l: 'हिन्दी (Hindi)' },
  { v: 'hinglish', l: 'Hinglish' },
];

const roles = {
  parent: 'Parent account',
  child: 'Family caregiver',
  provider: 'Service provider',
  admin: 'Administrator',
};

export default function Settings() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    preferredLanguage: user?.preferredLanguage || 'en',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name.trim()) return setError('Name is required.');
    if (form.phone && !/^\+?[1-9]\d{6,14}$/.test(form.phone.replace(/\s/g, '')))
      return setError('Enter a valid phone number with country code.');

    setSaving(true);
    try {
      const res = await api.patch('/auth/profile', form);
      const updated = res.data.data.user;
      localStorage.setItem('cc_user', JSON.stringify(updated));
      setSuccess('Profile updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
          <SettingsIcon size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Settings</h1>
          <p className="text-sm text-gray-500">Manage your profile and preferences.</p>
        </div>
      </div>

      {success && <Alert type="success" className="mt-4">{success}</Alert>}
      {error && <Alert type="error" className="mt-4">{error}</Alert>}

      <Card className="p-5 mt-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-14 w-14 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-semibold text-[#1e3a5f]">{user?.name}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
            <div className="text-xs text-gray-400 mt-0.5">Role: {roles[user?.role]}</div>
          </div>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Phone (with country code)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+919876543210"
            />
          </div>
          <Select
            label="Preferred language"
            value={form.preferredLanguage}
            onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
          >
            {languages.map((l) => <option key={l.v} value={l.v}>{l.l}</option>)}
          </Select>

          <Button type="submit" loading={saving}>
            <Save size={16} className="mr-1" /> Save changes
          </Button>
        </form>
      </Card>

      <Card className="p-5 mt-6">
        <h2 className="font-semibold text-[#1e3a5f] mb-3">Account security</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>Passwords are hashed with bcrypt. Sessions expire after 7 days.</p>
          <p className="text-xs text-gray-500">
            Password reset by email is not enabled in this demo build — administrators can reset
            accounts in a production deployment with SMTP configured.
          </p>
        </div>
        <div className="mt-4">
          <Button variant="secondary" onClick={logout}>Sign out of all sessions</Button>
        </div>
      </Card>

      <Card className="p-5 mt-6 bg-gray-50">
        <h2 className="font-semibold text-[#1e3a5f] mb-2 text-sm uppercase tracking-wide">Data & privacy</h2>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
          <li>Only information required for coordination is stored.</li>
          <li>Family access is consent-based and revocable.</li>
          <li>Audit logs record sensitive administrative actions.</li>
          <li>Production deployments must review India's DPDP Act and healthcare regulations.</li>
        </ul>
      </Card>
    </div>
  );
}
