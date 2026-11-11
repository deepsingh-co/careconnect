import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Input, Badge, Alert, Skeleton } from '../../components/ui';
import Logo from '../../components/Logo';
import api from '../../services/api';
import {
  ShieldCheck,
  Phone,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  UtensilsCrossed,
  Car,
  Wrench,
} from 'lucide-react';

const typeIcons = {
  food: UtensilsCrossed,
  ride: Car,
  home_service: Wrench,
};

function formatAmount(amount, currency = 'INR') {
  if (amount === null || amount === undefined) return null;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  }
}

function formatDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function errorCopy(status, fallback) {
  if (status === 404) {
    return 'This delivery link is not valid. Please ask the family to share a new link.';
  }
  if (status === 410) {
    return 'This delivery link has expired. Please ask the family to share a new link.';
  }
  if (status === 429) {
    return fallback || 'Too many attempts. Please wait a few minutes and try again.';
  }
  return fallback || 'We could not load this delivery. Please try again.';
}

export default function DeliveryHandoffPage() {
  const { token } = useParams();
  const [handoff, setHandoff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [verified, setVerified] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await api.get(`/delivery/handoff/${encodeURIComponent(token)}`);
        if (!cancelled) setHandoff(res.data.data.handoff);
      } catch (err) {
        if (!cancelled) {
          setLoadError({
            status: err.response?.status,
            message: errorCopy(err.response?.status, err.response?.data?.message),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleVerify(event) {
    event.preventDefault();
    if (otp.length !== 4) return;

    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await api.post(
        `/delivery/handoff/${encodeURIComponent(token)}/verify`,
        { otp }
      );
      const result = res.data.data.verification;
      setVerified(result);
      setHandoff((prev) => (prev ? { ...prev, verified: true, verifiedAt: result.verifiedAt } : prev));
    } catch (err) {
      const status = err.response?.status;
      setVerifyError(errorCopy(status, err.response?.data?.message));
      if (status === 400) {
        // Refresh the attempt counter shown under the input.
        try {
          const fresh = await api.get(`/delivery/handoff/${encodeURIComponent(token)}`);
          setHandoff(fresh.data.data.handoff);
        } catch {
          /* non-critical */
        }
      }
    } finally {
      setVerifying(false);
    }
  }

  const isVerified = Boolean(verified || handoff?.verified);
  const TypeIcon = typeIcons[handoff?.type] || Package;
  const amount = formatAmount(handoff?.amount, handoff?.currency);

  return (
    <div className="min-h-screen bg-gradient-to-b from-care-50 via-white to-care-50 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-6 flex items-center justify-center gap-2">
          <Logo size={34} />
          <span className="text-lg font-bold text-care-950">CareConnect</span>
        </header>

        <main>
          {loading ? (
            <Card className="space-y-4 p-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </Card>
          ) : loadError ? (
            <Card className="p-6 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle size={28} aria-hidden="true" />
              </div>
              <h1 className="text-lg font-bold text-care-950">Delivery link unavailable</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-care-600">{loadError.message}</p>
              <p className="mt-4 text-xs text-care-400">
                CareConnect will never ask for your bank details or payment on this page.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="border-b border-care-100 bg-care-900 p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-care-200">
                      Delivery partner handoff
                    </p>
                    <h1 className="mt-1 text-xl font-bold">
                      {handoff.typeLabel || 'Delivery'}
                    </h1>
                  </div>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white">
                    <TypeIcon size={22} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-sm text-care-100">{handoff.summary}</p>
                {amount && <p className="mt-1 text-sm font-semibold text-white">{amount}</p>}
              </div>

              <div className="p-5 sm:p-6">
                {isVerified ? (
                  <div className="py-4 text-center">
                    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <CheckCircle2 size={34} aria-hidden="true" />
                    </div>
                    <h2 className="text-xl font-bold text-care-950">Delivery verified</h2>
                    <p className="mt-1 text-sm text-care-600">
                      OTP confirmed successfully. The family has been informed.
                    </p>
                    {(verified?.verifiedAt || handoff?.verifiedAt) && (
                      <p className="mt-2 text-xs text-care-400">
                        Verified {formatDateTime(verified?.verifiedAt || handoff?.verifiedAt)}
                      </p>
                    )}
                    {handoff?.summary && (
                      <div className="mt-5 rounded-xl bg-care-50 p-3 text-left text-sm text-care-700">
                        <p className="font-semibold text-care-900">{handoff.summary}</p>
                        {handoff.reference && (
                          <p className="mt-1 text-xs text-care-500">Ref: {handoff.reference}</p>
                        )}
                      </div>
                    )}
                    <Badge variant="success" className="mt-4">
                      Completed
                    </Badge>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-xl border border-care-100 bg-care-50/60 p-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-care-600">
                          <Phone size={17} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-care-500">
                            Customer
                          </p>
                          <p className="font-semibold text-care-950">{handoff.parent?.name}</p>
                          {handoff.parent?.phone ? (
                            <a
                              href={`tel:${handoff.parent.phone}`}
                              className="text-sm font-medium text-care-700 underline-offset-2 hover:underline"
                            >
                              {handoff.parent.phone}
                            </a>
                          ) : (
                            <p className="text-sm text-care-500">Phone shared by the family</p>
                          )}
                        </div>
                      </div>

                      <OrderDetails handoff={handoff} />

                      {handoff.partner?.name && (
                        <div className="flex items-start gap-3 rounded-xl border border-care-100 p-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-care-50 text-care-600">
                            <ShieldCheck size={17} aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-care-500">
                              Assigned partner
                            </p>
                            <p className="font-semibold text-care-950">{handoff.partner.name}</p>
                            <p className="text-xs text-care-500">
                              {handoff.partner.role || 'Delivery partner'}
                              {handoff.partner.vehicle ? ` · ${handoff.partner.vehicle}` : ''}
                            </p>
                          </div>
                        </div>
                      )}

                      {handoff.reference && (
                        <p className="text-xs text-care-400">Reference: {handoff.reference}</p>
                      )}
                    </div>

                    <form onSubmit={handleVerify} className="mt-5 border-t border-care-100 pt-5">
                      <div className="mb-2 flex items-center gap-2">
                        <KeyRound size={17} className="text-care-600" aria-hidden="true" />
                        <p className="text-sm font-semibold text-care-900">
                          Enter the 4-digit delivery OTP
                        </p>
                      </div>
                      <p className="mb-3 text-xs text-care-500">
                        Ask the customer for the OTP shown in their CareConnect WhatsApp message.
                        Never share this page link.
                      </p>

                      <Input
                        label="Delivery OTP"
                        value={otp}
                        onChange={(event) =>
                          setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))
                        }
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="••••"
                        maxLength={4}
                        className="text-center text-2xl font-bold tracking-[0.6em]"
                        aria-describedby="otp-help"
                      />
                      <p id="otp-help" className="mt-1.5 text-xs text-care-500">
                        {handoff.attemptsRemaining != null
                          ? `${handoff.attemptsRemaining} attempts remaining before a temporary lock.`
                          : 'Do not ask for any payment or bank details.'}
                      </p>

                      {verifyError && (
                        <Alert type="error" className="mt-3">
                          {verifyError}
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        className="mt-4 w-full"
                        loading={verifying}
                        disabled={otp.length !== 4}
                      >
                        <CheckCircle2 size={18} className="mr-2" aria-hidden="true" />
                        Verify delivery
                      </Button>
                    </form>

                    <p className="mt-4 flex items-start gap-2 text-xs text-care-400">
                      <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                      This is a secure, single-use handoff link. CareConnect will never ask you for
                      a payment, UPI PIN or bank details.
                    </p>
                  </>
                )}
              </div>
            </Card>
          )}
        </main>

        <footer className="mt-6 text-center text-xs text-care-400">
          Need help? Contact the family through the CareConnect app.
        </footer>
      </div>
    </div>
  );
}

function OrderDetails({ handoff }) {
  const order = handoff.order || {};

  if (handoff.type === 'food' && order.items?.length) {
    return (
      <div className="rounded-xl border border-care-100 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-care-500">Order items</p>
        {order.restaurantName && (
          <p className="text-sm font-semibold text-care-950">{order.restaurantName}</p>
        )}
        <ul className="mt-1 space-y-1">
          {order.items.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm text-care-700">
              <span>
                {item.name}
                {item.quantity > 1 ? ` × ${item.quantity}` : ''}
              </span>
              {item.unitPrice != null && (
                <span className="text-care-500">₹{Number(item.unitPrice).toLocaleString('en-IN')}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (handoff.type === 'ride') {
    return (
      <div className="rounded-xl border border-care-100 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-care-500">Trip</p>
        <p className="mt-1 flex items-start gap-2 text-sm text-care-800">
          <MapPin size={15} className="mt-0.5 shrink-0 text-care-500" aria-hidden="true" />
          {order.pickup || 'Home'} → {order.destination || handoff.summary}
        </p>
        {order.scheduledAt && (
          <p className="mt-1 flex items-center gap-2 text-xs text-care-500">
            <Clock size={13} aria-hidden="true" />
            {formatDateTime(order.scheduledAt)}
          </p>
        )}
      </div>
    );
  }

  if (handoff.type === 'home_service') {
    return (
      <div className="rounded-xl border border-care-100 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-care-500">Service</p>
        <p className="mt-1 text-sm font-semibold capitalize text-care-950">
          {(order.category || handoff.summary || '').replace(/_/g, ' ')}
        </p>
        {order.description && <p className="mt-1 text-sm text-care-700">{order.description}</p>}
        {order.scheduledAt && (
          <p className="mt-1 flex items-center gap-2 text-xs text-care-500">
            <Clock size={13} aria-hidden="true" />
            {formatDateTime(order.scheduledAt)}
          </p>
        )}
      </div>
    );
  }

  return null;
}
