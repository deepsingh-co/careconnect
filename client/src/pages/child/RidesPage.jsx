import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Input, Badge, StatusBadge, EmptyState, Skeleton, Alert } from '../../components/ui';
import api from '../../services/api';
import { Car, Plus, MapPin, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RidesPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pickup: '', destination: '', date: '', time: '', specialInstructions: '' });
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/services/rides');
      setRides(res.data.data.rides);
    } catch { toast.error('Failed to load rides'); }
    finally { setLoading(false); }
  }

  const validate = () => {
    const e = {};
    if (!form.pickup.trim()) e.pickup = 'Pickup location is required';
    if (!form.destination.trim()) e.destination = 'Destination is required';
    if (!form.date) e.date = 'Date is required';
    if (!form.time) e.time = 'Time is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  function handleReview(ev) {
    ev.preventDefault();
    if (validate()) setConfirming(true);
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}:00+05:30`);
      await api.post('/services/rides', {
        pickup: { address: form.pickup },
        destination: { address: form.destination },
        scheduledAt,
        specialInstructions: form.specialInstructions,
      });
      toast.success('Ride request submitted!');
      setShowForm(false); setConfirming(false);
      setForm({ pickup: '', destination: '', date: '', time: '', specialInstructions: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit ride request');
    } finally { setSubmitting(false); }
  }

  return (
    <DashboardLayout title="Ride Booking">
      <Alert type="demo" className="mb-4">
        DEMO MODE: No live ride provider is configured. Ride requests are routed to an administrator or human operator for manual fulfillment. No real ride has been booked.
      </Alert>

      <div className="flex justify-end mb-4">
        <Button onClick={() => { setConfirming(false); setShowForm(!showForm); }} size="sm"><Plus size={16} className="mr-1" /> Book a Ride</Button>
      </div>

      {showForm && (
        <Card className="p-5 mb-6">
          {!confirming ? (
            <>
              <h3 className="font-semibold text-[#1e3a5f] mb-4">New Ride Request</h3>
              <form onSubmit={handleReview} className="grid sm:grid-cols-2 gap-4">
                <Input label="Pickup Location" placeholder="Home address" value={form.pickup}
                  onChange={(e) => setForm({ ...form, pickup: e.target.value })} error={errors.pickup} />
                <Input label="Destination" placeholder="Hospital, clinic, market…" value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })} error={errors.destination} />
                <Input label="Date" type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} error={errors.date} />
                <Input label="Time" type="time" value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })} error={errors.time} />
                <Input label="Special Instructions" placeholder="e.g. Wheelchair access needed" value={form.specialInstructions}
                  onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })} className="sm:col-span-2" />
                <div className="sm:col-span-2 flex gap-2">
                  <Button type="submit">Review Booking</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-[#1e3a5f] mb-4">Confirm Your Ride</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-teal-600" /><span><strong>Pickup:</strong> {form.pickup}</span></div>
                <div className="flex items-center gap-2"><Navigation size={16} className="text-teal-600" /><span><strong>Destination:</strong> {form.destination}</span></div>
                <div className="flex items-center gap-2"><Car size={16} className="text-teal-600" /><span><strong>When:</strong> {form.date} at {form.time}</span></div>
                {form.specialInstructions && <p className="text-gray-500"><strong>Notes:</strong> {form.specialInstructions}</p>}
              </div>
              <Alert type="demo" className="mb-4">This is a simulated booking. No real driver has been assigned.</Alert>
              <div className="flex gap-2">
                <Button onClick={handleConfirm} loading={submitting}>Confirm & Submit</Button>
                <Button variant="secondary" onClick={() => setConfirming(false)}>Edit</Button>
              </div>
            </>
          )}
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : rides.length ? (
        <div className="space-y-3">
          {rides.map((r) => (
            <Card key={r._id} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                <Car size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800 text-sm">{r.pickup?.address} → {r.destination?.address}</p>
                  <StatusBadge status={r.status} />
                  {r.isDemo && <Badge variant="warning">Demo</Badge>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(r.scheduledAt).toLocaleString('en-IN')}</p>
                {r.specialInstructions && <p className="text-xs text-gray-500 mt-0.5">{r.specialInstructions}</p>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Car size={32} />} title="No rides yet"
          description="Book a ride for medical appointments, market visits or anything else."
          action={<Button onClick={() => setShowForm(true)}>Book a Ride</Button>} />
      )}
    </DashboardLayout>
  );
}
