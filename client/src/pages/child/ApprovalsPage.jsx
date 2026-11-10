import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Badge, EmptyState, Skeleton, Alert } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  UtensilsCrossed,
  Car,
  Wrench,
  ShoppingBasket,
  Pill,
  ShieldCheck,
  Check,
  X,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const typeMeta = {
  food: { label: 'Food order', icon: UtensilsCrossed, tone: 'bg-amber-50 text-amber-700' },
  ride: { label: 'Ride', icon: Car, tone: 'bg-sky-50 text-sky-700' },
  home_service: { label: 'Home service', icon: Wrench, tone: 'bg-violet-50 text-violet-700' },
  grocery: { label: 'Daily items', icon: ShoppingBasket, tone: 'bg-emerald-50 text-emerald-700' },
  medicine: { label: 'Medicines', icon: Pill, tone: 'bg-rose-50 text-rose-700' },
};

const statusMeta = {
  pending: { variant: 'warning', label: 'Pending' },
  processing: { variant: 'info', label: 'Processing' },
  approved: { variant: 'success', label: 'Approved' },
  declined: { variant: 'danger', label: 'Declined' },
  expired: { variant: 'neutral', label: 'Expired' },
  failed: { variant: 'danger', label: 'Failed' },
};

function formatAmount(amount) {
  if (amount === null || amount === undefined) return null;
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function minutesLeft(expiresAt) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 60000);
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('pending');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter === 'all' ? '' : '?status=pending';
      const res = await api.get(`/approvals${params}`);
      setApprovals(res.data.data.approvals);
    } catch {
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function respond(approval, action) {
    const verb = action === 'approve' ? 'approve' : 'decline';
    if (!window.confirm(`Are you sure you want to ${verb} this request?`)) return;

    setBusyId(approval._id);
    try {
      const res = await api.post(`/approvals/${approval._id}/respond`, { action });
      toast.success(
        action === 'approve'
          ? 'Approved — the order is placed and your parent has been notified.'
          : 'Declined — your parent has been informed.'
      );
      setApprovals((prev) =>
        action === 'approve'
          ? prev.map((item) => (item._id === approval._id ? res.data.data.approval : item))
          : prev.filter((item) => item._id !== approval._id)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update this request');
      load();
    } finally {
      setBusyId(null);
    }
  }

  const canDecide = user?.role === 'child';

  return (
    <DashboardLayout
      title="Family approvals"
      subtitle="When your parent asks for something on WhatsApp, approve or decline it here — or reply to the WhatsApp buttons."
    >
      <Alert type="info" className="mb-5">
        Approving places the order and sends your parent the delivery partner's name, phone, ETA and
        the delivery OTP on WhatsApp. Requests expire automatically, so act while they are pending.
      </Alert>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            filter === 'pending' ? 'bg-care-600 text-white' : 'border border-care-200 bg-white text-care-700 hover:bg-care-50'
          }`}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            filter === 'all' ? 'bg-care-600 text-white' : 'border border-care-200 bg-white text-care-700 hover:bg-care-50'
          }`}
        >
          All requests
        </button>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : approvals.length ? (
        <div className="space-y-3">
          {approvals.map((approval) => {
            const meta = typeMeta[approval.type] || typeMeta.food;
            const Icon = meta.icon;
            const status = statusMeta[approval.status] || statusMeta.pending;
            const amount = formatAmount(approval.amount);
            const left = minutesLeft(approval.expiresAt);
            const isPending = approval.status === 'pending';

            return (
              <Card key={approval._id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${meta.tone}`}>
                    <Icon size={21} aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold capitalize text-care-950">{meta.label}</p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <span className="rounded-md bg-care-50 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-care-700">
                        {approval.code}
                      </span>
                      {amount && <span className="text-sm font-semibold text-care-700">{amount}</span>}
                    </div>

                    <p className="mt-1 text-sm text-care-700">{approval.summary}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-care-500">
                      {approval.parent?.name && <span>Parent: {approval.parent.name}</span>}
                      <span>{new Date(approval.createdAt).toLocaleString('en-IN')}</span>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                          <Clock size={12} /> {left} min left
                        </span>
                      )}
                      {approval.respondedBy?.name && <span>Handled by {approval.respondedBy.name}</span>}
                    </div>

                    {approval.status === 'approved' && approval.deliveryPartner?.name && (
                      <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-sm text-emerald-900">
                        <p className="font-semibold">
                          {approval.deliveryPartner.role || 'Delivery partner'}: {approval.deliveryPartner.name}
                        </p>
                        <p className="mt-0.5 text-xs text-emerald-700">
                          {approval.deliveryPartner.phone || 'Phone shared on WhatsApp'}
                          {approval.deliveryPartner.etaMinutes ? ` · ETA ${approval.deliveryPartner.etaMinutes} min` : ''}
                          {approval.resultRef ? ` · Ref ${approval.resultRef}` : ''}
                        </p>
                      </div>
                    )}

                    {approval.status === 'declined' && approval.declineReason && (
                      <p className="mt-2 text-xs text-rose-600">Reason: {approval.declineReason}</p>
                    )}
                  </div>

                  {isPending && canDecide && (
                    <div className="flex shrink-0 gap-2 sm:flex-col">
                      <Button
                        size="sm"
                        variant="success"
                        loading={busyId === approval._id}
                        onClick={() => respond(approval, 'approve')}
                      >
                        <Check size={16} className="mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === approval._id}
                        onClick={() => respond(approval, 'decline')}
                      >
                        <X size={16} className="mr-1" /> Decline
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<ShieldCheck size={32} />}
          title={filter === 'pending' ? 'No pending approvals' : 'No approval requests yet'}
          description={
            filter === 'pending'
              ? 'When your parent asks for food, a ride, medicines or a service on WhatsApp, the request will appear here.'
              : 'Approved, declined and expired requests will be listed here for your records.'
          }
        />
      )}
    </DashboardLayout>
  );
}
