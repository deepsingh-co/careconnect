import { useState } from 'react';
import {
  Shield, CheckCircle2, AlertCircle, Database, MessageCircle, Brain,
  MapPin, Car, ShoppingBasket, Bell, Mail, Home,
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import { Card, Badge, Skeleton, Alert, Button } from '../../components/ui';

const statusVariant = (s) => {
  if (['connected', 'configured'].includes(s)) return 'success';
  if (['demo_mode', 'demo_catalogue', 'demo_data', 'fallback_mode', 'manual_fulfillment', 'simulated'].includes(s)) return 'warning';
  return 'danger';
};

const statusLabel = (s) => s.replace(/_/g, ' ');

export default function AdminIntegrations() {
  const health = useApi('/admin/integrations');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [error, setError] = useState('');

  const d = health.data?.data;

  const rows = d ? [
    { icon: Database, name: 'Database (MongoDB)', status: d.database.status, detail: `State: ${d.database.label}` },
    { icon: MessageCircle, name: 'WhatsApp Cloud API', status: d.whatsapp.status, detail: d.whatsapp.notice || `Provider: ${d.whatsapp.provider}` },
    { icon: Brain, name: 'AI intent detection', status: d.ai.status, detail: d.ai.notice || `Provider: ${d.ai.provider}` },
    { icon: MapPin, name: 'Maps / Geocoding', status: d.maps.status, detail: d.maps.provider ? `Provider: ${d.maps.provider}` : 'Not configured' },
    { icon: Car, name: 'Ride provider', status: d.rideProvider.status, detail: d.rideProvider.notice },
    { icon: ShoppingBasket, name: 'Food provider', status: d.foodProvider.status, detail: d.foodProvider.notice },
    { icon: Home, name: 'Household providers', status: d.householdProviders.status, detail: d.householdProviders.notice },
    { icon: Bell, name: 'Notifications', status: d.email.status, detail: d.email.notice || `Email: ${d.email.provider || 'in-app only'}` },
  ] : [];

  // Simulate a WhatsApp webhook to demo the conversation engine end-to-end
  const simulate = async () => {
    setSimulating(true);
    setError('');
    setSimResult(null);
    try {
      const resp = await fetch('/api/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: [{
            changes: [{
              value: {
                messages: [{
                  from: '+919876543210',
                  id: `sim_${Date.now()}`,
                  type: 'text',
                  text: { body: 'Mujhe kal doctor ke liye ride chahiye, 10 baje subah' },
                }],
              },
            }],
          }],
        }),
      });
      const text = await resp.text();
      setSimResult(
        resp.ok
          ? `Webhook accepted (HTTP ${resp.status}). Message processed through the conversation engine${text && text !== 'OK' ? ` — response: ${text}` : ' — reply logged to server console (demo mode).'}`
          : `Webhook rejected with HTTP ${resp.status}.`
      );
    } catch (err) {
      setError(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const simWecompose = async () => {
    setSimulating(true);
    setError('');
    setSimResult(null);
    try {
      const resp = await fetch('/api/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: [{
            changes: [{
              value: {
                messages: [{
                  from: '+919876543210',
                  id: `sim_${Date.now()}`,
                  type: 'text',
                  text: { body: 'HELP' },
                }],
              },
            }],
          }],
        }),
      });
      setSimResult(
        resp.ok
          ? 'Emergency simulation accepted. An emergency alert should now exist for the demo parent (+919876543210) — check the Emergency page.'
          : `Simulation rejected with HTTP ${resp.status}.`
      );
    } catch (err) {
      setError(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
          <Shield size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Integration status</h1>
          <p className="text-sm text-gray-500">
            Live connection state for every external service.
          </p>
        </div>
      </div>

      {health.loading ? (
        <Skeleton className="h-64 mt-6" />
      ) : health.error ? (
        <Alert type="error" className="mt-6">{health.error}</Alert>
      ) : (
        <Card className="p-5 mt-6">
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.name} className="flex flex-wrap items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center shrink-0">
                    <r.icon size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.detail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge>
                  {['demo_mode', 'fallback_mode', 'demo_catalogue', 'demo_data', 'manual_fulfillment', 'simulated'].includes(r.status) && (
                    <span className="text-xs text-amber-700 font-medium">DEMO</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* WhatsApp simulator */}
      <Card className="p-5 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle size={18} className="text-[#0d9488]" />
          <h2 className="font-semibold text-[#1e3a5f]">WhatsApp webhook simulator</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Test the full conversation pipeline — webhook → intent detection → conversation state →
          reply — without a real WhatsApp account. In demo mode the reply is logged server-side,
          not delivered to a phone.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={simulate} loading={simulating} variant="secondary">
            Simulate: "Mujhe kal doctor ke liye ride chahiye, 10 baje subah"
          </Button>
          <Button onClick={simWecompose} loading={simulating} variant="danger">
            Simulate: "HELP" (emergency)
          </Button>
        </div>
        {error && <Alert type="error" className="mt-4">{error}</Alert>}
        {simResult && <Alert type="success" className="mt-4">{simResult}</Alert>}
      </Card>

      {/* Setup instructions */}
      <Card className="p-5 mt-6">
        <h2 className="font-semibold text-[#1e3a5f] mb-3">How to enable real integrations</h2>
        <div className="space-y-4 text-sm text-gray-700">
          <div className="border-l-4 border-teal-500 pl-4">
            <div className="font-medium text-[#1e3a5f]">WhatsApp (Meta Cloud API)</div>
            <ol className="list-decimal list-inside mt-1 space-y-1 text-gray-600 text-sm">
              <li>Create a Meta app at developers.facebook.com and add the WhatsApp product.</li>
              <li>Set <code className="bg-gray-100 px-1 rounded">WHATSAPP_PROVIDER=meta</code>.</li>
              <li>Fill <code className="bg-gray-100 px-1 rounded">META_WHATSAPP_TOKEN</code>, <code className="bg-gray-100 px-1 rounded">META_WHATSAPP_PHONE_NUMBER_ID</code>, <code className="bg-gray-100 px-1 rounded">META_WHATSAPP_APP_SECRET</code>.</li>
              <li>Point the webhook to <code className="bg-gray-100 px-1 rounded">POST /api/webhooks/whatsapp</code> with the verify token.</li>
            </ol>
          </div>
          <div className="border-l-4 border-teal-500 pl-4">
            <div className="font-medium text-[#1e3a5f]">WhatsApp (Twilio alternative)</div>
            <p className="text-gray-600 mt-1">
              Set <code className="bg-gray-100 px-1 rounded">WHATSAPP_PROVIDER=twilio</code> with your
              Twilio Account SID, Auth Token and sandbox number.
            </p>
          </div>
          <div className="border-l-4 border-teal-500 pl-4">
            <div className="font-medium text-[#1e3a5f]">AI intent detection</div>
            <p className="text-gray-600 mt-1">
              Set <code className="bg-gray-100 px-1 rounded">AI_PROVIDER=openai</code> (with{' '}
              <code className="bg-gray-100 px-1 rounded">OPENAI_API_KEY</code>) or{' '}
              <code className="bg-gray-100 px-1 rounded">AI_PROVIDER=google</code>. The deterministic
              fallback engine works without any key.
            </p>
          </div>
          <div className="border-l-4 border-teal-500 pl-4">
            <div className="font-medium text-[#1e3a5f]">Email notifications</div>
            <p className="text-gray-600 mt-1">
              Set <code className="bg-gray-100 px-1 rounded">EMAIL_PROVIDER=smtp</code> plus SMTP
              credentials in <code className="bg-gray-100 px-1 rounded">.env</code>.
            </p>
          </div>
        </div>
        <Alert type="demo" className="mt-5">
          No secrets are ever exposed to the browser. All credentials live in server-side environment
          variables only.
        </Alert>
      </Card>
    </div>
  );
}
