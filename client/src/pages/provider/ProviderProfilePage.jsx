import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Input, Badge, Alert } from '../../components/ui';
import api from '../../services/api';
import { Settings, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const serviceOptions = [
  { id: 'home_cleaning', label: 'Home Cleaning' },
  { id: 'deep_cleaning', label: 'Deep Cleaning' },
  { id: 'gardening', label: 'Gardening' },
  { id: 'car_wash', label: 'Car Wash' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'other_home_service', label: 'Other' },
];

export default function ProviderProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ businessName: '', services: [], hourlyRate: '', visitRate: '', city: '', pincode: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/provider/profile');
      const p = res.data.data.profile;
      setProfile(p);
      setForm({
        businessName: p.businessName || '',
        services: p.services || [],
        hourlyRate: p.pricing?.hourlyRate || '',
        visitRate: p.pricing?.visitRate || '',
        city: p.serviceArea?.cities?.[0] || '',
        pincode: p.serviceArea?.pincodes?.[0] || '',
      });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  }

  function toggleService(id) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(id) ? prev.services.filter(s => s !== id) : [...prev.services, id],
    }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.patch('/provider/profile', {
        businessName: form.businessName,
        services: form.services,
        pricing: { currency: 'INR', hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined, visitRate: form.visitRate ? Number(form.visitRate) : undefined },
        serviceArea: { cities: form.city ? [form.city] : [], pincodes: form.pincode ? [form.pincode] : [] },
      });
      toast.success('Profile updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  }

  const statusColors = {
    pending_review: 'warning', approved: 'success', suspended: 'danger', rejected: 'danger',
  };

  return (
    <DashboardLayout title="Provider Profile">
      {loading ? (
        <Card className="p-5"><p className="text-gray-500">Loading…</p></Card>
      ) : (
        <>
          <Card className="p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1e3a5f] flex items-center gap-2"><Settings size={18} /> Profile & Services</h3>
              <Badge variant={statusColors[profile?.verificationStatus] || 'default'}>
                {profile?.verificationStatus?.replace(/_/g, ' ') || 'Unknown'}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Business Name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              <Input label="City / Service Area" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
              <div />
              <Input label="Hourly Rate (₹)" type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
              <Input label="Visit Rate (₹)" type="number" value={form.visitRate} onChange={(e) => setForm({ ...form, visitRate: e.target.value })} />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
              <div className="flex flex-wrap gap-2">
                {serviceOptions.map((s) => (
                  <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      form.services.includes(s.id)
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button onClick={save} loading={saving}><Save size={16} className="mr-1" /> Save Profile</Button>
            </div>
          </Card>

          {profile?.verificationStatus !== 'approved' && (
            <Alert type="warning">
              Your account must be approved by an administrator before you receive job assignments.
              {profile?.adminNotes && <span className="mt-1 block">Admin notes: {profile.adminNotes}</span>}
            </Alert>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
