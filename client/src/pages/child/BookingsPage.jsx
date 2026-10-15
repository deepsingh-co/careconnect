import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Input, Select, Badge, StatusBadge, EmptyState, Skeleton, Alert } from '../../components/ui';
import api from '../../services/api';
import { Briefcase, Plus, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const categories = [
  { id: 'home_cleaning', label: 'Home Cleaning' },
  { id: 'deep_cleaning', label: 'Deep Cleaning' },
  { id: 'gardening', label: 'Gardening' },
  { id: 'car_wash', label: 'Car Wash' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'other_home_service', label: 'Other' },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ status: '', category: '' });
  const [form, setForm] = useState({ serviceCategory: 'home_cleaning', description: '', scheduledDate: '', scheduledTime: '', durationHours: '2', serviceType: 'one_time', city: '', pincode: '', line1: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.category) params.set('category', filter.category);
      const res = await api.get(`/services/bookings?${params}`);
      setBookings(res.data.data.bookings);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  }

  const validate = () => {
    const e = {};
    if (!form.scheduledDate) e.scheduledDate = 'Date is required';
    if (!form.scheduledTime) e.scheduledTime = 'Time is required';
    if (!form.line1.trim()) e.line1 = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      const scheduledAt = new Date(`${form.scheduledDate}T${form.scheduledTime}:00+05:30`);
      await api.post('/services/bookings', {
        serviceCategory: form.serviceCategory,
        description: form.description,
        scheduledAt,
        durationHours: parseFloat(form.durationHours),
        serviceType: form.serviceType,
        serviceAddress: { line1: form.line1, city: form.city, pincode: form.pincode },
      });
      toast.success('Booking requested! Your family has been notified.');
      setShowForm(false);
      setForm({ serviceCategory: 'home_cleaning', description: '', scheduledDate: '', scheduledTime: '', durationHours: '2', serviceType: 'one_time', city: '', pincode: '', line1: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    }
  }

  async function cancelBooking(id) {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.post(`/services/bookings/${id}/cancel`, { reason: 'Cancelled from dashboard' });
      toast.success('Booking cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel');
    }
  }

  return (
    <DashboardLayout title="Household Services">
      <Alert type="info" className="mb-4">
        Demo mode: service bookings are simulated. No real provider will be dispatched until a live provider integration is configured.
      </Alert>

      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="w-auto">
          <option value="">All Statuses</option>
          {['requested', 'accepted', 'in_progress', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </Select>
        <Select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })} className="w-auto">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
        <div className="flex-1" />
        <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus size={16} className="mr-1" /> New Booking</Button>
      </div>

      {showForm && (
        <Card className="p-5 mb-6">
          <h3 className="font-semibold text-[#1e3a5f] mb-4">Request a Household Service</h3>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <Select label="Service Category" value={form.serviceCategory} onChange={(e) => setForm({ ...form, serviceCategory: e.target.value })}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
            <Select label="Service Type" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
              <option value="one_time">One Time</option>
              <option value="hourly">Hourly</option>
              <option value="recurring">Recurring (Weekly)</option>
            </Select>
            <Input label="Description" placeholder="What needs to be done?" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2" />
            <Input label="Date" type="date" value={form.scheduledDate}
              onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} error={errors.scheduledDate} />
            <Input label="Time" type="time" value={form.scheduledTime}
              onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} error={errors.scheduledTime} />
            <Input label="Duration (hours)" type="number" min="0.5" max="12" step="0.5" value={form.durationHours}
              onChange={(e) => setForm({ ...form, durationHours: e.target.value })} />
            <Input label="Address" placeholder="House/Street" value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })} error={errors.line1} />
            <Input label="City" placeholder="City" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} error={errors.city} />
            <Input label="Pincode" placeholder="302001" value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit">Submit Request</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : bookings.length ? (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b._id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <Briefcase size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800 capitalize">{b.serviceCategory?.replace(/_/g, ' ')}</p>
                  <StatusBadge status={b.status} />
                  {b.isDemo && <Badge variant="warning">Demo</Badge>}
                </div>
                {b.description && <p className="text-sm text-gray-500 mt-0.5">{b.description}</p>}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(b.scheduledAt).toLocaleString('en-IN')}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {b.serviceAddress?.city}</span>
                  <span>{b.serviceType?.replace(/_/g, ' ')}</span>
                  {b.estimatedPrice && <span className="font-medium text-gray-600">₹{b.estimatedPrice}</span>}
                </div>
              </div>
              <div className="shrink-0">
                {['requested', 'accepted', 'awaiting_confirmation'].includes(b.status) && (
                  <Button variant="danger" size="sm" onClick={() => cancelBooking(b._id)}>Cancel</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Briefcase size={32} />} title="No bookings yet"
          description="Request cleaning, gardening, car wash or other household services."
          action={<Button onClick={() => setShowForm(true)}>New Booking</Button>} />
      )}
    </DashboardLayout>
  );
}
