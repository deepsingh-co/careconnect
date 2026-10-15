import { useState } from 'react';
import { Home, UserPlus, Car, ShoppingBasket } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import {
  Card, Button, Badge, StatusBadge, Select, Skeleton, EmptyState, Alert,
} from '../../components/ui';

const tabs = [
  { id: 'services', label: 'Service bookings', icon: Home },
  { id: 'rides', label: 'Ride requests', icon: Car },
  { id: 'orders', label: 'Food orders', icon: ShoppingBasket },
];

export default function AdminBookings() {
  const [tab, setTab] = useState('services');
  const [status, setStatus] = useState('');

  const bookings = useApi(
    `/admin/bookings?limit=30${status ? `&status=${status}` : ''}`,
    { deps: [status] }
  );
  const rides = useApi('/admin/rides', { deps: [tab] });
  const orders = useApi('/admin/orders', { deps: [tab] });
  const providers = useApi('/admin/providers?status=approved', { deps: [tab] });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const assign = async (booking) => {
    const provList = providers.data?.data?.providers || [];
    if (provList.length === 0) {
      return setError('No approved providers available. Approve a provider first.');
    }
    const names = provList.map((p, i) => `${i + 1}. ${p.businessName}`).join('\n');
    const choice = window.prompt(`Assign which provider?\n\n${names}\n\nEnter number:`);
    const idx = parseInt(choice, 10) - 1;
    if (isNaN(idx) || !provList[idx]) return;
    setError('');
    try {
      await api.patch(`/admin/bookings/${booking._id}/assign`, { providerId: provList[idx]._id });
      setSuccess(`Assigned to ${provList[idx].businessName}.`);
      bookings.refetch();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed.');
    }
  };

  const list = bookings.data?.data?.bookings || [];
  const rideList = rides.data?.data?.rides || [];
  const orderList = orders.data?.data?.orders || [];

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <Home size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Booking oversight</h1>
          <p className="text-sm text-gray-500">
            Monitor and manually assign bookings across the platform.
          </p>
        </div>
      </div>

      {success && <Alert type="success" className="mt-4">{success}</Alert>}
      {error && <Alert type="error" className="mt-4">{error}</Alert>}

      <div className="flex flex-wrap gap-2 mt-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tab === t.id
                ? 'bg-[#0d9488] text-white border-[#0d9488]'
                : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
        {tab === 'services' && (
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto ml-auto">
            <option value="">All statuses</option>
            {['requested', 'accepted', 'in_progress', 'completed', 'cancelled'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </Select>
        )}
      </div>

      <Card className="p-5 mt-4">
        {tab === 'services' && (
          <>
            <h2 className="font-semibold text-[#1e3a5f] mb-4">Service bookings</h2>
            {bookings.loading ? (
              <Skeleton className="h-48" />
            ) : list.length === 0 ? (
              <EmptyState icon={<Home size={40} />} title="No bookings found" />
            ) : (
              <div className="space-y-3">
                {list.map((b) => (
                  <div key={b._id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 capitalize">
                            {b.serviceCategory.replace(/_/g, ' ')}
                          </span>
                          <StatusBadge status={b.status} />
                          <Badge variant="info">{b.serviceType?.replace(/_/g, ' ')}</Badge>
                          {b.isDemo && <Badge variant="warning">Demo</Badge>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Parent: {b.parent?.name} ({b.parent?.email}) ·{' '}
                          {new Date(b.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Address: {b.serviceAddress?.line1}, {b.serviceAddress?.city} {b.serviceAddress?.pincode}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Provider: {b.provider?.businessName || 'Unassigned'} · Channel: {b.sourceChannel}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {b.status === 'requested' && !b.provider && (
                          <Button size="sm" onClick={() => assign(b)}>
                            <UserPlus size={14} className="mr-1" /> Assign provider
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'rides' && (
          <>
            <h2 className="font-semibold text-[#1e3a5f] mb-4">Ride requests</h2>
            {rides.loading ? (
              <Skeleton className="h-48" />
            ) : rideList.length === 0 ? (
              <EmptyState icon={<Car size={40} />} title="No ride requests" />
            ) : (
              <div className="space-y-3">
                {rideList.map((r) => (
                  <div key={r._id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{r.destination.address}</span>
                          <StatusBadge status={r.status} />
                          {r.isDemo && <Badge variant="warning">Simulated</Badge>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          From {r.pickup.address} · {r.parent?.name} ·{' '}
                          {new Date(r.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                      <Badge variant="default">Manual fulfillment</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'orders' && (
          <>
            <h2 className="font-semibold text-[#1e3a5f] mb-4">Food orders</h2>
            {orders.loading ? (
              <Skeleton className="h-48" />
            ) : orderList.length === 0 ? (
              <EmptyState icon={<ShoppingBasket size={40} />} title="No food orders" />
            ) : (
              <div className="space-y-3">
                {orderList.map((o) => (
                  <div key={o._id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">
                            {o.items?.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                          </span>
                          <StatusBadge status={o.status} />
                          {o.isDemo && <Badge variant="warning">Demo</Badge>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {o.parent?.name} · ₹{o.estimatedTotal} ·{' '}
                          {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      <Alert type="demo" className="mt-4">
        Unassigned bookings can be routed to an approved provider manually. In demo mode provider
        assignment uses fictional sample providers.
      </Alert>
    </div>
  );
}
