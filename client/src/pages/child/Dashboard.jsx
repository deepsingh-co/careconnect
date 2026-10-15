import { Link } from 'react-router-dom';
import {
  Pill, CalendarCheck, Car, ShoppingBasket, Home, Bell, HeartPulse,
  ArrowRight, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import { Card, Badge, StatusBadge, Skeleton, EmptyState, Alert } from '../../components/ui';

function StatCard({ icon: Icon, label, value, sub, to, tone = 'teal' }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-600',
    navy: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <Link
      to={to}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 hover:shadow-sm transition-all group"
    >
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <div className="text-2xl font-bold text-[#1e3a5f]">{value}</div>
      <div className="text-sm text-gray-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      <div className="mt-3 text-xs font-medium text-teal-600 opacity-0 group-hover:opacity-100 flex items-center gap-1">
        View <ArrowRight size={12} />
      </div>
    </Link>
  );
}

export default function ChildDashboard() {
  const { user } = useAuth();

  const bookings = useApi('/services/bookings?limit=5');
  const reminders = useApi('/reminders');
  const rides = useApi('/services/rides');
  const orders = useApi('/services/orders');
  const notifs = useApi('/notifications?limit=8');
  const family = useApi('/family');
  const alerts = useApi('/emergency/alerts');
  const checkins = useApi('/reminders/history?limit=5');

  const loading = bookings.loading || reminders.loading || rides.loading;
  const err = bookings.error || reminders.error;

  const activeReminders = (reminders.data?.data?.reminders || []).filter((r) => r.isActive);
  const upcomingBookings = (bookings.data?.data?.bookings || []).filter(
    (b) => !['completed', 'cancelled', 'failed'].includes(b.status)
  );
  const activeRides = (rides.data?.data?.rides || []).filter(
    (r) => !['completed', 'cancelled', 'failed'].includes(r.status)
  );
  const recentOrders = orders.data?.data?.orders || [];
  const notifications = notifs.data?.data?.notifications || [];
  const links = family.data?.data?.links || [];
  const activeAlerts = (alerts.data?.data?.alerts || []).filter((a) => a.status === 'active');

  const hr = 'my-6 border-t border-gray-200';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">
            Welcome{user ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'parent'
              ? 'Manage your reminders, bookings and requests.'
              : 'Monitor your parent\'s care coordination in real time.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/dashboard/emergency"
            className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            <HeartPulse size={16} /> Emergency
          </Link>
          <Link
            to="/dashboard/reminders"
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <Pill size={16} /> Add reminder
          </Link>
        </div>
      </div>

      {err && <Alert type="error" className="mt-4">{err}</Alert>}
      {activeAlerts.length > 0 && (
        <Alert type="error" className="mt-4">
          <strong>Active emergency alert.</strong> Please contact your family member immediately.
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </>
        ) : (
          <>
            <StatCard icon={Pill} label="Active reminders" value={activeReminders.length}
              sub={activeReminders.length ? 'Scheduled daily' : 'None yet'} to="/dashboard/reminders" />
            <StatCard icon={Home} label="Upcoming services" value={upcomingBookings.length}
              sub="Cleaning, gardening & more" to="/dashboard/bookings" tone="navy" />
            <StatCard icon={Car} label="Ride requests" value={activeRides.length}
              sub={activeRides.length ? 'Awaiting status' : 'No active rides'} to="/dashboard/rides" tone="amber" />
            <StatCard icon={Bell} label="Unread alerts" value={notifs.data?.data?.unreadCount || 0}
              sub="Notifications" to="/dashboard/notifications" tone="green" />
          </>
        )}
      </div>

      <div className={hr} />

      {/* Two column */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming bookings */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1e3a5f]">Upcoming service visits</h2>
              <Link to="/dashboard/bookings" className="text-sm text-teal-600 hover:underline">View all</Link>
            </div>
            {bookings.loading ? (
              <Skeleton className="h-24" />
            ) : upcomingBookings.length === 0 ? (
              <EmptyState
                icon={<Home size={40} />}
                title="No upcoming visits"
                description="Book a cleaning, gardening or other household service."
                action={
                  <Link to="/dashboard/bookings" className="text-teal-600 text-sm font-medium hover:underline">
                    Book a service →
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((b) => (
                  <div key={b._id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-800 capitalize">
                        {b.serviceCategory.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        {new Date(b.scheduledAt).toLocaleString('en-IN', {
                          dateStyle: 'medium', timeStyle: 'short',
                        })}
                        {b.isDemo && <Badge variant="warning" className="ml-2">Demo</Badge>}
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Reminders */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1e3a5f]">Medication reminders</h2>
              <Link to="/dashboard/reminders" className="text-sm text-teal-600 hover:underline">Manage</Link>
            </div>
            {reminders.loading ? (
              <Skeleton className="h-24" />
            ) : activeReminders.length === 0 ? (
              <EmptyState
                icon={<Pill size={40} />}
                title="No active reminders"
                description="Add a schedule from an authorized prescription. CareConnect never suggests dosages."
                action={
                  <Link to="/dashboard/reminders" className="text-teal-600 text-sm font-medium hover:underline">
                    Add reminder →
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {activeReminders.slice(0, 3).map((r) => (
                  <div key={r._id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{r.medicineName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {r.schedule?.map((s) => s.label || s.time).join(' · ')}
                      </div>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Rides */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1e3a5f]">Ride requests</h2>
              <Link to="/dashboard/rides" className="text-sm text-teal-600 hover:underline">View all</Link>
            </div>
            {rides.loading ? (
              <Skeleton className="h-20" />
            ) : activeRides.length === 0 ? (
              <EmptyState
                icon={<Car size={40} />}
                title="No active rides"
                description="Request transport to appointments or errands."
                action={
                  <Link to="/dashboard/rides" className="text-teal-600 text-sm font-medium hover:underline">
                    Request a ride →
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {activeRides.slice(0, 3).map((r) => (
                  <div key={r._id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{r.destination.address}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        From {r.pickup.address} · {new Date(r.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: notifications + family */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1e3a5f]">Notifications</h2>
              <Link to="/dashboard/notifications" className="text-sm text-teal-600 hover:underline">All</Link>
            </div>
            {notifs.loading ? (
              <Skeleton className="h-40" />
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={<Bell size={36} />}
                title="No notifications"
                description="Booking updates and alerts will appear here."
              />
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((n) => (
                  <div key={n._id} className={`border rounded-lg px-3 py-2.5 ${n.isRead ? 'border-gray-100 bg-white' : 'border-teal-100 bg-teal-50/50'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium text-gray-800">{n.title}</div>
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0 mt-1.5" />}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{n.body}</div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1e3a5f]">Family links</h2>
              <Link to="/dashboard/family" className="text-sm text-teal-600 hover:underline">Manage</Link>
            </div>
            {family.loading ? (
              <Skeleton className="h-24" />
            ) : links.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck size={36} />}
                title="No family links yet"
                description="Invite a family member to share care updates."
                action={
                  <Link to="/dashboard/family" className="text-teal-600 text-sm font-medium hover:underline">
                    Send invitation →
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {links.map((l) => {
                  const other = user?.role === 'parent' ? l.child : l.parent;
                  return (
                    <div key={l._id} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-sm font-semibold">
                        {other?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{other?.name}</div>
                        <div className="text-xs text-gray-500 truncate">{other?.email}</div>
                      </div>
                      <Badge variant={l.status === 'active' ? 'success' : 'warning'}>
                        {l.status === 'active' ? 'Linked' : 'Pending'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-5 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <strong>Reminder:</strong> CareConnect does not interpret medical data or act on missed
                acknowledgements as emergencies. Always consult healthcare professionals.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
