import { useState } from 'react';
import { HeartPulse, Phone, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import { Card, Button, Badge, Skeleton, EmptyState, Alert, Select } from '../../components/ui';

const assistanceTypes = [
  { v: 'unknown', l: 'General help needed' },
  { v: 'medical', l: 'Feeling unwell / medical concern' },
  { v: 'fall', l: 'Fall or injury' },
  { v: 'fire', l: 'Fire or safety hazard' },
  { v: 'other', l: 'Other' },
];

export default function Emergency() {
  const alerts = useApi('/emergency/alerts');
  const [type, setType] = useState('unknown');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const send = async () => {
    setError('');
    setSending(true);
    try {
      const res = await api.post('/emergency/alerts', { assistanceType: type, message });
      setResult(res.data);
      alerts.refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send alert.');
    } finally {
      setSending(false);
    }
  };

  const acknowledge = async (a) => {
    try {
      await api.patch(`/emergency/alerts/${a._id}/acknowledge`, { resolution: 'acknowledged' });
      alerts.refetch();
    } catch {
      setError('Failed to acknowledge alert.');
    }
  };

  const list = alerts.data?.data?.alerts || [];

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
          <HeartPulse size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Emergency support</h1>
          <p className="text-sm text-gray-500">
            Notify your family contacts immediately. CareConnect does not dispatch emergency services.
          </p>
        </div>
      </div>

      {/* Critical disclaimer */}
      <div className="mt-5 bg-red-50 border-2 border-red-300 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Phone size={28} className="text-red-600 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-red-800">
                Life-threatening emergency? Call 112 immediately.
              </div>
              <div className="text-xs text-red-700 mt-0.5">
                CareConnect notifies your family members only. It is not an ambulance service and
                does not replace professional medical care.
              </div>
            </div>
          </div>
          <a
            href="tel:112"
            className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors text-lg"
          >
            <Phone size={20} /> Call 112
          </a>
        </div>
      </div>

      {/* Trigger */}
      <Card className="p-5 mt-5">
        <h2 className="font-semibold text-[#1e3a5f] mb-4">Send an alert to family</h2>

        {result ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-green-900">Alert sent to family members</div>
                <p className="text-sm text-green-800 mt-1">{result.message}</p>
                <p className="text-xs text-green-700 mt-2">{result.disclaimer}</p>
                <div className="mt-4 flex gap-3">
                  <Button variant="secondary" size="sm" onClick={() => setResult(null)}>Send another</Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              label="Type of assistance needed"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {assistanceTypes.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </Select>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                maxLength={500}
                placeholder="e.g. I fell in the bathroom, please call me"
              />
            </div>
            {error && <Alert type="error">{error}</Alert>}
            <Button variant="danger" onClick={send} loading={sending} size="lg">
              <AlertTriangle size={18} className="mr-2" /> Send emergency alert to family
            </Button>
            <p className="text-xs text-gray-500">
              This notifies your linked family members and recorded emergency contacts. Status shows
              as queued, delivered or acknowledged. No automatic dispatch occurs.
            </p>
          </div>
        )}
      </Card>

      {/* History */}
      <Card className="p-5 mt-6">
        <h2 className="font-semibold text-[#1e3a5f] mb-4">Alert history</h2>
        {alerts.loading ? (
          <Skeleton className="h-32" />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<HeartPulse size={40} />}
            title="No alerts"
            description="Emergency alerts you or your family trigger will appear here."
          />
        ) : (
          <div className="space-y-3">
            {list.map((a) => (
              <div key={a._id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 capitalize">
                        {assistanceTypes.find((t) => t.v === a.assistanceType)?.l || a.assistanceType}
                      </span>
                      <Badge variant={a.status === 'active' ? 'danger' : a.status === 'acknowledged' ? 'warning' : 'success'}>
                        {a.status}
                      </Badge>
                      <Badge variant="default">via {a.triggeredBy}</Badge>
                    </div>
                    {a.message && <div className="text-sm text-gray-600 mt-1">{a.message}</div>}
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(a.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} IST
                    </div>
                    {a.contactsNotified?.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <Users size={12} className="inline mr-1" />
                        Notified: {a.contactsNotified.map((c) => `${c.name} (${c.status})`).join(', ')}
                      </div>
                    )}
                  </div>
                  {a.status === 'active' && (
                    <Button size="sm" variant="secondary" onClick={() => acknowledge(a)}>
                      Mark resolved
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Alert type="warning" className="mt-4">
        <strong>Safety notice:</strong> CareConnect intentionally does not rely on an AI chatbot as
        an emergency response mechanism, and it does not claim automatic ambulance dispatch.
      </Alert>
    </div>
  );
}
