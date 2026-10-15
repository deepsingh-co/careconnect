import { useState } from 'react';
import {
  Plus, Pill, Trash2, ToggleLeft, ToggleRight, Clock, CheckCircle2,
  AlertCircle, HeartHandshake,
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import {
  Card, Button, Input, Select, Badge, Skeleton, EmptyState, Alert,
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function Reminders() {
  const { user } = useAuth();
  const reminders = useApi('/reminders');
  const history = useApi('/reminders/history?limit=30');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ackBusy, setAckBusy] = useState(false);
  const [form, setForm] = useState({
    medicineName: '',
    instructions: '',
    time1: '08:00',
    time2: '',
    recurrence: 'daily',
    activeDays: days,
    followUpAfterMinutes: 30,
  });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.medicineName.trim()) {
      setError('Medicine name is required.');
      return;
    }
    const schedule = [{ time: form.time1, label: 'Scheduled dose' }];
    if (form.time2) schedule.push({ time: form.time2, label: 'Second dose' });

    setSaving(true);
    try {
      await api.post('/reminders', {
        medicineName: form.medicineName,
        instructions: form.instructions,
        schedule,
        recurrence: form.recurrence,
        activeDays: form.recurrence === 'custom' ? form.activeDays : days,
        followUpAfterMinutes: parseInt(form.followUpAfterMinutes, 10) || 30,
        timezone: 'Asia/Kolkata',
      });
      setSuccess('Reminder created.');
      setShowForm(false);
      setForm({ ...form, medicineName: '', instructions: '', time2: '' });
      reminders.refetch();
      history.refetch();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create reminder.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (r) => {
    try {
      await api.patch(`/reminders/${r._id}`, { isActive: !r.isActive });
      reminders.refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update.');
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete reminder "${r.medicineName}"?`)) return;
    try {
      await api.patch(`/reminders/${r._id}`, { isActive: false });
      setSuccess('Reminder disabled.');
      reminders.refetch();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to disable reminder.');
    }
  };

  const list = reminders.data?.data?.reminders || [];
  const events = history.data?.data?.events || [];
  const pendingEvents = events.filter(
    (e) => !e.acknowledgement && new Date(e.scheduledAt) <= new Date()
  );

  const acknowledge = async (eventId, ack) => {
    setAckBusy(true);
    setError('');
    try {
      await api.post(`/reminders/events/${eventId}/acknowledge`, { acknowledgement: ack });
      setSuccess(
        ack === 'taken' ? 'Recorded as taken.'
        : ack === 'remind_later' ? 'We will follow up later.'
        : 'Your family has been notified that you need help.'
      );
      history.refetch();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record acknowledgement.');
    } finally {
      setAckBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Medicine reminders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Schedules are entered from authorized instructions only. CareConnect does not generate dosages.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant="primary">
          <Plus size={16} className="mr-1" /> {showForm ? 'Close' : 'Add reminder'}
        </Button>
      </div>

      {success && <Alert type="success" className="mt-4">{success}</Alert>}
      {error && <Alert type="error" className="mt-4">{error}</Alert>}

      {/* Pending acknowledgements */}
      {!history.loading && pendingEvents.length > 0 && (
        <Card className="p-5 mt-4 border-teal-200">
          <h2 className="font-semibold text-[#1e3a5f] mb-1">Awaiting your response</h2>
          <p className="text-sm text-gray-500 mb-4">
            These reminders have not been acknowledged yet.
          </p>
          <div className="space-y-3">
            {pendingEvents.map((ev) => (
              <div key={ev._id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {ev.reminder?.medicineName || 'Medicine reminder'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Due {new Date(ev.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} IST
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={ackBusy} onClick={() => acknowledge(ev._id, 'taken')}>
                      <CheckCircle2 size={14} className="mr-1" /> Taken
                    </Button>
                    <Button size="sm" variant="secondary" disabled={ackBusy}
                      onClick={() => acknowledge(ev._id, 'remind_later')}>
                      Remind me later
                    </Button>
                    <Button size="sm" variant="danger" disabled={ackBusy}
                      onClick={() => acknowledge(ev._id, 'need_help')}>
                      <HeartHandshake size={14} className="mr-1" /> Need help
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showForm && (
        <Card className="p-5 mt-4">
          <h2 className="font-semibold text-[#1e3a5f] mb-4">New reminder</h2>
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Medicine name *"
              value={form.medicineName}
              onChange={(e) => setForm({ ...form, medicineName: e.target.value })}
              placeholder="e.g. Metformin 500mg"
              required
            />
            <Select
              label="Recurrence"
              value={form.recurrence}
              onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom days</option>
            </Select>
            <Input
              label="First dose time *"
              type="time"
              value={form.time1}
              onChange={(e) => setForm({ ...form, time1: e.target.value })}
              required
            />
            <Input
              label="Second dose time (optional)"
              type="time"
              value={form.time2}
              onChange={(e) => setForm({ ...form, time2: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Input
                label="Instructions (copy from prescription)"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="e.g. Take after breakfast"
              />
            </div>
            <Input
              label="Follow-up after (minutes)"
              type="number"
              min="5"
              max="240"
              value={form.followUpAfterMinutes}
              onChange={(e) => setForm({ ...form, followUpAfterMinutes: e.target.value })}
            />
            {form.recurrence === 'custom' && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Active days</label>
                <div className="flex flex-wrap gap-2">
                  {days.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          activeDays: form.activeDays.includes(d)
                            ? form.activeDays.filter((x) => x !== d)
                            : [...form.activeDays, d],
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        form.activeDays.includes(d)
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                      }`}
                    >
                      {d.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="sm:col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
              Timezone: Asia/Kolkata (IST). Reminder times are evaluated in IST regardless of the
              viewer's device timezone.
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit" loading={saving}>Create reminder</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="font-semibold text-[#1e3a5f] mb-4">Active schedules</h2>
            {reminders.loading ? (
              <Skeleton className="h-40" />
            ) : list.length === 0 ? (
              <EmptyState
                icon={<Pill size={40} />}
                title="No reminders yet"
                description="Create your first reminder from an authorized prescription schedule."
                action={<Button onClick={() => setShowForm(true)}>Add reminder</Button>}
              />
            ) : (
              <div className="space-y-3">
                {list.map((r) => (
                  <div key={r._id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{r.medicineName}</span>
                          <Badge variant={r.isActive ? 'success' : 'default'}>
                            {r.isActive ? 'Active' : 'Disabled'}
                          </Badge>
                          {r.isDemo && <Badge variant="warning">Demo</Badge>}
                        </div>
                        {r.instructions && (
                          <p className="text-xs text-gray-500 mt-1">{r.instructions}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-600">
                          <Clock size={13} />
                          {r.schedule?.map((s) => (
                            <span key={s.time} className="bg-gray-100 px-2 py-0.5 rounded">
                              {s.label || s.time} — {s.time} IST
                            </span>
                          ))}
                          <span className="bg-gray-100 px-2 py-0.5 rounded uppercase">{r.recurrence}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Follow-up after {r.followUpAfterMinutes} min
                          {r.notifyFamilyAfterMissed ? ' · Family alerted if missed' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggle(r)}
                          title={r.isActive ? 'Disable' : 'Enable'}
                          className="p-2 text-gray-500 hover:text-teal-600 transition-colors"
                        >
                          {r.isActive ? <ToggleRight size={22} className="text-teal-600" /> : <ToggleLeft size={22} />}
                        </button>
                        <button
                          onClick={() => remove(r)}
                          title="Disable reminder"
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* History */}
        <div>
          <Card className="p-5">
            <h2 className="font-semibold text-[#1e3a5f] mb-4">Acknowledgement history</h2>
            {history.loading ? (
              <Skeleton className="h-60" />
            ) : events.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={36} />}
                title="No events yet"
                description="Acknowledgements will appear here as parents respond."
              />
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div key={ev._id} className="border border-gray-100 rounded-lg px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {ev.reminder?.medicineName || 'Reminder'}
                      </div>
                      <Badge
                        variant={
                          ev.acknowledgement === 'taken' ? 'success'
                          : ev.acknowledgement === 'need_help' ? 'danger'
                          : ev.acknowledgement === 'remind_later' ? 'warning'
                          : ev.acknowledgement === 'missed' ? 'danger'
                          : 'default'
                        }
                      >
                        {ev.acknowledgement || 'pending'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                      <span>
                        {new Date(ev.scheduledAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <span className={`capitalize ${ev.deliveryStatus === 'failed' ? 'text-red-600' : ''}`}>
                        {ev.deliveryStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Alert type="warning" className="mt-4">
            <strong>Note:</strong> A missing acknowledgement is never treated as proof of an emergency.
            Follow-up notifications and family alerts are configurable per reminder.
          </Alert>
        </div>
      </div>
    </div>
  );
}
