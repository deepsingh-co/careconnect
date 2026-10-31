import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Badge, Skeleton, Alert } from '../../components/ui';
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
  if (['awaiting_setup', 'demo_mode', 'fallback_mode', 'manual_fulfillment', 'demo_catalogue', 'demo_data', 'simulated'].includes(status)) return 'warning';
  return 'danger';
};

const setupInstructions = {
  whatsapp: 'Recommended: WHATSAPP_PROVIDER=baileys + scan the QR on this page with a DEDICATED WhatsApp number (free, no Meta approval). Alternatives: meta/twilio credentials in server/.env. See WHATSAPP_SETUP.md.',
  ai: 'Set AI_PROVIDER=openai or google in server/.env and provide API key. Falls back to deterministic mode if unset.',
  maps: 'Set MAPS_PROVIDER=google and GOOGLE_MAPS_API_KEY in server/.env.',
  email: 'Set EMAIL_PROVIDER=smtp and SMTP_* credentials in server/.env.',
};

export default function AdminIntegrationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState(null);
  const [relinking, setRelinking] = useState(false);

  const waProvider = data?.whatsapp?.provider;
  const channelState = channel?.state;

  useEffect(() => {
    setLoading(true);
    api.get('/admin/integrations')
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Baileys (WhatsApp Web): poll the link state + QR while pairing (WhatsApp
  // refreshes the QR periodically). Once linked we STOP polling — idle 3s
  // polls would otherwise burn the API rate limit for a page left open.
  useEffect(() => {
    if (waProvider !== 'baileys') return undefined;
    let active = true;
    let linked = false;
    let timer = null;

    const load = () => api.get('/admin/whatsapp/channel')
      .then((res) => {
        if (!active) return;
        const next = res.data.data || {};
        setChannel(next);
        if (next.state === 'open' && timer) {
          linked = true;
          clearInterval(timer);
          timer = null;
        }
      })
      .catch(() => {});

    load();
    timer = setInterval(() => { if (!linked) load(); }, 3000);

    return () => { active = false; if (timer) clearInterval(timer); };
  }, [waProvider]);

  async function relinkChannel() {
    if (relinking) return;
    setRelinking(true);
    try {
      const res = await api.post('/admin/whatsapp/channel/restart');
      setChannel(res.data.data);
      toast.success('Naya QR generate ho raha hai — phone se scan kijiye.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Re-link failed');
    } finally {
      setRelinking(false);
    }
  }

  return (
    <DashboardLayout title="Integration Configuration">
      <Alert type="info" className="mb-4">
        WhatsApp live chalta hai — admin ya demo toggle nahi hai. Number link karna zaroori hai.
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

                {key === 'whatsapp' && val.provider === 'baileys' && (
                  <div className="mb-3 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <p className="text-sm font-semibold text-[#1e3a5f]">Link WhatsApp number</p>
                      {channel && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            channelState === 'open' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {channelState === 'open'
                            ? `Linked${channel.phone ? `: ${channel.phone}` : ''}`
                            : channelState || 'starting…'}
                        </span>
                      )}
                    </div>

                    {(!channel || channelState === 'connecting' || channelState === 'disconnected') && (
                      <p className="text-xs text-gray-500 mb-2">
                        {channelState === 'disconnected'
                          ? 'Connection band hai — apne aap reconnect ho raha hai…'
                          : 'WhatsApp Web se connect ho raha hai…'}
                      </p>
                    )}

                    {channelState === 'qr' && channel.qr && (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={channel.qr}
                          alt="WhatsApp linking QR code"
                          className="w-44 h-44 rounded-lg border border-gray-200 bg-white p-1"
                        />
                        <p className="text-xs text-gray-500 text-center leading-relaxed">
                          <b>DEDICATED</b> number ke phone pe WhatsApp kholein →{' '}
                          <b>Linked devices</b> → <b>Link a device</b> → ye QR scan karein.
                        </p>
                      </div>
                    )}

                    {channelState === 'open' && (
                      <p className="text-xs text-teal-700 bg-teal-50 rounded-lg p-2">
                        {channel.phone || 'Number'} linked — parent ke messages ka real reply yahin se jayega.
                      </p>
                    )}

                    {channel?.lastError && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mt-2">{channel.lastError}</p>
                    )}

                    <button
                      type="button"
                      onClick={relinkChannel}
                      disabled={relinking}
                      className="mt-2 text-xs font-semibold text-teal-600 hover:text-teal-700 disabled:opacity-50"
                    >
                      {relinking
                        ? 'Generating…'
                        : channelState === 'qr'
                          ? 'Naya QR generate karein'
                          : 'Re-link / naya QR'}
                    </button>
                  </div>
                )}

                {key === 'whatsapp' && val.missing?.length > 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mb-2">
                    {val.provider === 'baileys' ? (
                      <>
                        WhatsApp number link nahi hai — <span className="font-mono">{val.missing.join(', ')}</span>{' '}
                        (upar wala QR scan karein).
                      </>
                    ) : (
                      <>
                        WhatsApp live karne ke liye <span className="font-mono">{val.missing.join(', ')}</span> server/.env
                        mein set karein.
                      </>
                    )}
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
