import { useState } from 'react';
import { Plus, Home, Calendar, MapPin, Clock, X } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import {
  Card, Button, Input, Select, Badge, StatusBadge, Skeleton, EmptyState, Alert,
} from '../../components/ui';

const statusOptions = ['', 'requested', 'accepted', 'in_progress', 'completed', 'cancelled'];
const categoryOptions = [
  'home_cleaning', 'deep_cleaning', 'gardening', 'car_wash',
  'plumbing', 'electrical', 'other_home_service',
];

export default function Bookings() {
  const [filter, setFilter] = useState({ status: '', category: '' });
  const q = `/services/bookings?${filter.status ? `status=${filter.status}&` : ''}${filter.category ? `category=${filter.category}&` : ''}limit=30`;
  const bookings = useApi(q, { deps: [filter.status, filter.category] });
  const categories = useApi('/services/categories');
  const providers = useApi('/services/providers');

  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [draft, setDraft] = useState({
    serviceCategory: 'home_cleaning',
    description: '',
    date: '',
    time: '',
    durationHours: 2,
    serviceType: 'one_time',
    address: '',
    city: '',
    pincode: '',
  });

  const openForm = () => {
    setDraft({
      ...draft,
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    });
    setShowForm(true);
  };

  const toSummary = () => {
    if (!draft.date || !draft.time) {
      setError('Please choose a date and time.');
      return;
    }
    if (!draft.address.trim()) {
      setError('Please enter the service address.');
      return;
    }
    setError('');
    setShowConfirm(true);
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/services/bookings', {
        serviceCategory: draft.serviceCategory,
        description: draft.description,
        scheduledAt: new Date(`${draft.date}T${draft.time}:00+05:30`),
        durationHours: parseFloat(draft.durationHours),
        serviceType: draft.serviceType,
        serviceAddress: {
          line1: draft.address,
          city: draft.city || 'Jaipur',
          pincode: draft.pincode || '',
        },
      });
      setSuccess('Booking requested. Your family has been notified.');
      setShowConfirm(false);
      setShowForm(false);
      setDraft({ ...draft, description: '' });
      bookings.refetch();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking.');
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async (b) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.post(`/services/bookings/${b._id}/cancel`, { reason: 'Cancelled by user.' });
      setSuccess('Booking cancelled.');
      bookings.refetch();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel.');
    }
  };

  const list = bookings.data?.data?.bookings || [];
  const catList = categories.data?.data?.categories || [];
  const provList = providers.data?.data?.providers || [];
  const cancellable = ['requested', 'accepted', 'awaiting_confirmation'];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Household services</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cleaning, gardening, car wash, plumbing and electrical support.
          </p>
        </div>
        <Button onClick={openForm}><Plus size={16} className="mr-1" /> New booking</Button>
      </div>

      {success && <Alert type="success" className="mt-4">{success}</Alert>}
      {error && !showConfirm && <Alert type="error" className="mt-4">{error}</Alert>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mt-5">
        <Select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="w-auto">
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>
          ))}
        </Select>
        <Select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })} className="w-auto">
          <option value="">All categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </Select>
      </div>

      {/* Form */}
      {showForm && !showConfirm && (
        <Card className="p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1e3a5f]">New service request</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Service category *" value={draft.serviceCategory}
              onChange={(e) => setDraft({ ...draft, serviceCategory: e.target.value })}>
              {categoryOptions.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </Select>
            <Select label="Service type" value={draft.serviceType}
              onChange={(e) => setDraft({ ...draft, serviceType: e.target.value })}>
              <option value="one_time">One-time</option>
              <option value="hourly">Hourly</option>
              <option value="recurring">Recurring (weekly)</option>
            </Select>
            <Input label="Date *" type="date" value={draft.date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            <Input label="Time *" type="time" value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
            <Input label="Duration (hours)" type="number" min="0.5" max="12" step="0.5"
              value={draft.durationHours}
              onChange={(e) => setDraft({ ...draft, durationHours: e.target.value })} />
            <Input label="Task description" value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="e.g. Kitchen and bathroom cleaning" />
            <Input label="Service address *" value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              placeholder="House no., street, area" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
              <Input label="Pincode" value={draft.pincode} onChange={(e) => setDraft({ ...draft, pincode: e.target.value })} />
            </div>
          </div>
          {error && <Alert type="error" className="mt-4">{error}</Alert>}
          <div className="mt-5 flex gap-3">
            <Button onClick={toSummary}>Review summary</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Confirmation summary */}
      {showConfirm && (
        <Card className="p-5 mt-4 border-teal-300">
          <h2 className="font-semibold text-[#1e3a5f] mb-3">Confirm your booking</h2>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
            <div><span className="text-gray-500">Service:</span> <strong className="capitalize">{draft.serviceCategory.replace(/_/g, ' ')}</strong></div>
            <div><span className="text-gray-500">When:</span> {new Date(`${draft.date}T${draft.time}`).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })} IST</div>
            <div><span className="text-gray-500">Duration:</span> {draft.durationHours} hours ({draft.serviceType.replace(/_/g, ' ')})</div>
            <div><span className="text-gray-500">Address:</span> {draft.address}, {draft.city} {draft.pincode}</div>
            {draft.description && <div><span className="text-gray-500">Notes:</span> {draft.description}</div>}
          </div>
          <Alert type="warning" className="mt-4">
            This submits a request. A booking is not confirmed until a provider accepts it.
            In demo mode, assignment is simulated with fictional sample providers.
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={submit} loading={saving}>Confirm & submit</Button>
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>Go back</Button>
          </div>
        </Card>
      )}

      {/* Providers */}
      {provList.length > 0 && (
        <Card className="p-5 mt-6">
          <h2 className="font-semibold text-[#1e3a5f] mb-4">Verified providers</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {provList.map((p) => (
              <div key={p._id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm text-gray-800">{p.businessName}</div>
                  <Badge variant="success">Verified</Badge>
                </div>
                <div className="text-xs text-gray-500 mt-2 capitalize">
                  {p.services?.join(' · ').replace(/_/g, ' ')}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Area: {p.serviceArea?.cities?.join(', ') || '—'} · {p.rating}★ ({p.totalReviews} reviews)
                </div>
                {p.isDemo && <Badge variant="warning" className="mt-2">Fictional demo provider</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* List */}
      <Card className="p-5 mt-6">
        <h2 className="font-semibold text-[#1e3a5f] mb-4">Booking history</h2>
        {bookings.loading ? (
          <Skeleton className="h-40" />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Home size={40} />}
            title="No bookings found"
            description={filter.status || filter.category ? 'Try changing your filters.' : 'Create your first household service request.'}
            action={!filter.status && !filter.category ? <Button onClick={openForm}>New booking</Button> : null}
          />
        ) : (
          <div className="space-y-3">
            {list.map((b) => (
              <div key={b._id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 capitalize">
                        {b.serviceCategory.replace(/_/g, ' ')}
                      </span>
                      <StatusBadge status={b.status} />
                      <Badge variant="info">{b.serviceType?.replace(/_/g, ' ')}</Badge>
                      {b.isDemo && <Badge variant="warning">Demo</Badge>}
                    </div>
                    <div className="text-xs text-gray-500 mt-2 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1"><Calendar size={12} />
                        {new Date(b.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <span className="flex items-center gap-1"><MapPin size={12} />
                        {b.serviceAddress?.line1}, {b.serviceAddress?.city}
                      </span>
                      <span className="flex items-center gap-1"><Clock size={12} />{b.durationHours}h</span>
                    </div>
                    {b.description && <div className="text-xs text-gray-500 mt-1">{b.description}</div>}
                    {b.provider?.businessName && (
                      <div className="text-xs text-teal-700 mt-1">Provider: {b.provider.businessName}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {b.estimatedPrice && (
                      <div className="text-sm font-semibold text-[#1e3a5f]">₹{b.estimatedPrice}</div>
                    )}
                    {cancellable.includes(b.status) && (
                      <Button size="sm" variant="secondary" onClick={() => cancelBooking(b)}>Cancel</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
