import { useState } from 'react';
import { Car, Plus, MapPin, Calendar, X, AlertTriangle } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import {
  Card, Button, Input, StatusBadge, Skeleton, EmptyState, Alert, Badge,
} from '../../components/ui';

export default function Rides() {
  const rides = useApi('/services/rides');
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [draft, setDraft] = useState({
    pickup: '', destination: '', date: '', time: '', instructions: '',
  });

  const validate = () => {
    if (!draft.pickup.trim()) return 'Pickup location is required.';
    if (!draft.destination.trim()) return 'Destination is required.';
    if (!draft.date || !draft.time) return 'Date and time are required.';
    return '';
  };

  const review = () => {
    const err = validate();
    if (err) return setError(err);
    setError('');
    setShowConfirm(true);
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/services/rides', {
        pickup: { address: draft.pickup },
        destination: { address: draft.destination },
        scheduledAt: new Date(`${draft.date}T${draft.time}:00+05:30`),
        specialInstructions: draft.instructions,
      });
      setSuccess('Ride request submitted. Your family has been notified.');
      setShowConfirm(false);
      setShowForm(false);
      setDraft({ pickup: '', destination: '', date: '', time: '', instructions: '' });
      rides.refetch();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ride request.');
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  const list = rides.data?.data?.rides || [];
  const cancellable = ['requested', 'accepted', 'awaiting_confirmation', 'draft'];

  const cancel = async (r) => {
    if (!window.confirm('Cancel this ride request?')) return;
    try {
      await api.patch(`/services/rides/${r._id}/cancel`).catch(() => {});
      setSuccess('Ride cancelled.');
      rides.refetch();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to cancel ride.');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Ride requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Transport coordination for appointments and errands.
          </p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setShowConfirm(false); }}>
          <Plus size={16} className="mr-1" /> Request ride
        </Button>
      </div>

      {success && <Alert type="success" className="mt-4">{success}</Alert>}

      <Alert type="demo" className="mt-4">
        <strong>DEMO MODE:</strong> No ride provider API is connected. Submitted requests are routed
        to a human operator for manual fulfillment and are labeled as simulated.
      </Alert>

      {showForm && !showConfirm && (
        <Card className="p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1e3a5f]">New ride request</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Pickup location *" value={draft.pickup}
              onChange={(e) => setDraft({ ...draft, pickup: e.target.value })}
              placeholder="e.g. 12, Shanti Nagar, Jaipur" />
            <Input label="Destination *" value={draft.destination}
              onChange={(e) => setDraft({ ...draft, destination: e.target.value })}
              placeholder="e.g. SMS Hospital, Jaipur" />
            <Input label="Date *" type="date" value={draft.date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            <Input label="Time *" type="time" value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
            <div className="sm:col-span-2">
              <Input label="Special instructions" value={draft.instructions}
                onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
                placeholder="e.g. Wheelchair assistance needed" />
            </div>
          </div>
          {error && <Alert type="error" className="mt-4">{error}</Alert>}
          <div className="mt-5 flex gap-3">
            <Button onClick={review}>Review request</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {showConfirm && (
        <Card className="p-5 mt-4 border-teal-300">
          <h2 className="font-semibold text-[#1e3a5f] mb-3">Confirm your ride request</h2>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
            <div className="flex items-start gap-2"><MapPin size={14} className="mt-1 text-gray-400" />
              <div><span className="text-gray-500">Pickup:</span> {draft.pickup}</div></div>
            <div className="flex items-start gap-2"><MapPin size={14} className="mt-1 text-gray-400" />
              <div><span className="text-gray-500">Destination:</span> {draft.destination}</div></div>
            <div className="flex items-start gap-2"><Calendar size={14} className="mt-1 text-gray-400" />
              <div><span className="text-gray-500">When:</span>{' '}
                {new Date(`${draft.date}T${draft.time}`).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })} IST
              </div></div>
            {draft.instructions && <div><span className="text-gray-500">Notes:</span> {draft.instructions}</div>}
          </div>
          <Alert type="warning" className="mt-4">
            This submits a request — it is not yet a confirmed ride. In demo mode no live driver
            is dispatched; an operator receives it for manual fulfillment.
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={submit} loading={saving}>Submit request</Button>
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>Go back</Button>
          </div>
        </Card>
      )}

      <Card className="p-5 mt-6">
        <h2 className="font-semibold text-[#1e3a5f] mb-4">Your rides</h2>
        {rides.loading ? (
          <Skeleton className="h-40" />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Car size={40} />}
            title="No rides yet"
            description="Request transport for a hospital visit or errand."
            action={<Button onClick={() => setShowForm(true)}>Request ride</Button>}
          />
        ) : (
          <div className="space-y-3">
            {list.map((r) => (
              <div key={r._id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{r.destination.address}</span>
                      <StatusBadge status={r.status} />
                      {r.isDemo && <Badge variant="warning">Simulated</Badge>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">From: {r.pickup.address}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(r.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} IST
                    </div>
                    {r.specialInstructions && (
                      <div className="text-xs text-gray-500 mt-1">Note: {r.specialInstructions}</div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {cancellable.includes(r.status) && (
                      <Button size="sm" variant="secondary" onClick={() => cancel(r)}>Cancel</Button>
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
