import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Badge, Button, Input, Alert, Skeleton } from '../../components/ui';
import api from '../../services/api';
import {
  MessageCircle,
  QrCode,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Send,
  Copy,
  ShieldCheck,
  Wifi,
  WifiOff,
  Loader2,
  Clock3,
  UtensilsCrossed,
  Car,
  Pill,
  Home,
  Unplug,
  Settings,
} from 'lucide-react';

const STATE_META = {
  open: { label: 'Connected', variant: 'success', icon: Wifi },
  qr: { label: 'Scan QR', variant: 'warning', icon: QrCode },
  connecting: { label: 'Connecting', variant: 'info', icon: Loader2 },
  disconnected: { label: 'Disconnected', variant: 'danger', icon: WifiOff },
  disabled: { label: 'Disabled', variant: 'neutral', icon: WifiOff },
};

const DEMO_MESSAGES = [
  { icon: UtensilsCrossed, label: 'Food order', text: 'khana chahiye' },
  { icon: Car, label: 'Ride', text: 'ride chahiye' },
  { icon: Pill, label: 'Medicine', text: 'dawai chahiye' },
  { icon: Home, label: 'Home service', text: 'ghar par safai karni hai' },
];

function formatWhen(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function SummaryTile({ icon: Icon, label, value, tone = 'care', hint }) {
  const tones = {
    care: 'bg-care-50 text-care-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone] || tones.care}`}>
          <Icon size={19} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-care-950" title={String(value)}>
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-care-400">{label}</p>
      {hint && <p className="mt-1 text-xs text-care-400">{hint}</p>}
    </Card>
  );
}

export default function AdminWhatsAppPage() {
  const [integration, setIntegration] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(null);
  const [testTo, setTestTo] = useState('');
  const [testText, setTestText] = useState(
    'CareConnect test message — WhatsApp connection is working.'
  );
  const [sending, setSending] = useState(false);
  const [lastSend, setLastSend] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    const [integrationsRes, channelRes] = await Promise.allSettled([
      api.get('/admin/integrations'),
      api.get('/admin/whatsapp/channel'),
    ]);

    if (integrationsRes.status === 'fulfilled') {
      setIntegration(integrationsRes.value.data.data?.whatsapp || null);
    }
    if (channelRes.status === 'fulfilled') {
      setChannel(channelRes.value.data.data || null);
    }
    if (integrationsRes.status === 'rejected' && channelRes.status === 'rejected' && !silent) {
      toast.error('Could not load WhatsApp status');
    }

    setLoading(false);
    if (!silent) setRefreshing(false);
  }, []);

  useEffect(() => {
    // State updates land after the awaited API calls; not a synchronous loop.
    // oxlint-disable-next-line react/set-state-in-effect
    load({ silent: true });
  }, [load]);

  const channelState = channel?.state;

  // Poll only while the QR is on screen or the socket is starting up. Once the
  // number is linked we stop, so an idle admin tab does not burn the rate limit.
  useEffect(() => {
    if (!['qr', 'connecting'].includes(channelState)) return undefined;
    const timer = setInterval(() => load({ silent: true }), 3000);
    return () => clearInterval(timer);
  }, [channelState, load]);

  const wa = integration || {};
  const provider = wa.provider || (channel?.enabled ? 'baileys' : null);
  const isBaileys = provider === 'baileys';
  const isOpen = channel?.state === 'open';
  const mode = wa.mode || (isOpen ? 'live' : 'demo');
  const missing = wa.missing || [];
  const configured = wa.configured ?? isOpen;

  const connectionMeta = isBaileys
    ? STATE_META[channel?.state] || STATE_META.disconnected
    : configured
      ? { label: 'Configured', variant: 'success', icon: CheckCircle2 }
      : { label: 'Not configured', variant: 'danger', icon: AlertTriangle };
  const ConnectionIcon = connectionMeta.icon;
  const StateIcon = STATE_META[channel?.state]?.icon || WifiOff;

  async function relink() {
    if (busy) return;
    setBusy('relink');
    try {
      const res = await api.post('/admin/whatsapp/channel/restart');
      setChannel(res.data.data || null);
      toast.success('Naya QR generate ho raha hai — phone se scan karein.');
      await load({ silent: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate a QR code');
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    if (busy) return;
    const confirmed = window.confirm(
      'WhatsApp number unlink karna hai? Iske baad naya QR scan karna padega.'
    );
    if (!confirmed) return;

    setBusy('disconnect');
    try {
      const res = await api.post('/admin/whatsapp/channel/disconnect');
      setChannel(res.data.data || null);
      setLastSend(null);
      toast.success('WhatsApp unlink ho gaya. Naya QR scan karke reconnect karein.');
      await load({ silent: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not disconnect WhatsApp');
    } finally {
      setBusy(null);
    }
  }

  async function sendTest(event) {
    event.preventDefault();
    if (sending) return;

    setSending(true);
    setLastSend(null);
    try {
      const res = await api.post('/admin/whatsapp/channel/send', {
        to: testTo.trim(),
        text: testText.trim(),
      });
      setLastSend({ ok: true, data: res.data.data, notice: res.data.notice || null });
      toast.success(res.data.data?.demo ? 'Demo send simulated' : 'Test message sent');
    } catch (err) {
      setLastSend({
        ok: false,
        error: err.response?.data?.message || 'Test message failed',
      });
      toast.error('Test message failed');
    } finally {
      setSending(false);
    }
  }

  async function copyMessage(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Message copied — parent ke WhatsApp se bhejein.');
    } catch {
      window.prompt('Copy this message', text);
    }
  }

  return (
    <DashboardLayout
      title="WhatsApp connection"
      subtitle="Link a dedicated number, verify the channel and run a demo — all from one place."
    >
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3" aria-busy="true">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      ) : (
        <>
          {mode !== 'live' && (
            <Alert type="demo" className="mb-4">
              <span className="font-semibold">Demo mode:</span> WhatsApp number linked nahi
              hai, isliye outgoing messages simulate honge. QR scan karte hi channel live ho
              jayega.
            </Alert>
          )}

          <section
            aria-label="WhatsApp channel summary"
            className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
          >
            <SummaryTile
              icon={MessageCircle}
              label="Provider"
              value={provider ? provider.toUpperCase() : 'Not configured'}
              tone={provider ? 'green' : 'rose'}
              hint={provider === 'baileys' ? 'WhatsApp Web (QR)' : 'Cloud API / Twilio'}
            />
            <SummaryTile
              icon={mode === 'live' ? Wifi : WifiOff}
              label="Mode"
              value={mode === 'live' ? 'Live' : 'Demo / simulated'}
              tone={mode === 'live' ? 'green' : 'amber'}
            />
            <SummaryTile
              icon={Smartphone}
              label="Linked number"
              value={channel?.phone || 'Not linked'}
              tone={channel?.phone ? 'green' : 'amber'}
              hint={channel?.since ? `Since ${formatWhen(channel.since)}` : undefined}
            />
            <SummaryTile
              icon={ConnectionIcon}
              label="Connection"
              value={connectionMeta.label}
              tone={
                connectionMeta.variant === 'success'
                  ? 'green'
                  : connectionMeta.variant === 'danger'
                    ? 'rose'
                    : 'amber'
              }
            />
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-3 sm:mt-5">
            <div className="space-y-4 lg:col-span-2">
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-care-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-care-50 text-care-700">
                      <QrCode size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-care-950">Connect WhatsApp</h2>
                      <p className="text-sm text-care-500">
                        QR scan se number link karein — koi Meta approval nahi chahiye.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={connectionMeta.variant}>
                      <ConnectionIcon size={12} aria-hidden="true" />
                      {connectionMeta.label}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => load()}
                      loading={refreshing}
                      aria-label="Refresh WhatsApp status"
                    >
                      <RefreshCw size={15} className="mr-1.5" aria-hidden="true" />
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="p-5">
                  {!isBaileys ? (
                    <div className="space-y-3">
                      <Alert type="info">
                        QR linking sirf <b>Baileys</b> provider ke liye hai. Abhi{' '}
                        <b>{provider || 'koi provider'}</b> select hai.
                      </Alert>
                      {missing.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                          <p className="font-semibold">Missing configuration</p>
                          <p className="mt-1 font-mono text-xs">{missing.join(', ')}</p>
                          <p className="mt-1.5 text-xs">
                            `server/.env` me values set karke server restart karein.
                          </p>
                        </div>
                      )}
                      {wa.notice && <p className="text-sm text-care-600">{wa.notice}</p>}
                      <p className="text-sm text-care-500">
                        Meta Cloud API ya Twilio use karne ke liye credentials aur webhook
                        configure karein. Baileys par switch karna ho to{' '}
                        <span className="font-mono text-xs">WHATSAPP_PROVIDER=baileys</span>{' '}
                        set karein.
                      </p>
                      <Link
                        to="/admin/integrations"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-care-700 hover:text-care-900"
                      >
                        <Settings size={15} aria-hidden="true" />
                        All integration settings
                      </Link>
                    </div>
                  ) : isOpen ? (
                    <div>
                      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                          <CheckCircle2 size={32} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-care-950">
                            WhatsApp connected
                          </h3>
                          <p className="mt-0.5 text-sm text-care-600">
                            {channel.phone || 'Number'} se parent ke saare replies jayenge.
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-care-400">
                            <Clock3 size={13} aria-hidden="true" />
                            Connected since {formatWhen(channel.since)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <a
                          href="#whatsapp-test"
                          className="inline-flex min-h-9 items-center justify-center rounded-xl bg-care-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-care-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-500 focus-visible:ring-offset-2"
                        >
                          <Send size={15} className="mr-1.5" aria-hidden="true" />
                          Send test message
                        </a>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={relink}
                          loading={busy === 'relink'}
                        >
                          <RefreshCw size={15} className="mr-1.5" aria-hidden="true" />
                          Re-link number
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={disconnect}
                          loading={busy === 'disconnect'}
                        >
                          <Unplug size={15} className="mr-1.5" aria-hidden="true" />
                          Disconnect
                        </Button>
                      </div>

                      <p className="mt-4 rounded-xl bg-care-50 p-3 text-xs leading-relaxed text-care-600">
                        <ShieldCheck size={14} className="mr-1 inline" aria-hidden="true" />
                        Yeh channel reply-only pattern ke liye best hai — dedicated number
                        use karein, personal number nahi.
                      </p>
                    </div>
                  ) : channel?.qr ? (
                    <div className="grid gap-5 sm:grid-cols-[auto,1fr] sm:items-center">
                      <div className="mx-auto rounded-2xl border border-care-200 bg-white p-2 shadow-sm">
                        <img
                          src={channel.qr}
                          alt="WhatsApp linking QR code — scan with the dedicated phone"
                          className="h-52 w-52 rounded-xl"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-care-950">
                          Scan this QR code
                        </h3>
                        <p className="mt-1 text-sm text-care-600">
                          QR automatically refresh hota hai — page khula rakhein.
                        </p>
                        <ol className="mt-3 space-y-2 text-sm text-care-700">
                          <li className="flex gap-2">
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-care-100 text-[11px] font-bold text-care-700">
                              1
                            </span>
                            Dedicated number wale phone me WhatsApp kholein.
                          </li>
                          <li className="flex gap-2">
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-care-100 text-[11px] font-bold text-care-700">
                              2
                            </span>
                            <span>
                              <b>Settings → Linked devices → Link a device</b> par jayein.
                            </span>
                          </li>
                          <li className="flex gap-2">
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-care-100 text-[11px] font-bold text-care-700">
                              3
                            </span>
                            Yeh QR scan karein — connection apne aap ho jayega.
                          </li>
                        </ol>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={relink}
                            loading={busy === 'relink'}
                          >
                            <RefreshCw size={15} className="mr-1.5" aria-hidden="true" />
                            Naya QR
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => load()}
                            loading={refreshing}
                          >
                            Refresh status
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                        <StateIcon
                          size={30}
                          aria-hidden="true"
                          className={channelState === 'connecting' ? 'animate-spin' : undefined}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-care-950">
                          {channelState === 'connecting'
                            ? 'Connecting to WhatsApp…'
                            : channelState === 'disconnected'
                              ? 'WhatsApp disconnected'
                              : 'WhatsApp number not linked'}
                        </h3>
                        <p className="mt-1 text-sm text-care-600">
                          {channelState === 'connecting'
                            ? 'Saved session mila — connection ban raha hai. QR aa sakta hai.'
                            : 'Naya QR generate karein aur dedicated number se scan karein.'}
                        </p>
                        {channel?.sessionExists && channelState !== 'connecting' && (
                          <p className="mt-1 text-xs text-care-500">
                            Saved session mila hai, lekin socket abhi connected nahi hai.
                          </p>
                        )}
                        {channel?.lastError && (
                          <p className="mt-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                            {channel.lastError}
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" onClick={relink} loading={busy === 'relink'}>
                            <QrCode size={15} className="mr-1.5" aria-hidden="true" />
                            Generate QR
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => load()}
                            loading={refreshing}
                          >
                            Refresh status
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card id="whatsapp-test" className="p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-care-50 text-care-700">
                    <Send size={19} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-care-950">Send a test message</h2>
                    <p className="text-sm text-care-500">
                      Link hone par real WhatsApp jayega; demo mode me simulate hoga.
                    </p>
                  </div>
                </div>

                <form onSubmit={sendTest} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,220px),1fr]">
                  <Input
                    label="Recipient phone"
                    value={testTo}
                    onChange={(event) => setTestTo(event.target.value)}
                    placeholder="+919876543210"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                  />
                  <div className="w-full">
                    <label
                      htmlFor="whatsapp-test-message"
                      className="mb-1.5 block text-sm font-semibold text-care-800"
                    >
                      Message
                    </label>
                    <textarea
                      id="whatsapp-test-message"
                      value={testText}
                      onChange={(event) => setTestText(event.target.value)}
                      rows={2}
                      required
                      className="w-full rounded-xl border border-care-200 bg-white px-3.5 py-2.5 text-base text-care-900 transition-colors placeholder:text-care-400 hover:border-care-300 focus:border-care-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-care-500 sm:text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" loading={sending}>
                      <Send size={16} className="mr-2" aria-hidden="true" />
                      Send test message
                    </Button>
                  </div>
                </form>

                {lastSend?.error && (
                  <Alert type="error" className="mt-3">
                    {lastSend.error}
                  </Alert>
                )}
                {lastSend?.ok && lastSend.data?.demo && (
                  <Alert type="warning" className="mt-3">
                    {lastSend.notice ||
                      'Simulated send — number link nahi hai, isliye WhatsApp par kuch nahi gaya.'}
                  </Alert>
                )}
                {lastSend?.ok && !lastSend.data?.demo && (
                  <Alert type="success" className="mt-3">
                    Message sent{lastSend.data?.messageId ? ` · ID ${lastSend.data.messageId}` : ''}.
                  </Alert>
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-5">
                <h2 className="text-base font-bold text-care-950">Demo checklist</h2>
                <p className="mt-0.5 text-sm text-care-500">
                  Client demo ke liye isi order me chalayein.
                </p>
                <ol className="mt-4 space-y-3">
                  {[
                    {
                      label: 'Provider set to Baileys',
                      detail: 'WHATSAPP_PROVIDER=baileys',
                      done: isBaileys,
                    },
                    {
                      label: 'QR scan with a dedicated number',
                      detail: channel?.phone || 'Not linked yet',
                      done: isOpen,
                    },
                    {
                      label: 'Send a test message',
                      detail: lastSend?.ok ? 'Test send complete' : 'Use the form on the left',
                      done: Boolean(lastSend?.ok),
                    },
                    {
                      label: 'Message from the parent phone',
                      detail: 'Try “khana chahiye”',
                      done: false,
                    },
                  ].map((step, index) => (
                    <li key={step.label} className="flex gap-3">
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          step.done
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-care-50 text-care-500'
                        }`}
                      >
                        {step.done ? (
                          <CheckCircle2 size={15} aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            step.done ? 'text-emerald-700' : 'text-care-900'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="truncate text-xs text-care-400" title={step.detail}>
                          {step.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>

              <Card className="p-5">
                <h2 className="text-base font-bold text-care-950">Try these parent messages</h2>
                <p className="mt-0.5 text-sm text-care-500">
                  Copy karke parent ke WhatsApp se bhejein.
                </p>
                <ul className="mt-3 space-y-2">
                  {DEMO_MESSAGES.map((message) => (
                    <li
                      key={message.text}
                      className="flex items-center gap-2 rounded-xl border border-care-100 bg-care-50/40 p-2.5"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-care-600">
                        <message.icon size={15} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-care-400">
                          {message.label}
                        </p>
                        <p className="truncate text-sm font-medium text-care-800">
                          “{message.text}”
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyMessage(message.text)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-care-500 transition-colors hover:bg-white hover:text-care-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-500"
                        aria-label={`Copy message: ${message.text}`}
                        title="Copy message"
                      >
                        <Copy size={15} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 text-care-800">
                  <ShieldCheck size={18} aria-hidden="true" />
                  <h2 className="text-base font-bold">Safety notes</h2>
                </div>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-care-600">
                  <li>Dedicated number use karein — personal WhatsApp link na karein.</li>
                  <li>Yeh channel sirf parent ke shuru kiye messages ka reply karta hai.</li>
                  <li>QR kisi ke saath share na karein; scan hone ke baad woh expire ho jata hai.</li>
                </ul>
              </Card>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
