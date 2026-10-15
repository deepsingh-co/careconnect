import { useState } from 'react';
import { CalendarCheck, Smile, Meh, Frown, HeartHandshake, CheckCircle2 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import { Card, Button, Badge, Skeleton, EmptyState, Alert } from '../../components/ui';

const moods = [
  { v: 'great', label: 'Great', icon: Smile, tone: 'bg-green-100 text-green-700 border-green-300' },
  { v: 'good', label: 'Good', icon: Smile, tone: 'bg-teal-100 text-teal-700 border-teal-300' },
  { v: 'okay', label: 'Okay', icon: Meh, tone: 'bg-amber-100 text-amber-700 border-amber-300' },
  { v: 'not_well', label: 'Not well', icon: Frown, tone: 'bg-orange-100 text-orange-700 border-orange-300' },
  { v: 'need_help', label: 'Need help', icon: HeartHandshake, tone: 'bg-red-100 text-red-700 border-red-300' },
];

export default function Wellness() {
  const history = useApi('/wellness');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!selected) return setError('Please choose how you are feeling.');
    setError('');
    setSubmitting(true);
    try {
      await api.post('/wellness', { mood: selected, note });
      setSuccess(
        selected === 'need_help'
          ? 'Check-in recorded. Your family has been notified.'
          : 'Check-in recorded. Your family can see your update.'
      );
      setSelected(null);
      setNote('');
      history.refetch();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  const checkins = history.data?.data?.checkins || [];

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <CalendarCheck size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Wellness check-ins</h1>
          <p className="text-sm text-gray-500">
            Daily morning and evening check-ins. CareConnect does not interpret health data.
          </p>
        </div>
      </div>

      {success && <Alert type="success" className="mt-4">{success}</Alert>}
      {error && <Alert type="error" className="mt-4">{error}</Alert>}

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="font-semibold text-[#1e3a5f] mb-1">How are you feeling today?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Select an option. This is a wellbeing log, not a medical assessment.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {moods.map((m) => {
                const active = selected === m.v;
                return (
                  <button
                    key={m.v}
                    onClick={() => setSelected(m.v)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      active ? m.tone + ' shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <m.icon size={26} />
                    <span className="text-xs font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={3}
                placeholder="e.g. Slept well, walked in the garden"
                maxLength={500}
              />
            </div>

            <div className="mt-5">
              <Button onClick={submit} loading={submitting} disabled={!selected}>
                <CheckCircle2 size={16} className="mr-1" /> Submit check-in
              </Button>
            </div>
          </Card>

          <Alert type="info" className="mt-4">
            If you select <strong>Need help</strong>, your linked family members are notified. For
            medical emergencies, call <strong>112</strong> — CareConnect does not dispatch help.
          </Alert>
        </div>

        <div>
          <Card className="p-5">
            <h2 className="font-semibold text-[#1e3a5f] mb-4">Recent check-ins</h2>
            {history.loading ? (
              <Skeleton className="h-48" />
            ) : checkins.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck size={36} />}
                title="No check-ins yet"
                description="Your daily check-in history will appear here."
              />
            ) : (
              <div className="space-y-3">
                {checkins.slice(0, 8).map((c) => {
                  const m = moods.find((x) => x.v === c.mood);
                  return (
                    <div key={c._id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-700 capitalize">{m ? m.label : c.mood}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(c.scheduledAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                      <Badge variant={c.mood === 'need_help' ? 'danger' : c.mood === 'great' || c.mood === 'good' ? 'success' : 'default'}>
                        {c.checkinType}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
