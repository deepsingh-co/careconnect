import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Badge, EmptyState, Skeleton, Alert } from '../../components/ui';
import api from '../../services/api';
import { HeartPulse, AlertTriangle, Phone, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const assistanceTypes = [
  { value: 'medical', label: 'Medical — Feeling unwell, need a doctor' },
  { value: 'fall', label: 'Fall — Need help after a fall' },
  { value: 'fire', label: 'Fire or safety hazard' },
  { value: 'other', label: 'Other assistance needed' },
];

export default function EmergencyPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('medical');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/emergency/alerts');
      setAlerts(res.data.data.alerts);
    } catch { toast.error('Failed to load alerts'); }
    finally { setLoading(false); }
  }

  async function triggerAlert() {
    setSubmitting(true);
    try {
      const res = await api.post('/emergency/alerts', {
        assistanceType: type,
        message,
        triggeredBy: 'dashboard',
      });
      toast.success('Emergency alert sent to family members.');
      setShowForm(false); setMessage('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send alert');
    } finally { setSubmitting(false); }
  }

  async function acknowledgeAlert(id) {
    try {
      await api.patch(`/emergency/alerts/${id}/acknowledge`, { resolution: 'acknowledged', notes: 'Acknowledged by family' });
      toast.success('Alert acknowledged');
      load();
    } catch { toast.error('Failed to acknowledge'); }
  }

  return (
    <DashboardLayout title="Emergency Support">
      <Alert type="error" className="mb-4">
        <strong>Important:</strong> CareConnect notifies family members only. It does NOT dispatch ambulances or emergency services.
        For life-threatening emergencies, call <strong>112</strong> immediately.
      </Alert>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-5 bg-red-50 border-red-200 lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="font-bold text-red-800 text-lg mb-1">Trigger Emergency Alert</h3>
              <p className="text-sm text-red-700 mb-4">
                This will immediately notify all linked family members and emergency contacts.
                Use only when you need urgent help.
              </p>
              {!showForm ? (
                <Button variant="danger" onClick={() => setShowForm(true)}>
                  <HeartPulse size={18} className="mr-2" /> Send Emergency Alert
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-red-800 mb-1">Type of assistance needed</label>
                    <select value={type} onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm bg-white">
                      {assistanceTypes.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-800 mb-1">Message (optional)</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm"
                      placeholder="Describe what's happening…" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="danger" onClick={triggerAlert} loading={submitting}>
                      <HeartPulse size={16} className="mr-2" /> Send Alert Now
                    </Button>
                    <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-[#1e3a5f] mb-3 flex items-center gap-2"><Phone size={18} /> Emergency Numbers</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Ambulance / Police / Fire</span>
              <span className="font-bold text-[#1e3a5f]">112</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Health Helpline</span>
              <span className="font-bold text-[#1e3a5f]">104</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Women Helpline</span>
              <span className="font-bold text-[#1e3a5f]">1091</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2"><Shield size={18} /> Alert History</h3>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : alerts.length ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert._id} className={`p-4 rounded-xl border ${
                alert.status === 'active' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.status === 'active' ? 'danger' : alert.status === 'acknowledged' ? 'success' : 'default'}>
                        {alert.status}
                      </Badge>
                      <span className="text-sm font-medium text-gray-800 capitalize">{alert.assistanceType?.replace(/_/g, ' ')}</span>
                      {alert.triggeredBy === 'whatsapp' && <Badge variant="info">WhatsApp</Badge>}
                    </div>
                    {alert.message && <p className="text-sm text-gray-600 mt-1">"{alert.message}"</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(alert.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  {alert.status === 'active' && (
                    <Button size="sm" onClick={() => acknowledgeAlert(alert._id)}>Acknowledge</Button>
                  )}
                </div>
                {alert.contactsNotified?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    Contacts notified: {alert.contactsNotified.map(c => c.name).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Shield size={32} />} title="No emergency alerts" description="Alert history will appear here." />
        )}
      </Card>
    </DashboardLayout>
  );
}
