import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Input, Badge, StatusBadge, EmptyState, Skeleton, Alert } from '../../components/ui';
import api from '../../services/api';
import { Car, Plus, MapPin, Navigation, Clock, IndianRupee, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RidesPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ pickup: '', destination: '', date: '', time: '', specialInstructions: '' });
  const [errors, setErrors] = useState({});
  const [quotes, setQuotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quotesLoading, setQuotesLoading] = useState(false);
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

  async function handleReview(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setQuotesLoading(true);
    try {
      const res = await api.get('/services/rides/quotes', {
        params: { pickup: form.pickup, destination: form.destination },
      });
      setQuotes(res.data.data.comparison || []);
      setSelected(null);
      setStep('quotes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch ride prices');
    } finally { setQuotesLoading(false); }
  }

  function handleSelectQuote(q) {
    setSelected(q);
    setStep('confirm');
  }

  async function handleConfirm() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}:00+05:30`);
      await api.post('/services/rides', {
        pickup: { address: form.pickup },
        destination: { address: form.destination },
        scheduledAt,
        specialInstructions: form.specialInstructions,
        providerId: selected.providerId,
        vehicleId: selected.vehicleId,
      });
      toast.success(`Ride requested via ${selected.providerName} (DEMO)!`);
      resetForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit ride request');
    } finally { setSubmitting(false); }
  }

  function resetForm() {
    setShowForm(false);
    setStep('form');
    setSelected(null);
    setQuotes([]);
    setForm({ pickup: '', destination: '', date: '', time: '', specialInstructions: '' });
  }

  return (
    <DashboardLayout title="Ride Booking">
      <Alert type="demo" className="mb-4">
        DEMO MODE: Ola, Uber and Rapido have no public booking API. Prices shown are simulated comparisons and bookings are demo references — no real driver is dispatched.
      </Alert>

      <div className="flex justify-end mb-4">
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} size="sm"><Plus size={16} className="mr-1" /> Book a Ride</Button>
      </div>

      {showForm && (
        <Card className="p-5 mb-6">
          {step === 'form' && (
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
                  <Button type="submit" loading={quotesLoading}>Compare Prices</Button>
                  <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
                </div>
              </form>
            </>
          )}

          {step === 'quotes' && (
            <>
              <h3 className="font-semibold text-[#1e3a5f] mb-1">Compare Ride Prices</h3>
              <p className="text-sm text-gray-500 mb-4">
                {form.pickup} → {form.destination} · DEMO prices (simulated)
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                {quotes.map((q) => (
                  <button
                    key={`${q.providerId}-${q.vehicleId}`}
                    onClick={() => handleSelectQuote(q)}
                    className="text-left border-2 border-gray-200 hover:border-teal-500 rounded-xl p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-[#1e3a5f]">{q.providerName}</span>
                      <Badge variant="warning">DEMO</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{q.vehicleLabel}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 font-bold text-gray-800">
                        <IndianRupee size={14} />{q.price}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock size={14} />~{q.etaMin} min
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep('form')}>Edit Details</Button>
              </div>
            </>
          )}

          {step === 'confirm' && selected && (
            <>
              <h3 className="font-semibold text-[#1e3a5f] mb-4">Confirm Your Ride</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-teal-600" /><span><strong>Pickup:</strong> {form.pickup}</span></div>
                <div className="flex items-center gap-2"><Navigation size={16} className="text-teal-600" /><span><strong>Destination:</strong> {form.destination}</span></div>
                <div className="flex items-center gap-2"><Car size={16} className="text-teal-600" /><span><strong>When:</strong> {form.date} at {form.time}</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-teal-600" /><span><strong>Selected:</strong> {selected.providerName} {selected.vehicleLabel} — ₹{selected.price} (~{selected.etaMin} min)</span></div>
                {form.specialInstructions && <p className="text-gray-500"><strong>Notes:</strong> {form.specialInstructions}</p>}
              </div>
              <Alert type="demo" className="mb-4">This is a simulated booking with a demo reference. No real driver has been assigned.</Alert>
              <div className="flex gap-2">
                <Button onClick={handleConfirm} loading={submitting}>Confirm & Submit</Button>
                <Button variant="secondary" onClick={() => setStep('quotes')}>Change Provider</Button>
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
                  {r.externalProvider && <Badge variant="info" className="capitalize">{r.externalProvider}</Badge>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(r.scheduledAt).toLocaleString('en-IN')}</p>
                {r.estimatedFare != null && <p className="text-xs text-gray-500 mt-0.5">Fare: ₹{r.estimatedFare}{r.demoBookingRef ? ` · Ref: ${r.demoBookingRef}` : ''}</p>}
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
