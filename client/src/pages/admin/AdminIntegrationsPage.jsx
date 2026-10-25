import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Badge, Skeleton, Alert, Toggle } from '../../components/ui';
import api from '../../services/api';
import { Settings, Database, MessageCircle, Brain, MapPin, Car, UtensilsCrossed, Home, Mail } from 'lucide-react';

const integrationMeta = {
  database: { icon: Database, label: 'Database' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp' },
  ai: { icon: Brain, label: 'AI / Intent Detection' },
  maps: { icon: MapPin, label: 'Maps / Geocoding' },
  rideProvider: { icon: Car, label: 'Ride Provider' },
  foodProvider: { icon: UtensilsCrossed, label: 'Food Provider' },
  householdProviders: { icon: Home, label: 'Household Providers' },
  email: { icon: Mail, label: 'Email Notifications' },
};

const statusColor = (status) => {
  if (['connected', 'configured'].includes(status)) return 'success';
  if (['demo_mode', 'fallback_mode', 'manual_fulfillment', 'demo_catalogue', 'demo_data', 'simulated'].includes(status)) return 'warning';
  return 'danger';
};

const setupInstructions = {
  whatsapp: 'Set WHATSAPP_PROVIDER=meta or twilio in server/.env and provide the corresponding credentials. See README.md for full setup.',
  ai: 'Set AI_PROVIDER=openai or google in server/.env and provide API key. Falls back to deterministic mode if unset.',
  maps: 'Set MAPS_PROVIDER=google and GOOGLE_MAPS_API_KEY in server/.env.',
  email: 'Set EMAIL_PROVIDER=smtp and SMTP_* credentials in server/.env.',
};

export default function AdminIntegrationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/integrations')
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function switchMode(mode) {
    if (switching) return;
    setSwitching(true);
    try {
      const res = await api.post('/admin/whatsapp/mode', { mode });
      setData((prev) => ({ ...prev, whatsapp: res.data.data.whatsapp }));
      toast.success(
        mode === 'live'
          ? 'Live mode ON — ab real WhatsApp messages jayenge'
          : 'Demo mode ON — messages sirf simulate honge'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mode switch failed');
    } finally {
      setSwitching(false);
    }
  }

  return (
    <DashboardLayout title="Integration Configuration">
      <Alert type="demo" className="mb-4">
        Integrations without credentials run in DEMO MODE. Simulated features are clearly labelled. No real messages, bookings or dispatches occur in demo mode.
      </Alert>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-40" />)}</div>
      ) : data ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(data).map(([key, val]) => {
            const meta = integrationMeta[key] || { icon: Settings, label: key };
            const Icon = meta.icon;
            return (
              <Card key={key} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1e3a5f]">{meta.label}</h3>
                      {val.provider && <p className="text-xs text-gray-400">Provider: {val.provider}</p>}
                    </div>
                  </div>
                  <Badge variant={statusColor(val.status)}>{val.status?.replace(/_/g, ' ')}</Badge>
                </div>

                {key === 'whatsapp' && (
                  <div className="mb-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1e3a5f]">
                        Mode: {val.mode === 'live' ? 'Live' : 'Demo'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {val.mode === 'live'
                          ? 'Real WhatsApp messages bheje ja rahe hain.'
                          : 'Simulated messages — kuch bhi real WhatsApp par nahi jata.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs ${val.mode !== 'live' ? 'font-semibold text-[#1e3a5f]' : 'text-gray-400'}`}>
                        Demo
                      </span>
                      <Toggle
                        checked={val.mode === 'live'}
                        disabled={switching}
                        aria-label="Switch WhatsApp between demo and live mode"
                        onChange={(next) => switchMode(next ? 'live' : 'demo')}
                      />
                      <span className={`text-xs ${val.mode === 'live' ? 'font-semibold text-teal-600' : 'text-gray-400'}`}>
                        Live
                      </span>
                    </div>
                  </div>
                )}

                {key === 'whatsapp' && val.missing?.length > 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mb-2">
                    Live mode on karne ke liye <span className="font-mono">{val.missing.join(', ')}</span> server/.env
                    mein set karein.
                  </p>
                )}
                {val.notice && (
                  <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-2 mb-2">{val.notice}</p>
                )}
                {setupInstructions[key] && (
                  <p className="text-xs text-gray-500">{setupInstructions[key]}</p>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Alert type="error">Failed to load integration status.</Alert>
      )}
    </DashboardLayout>
  );
}
