import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, StatusBadge, EmptyState, Button, Skeleton, Alert, Badge } from '../../components/ui';
import api from '../../services/api';
import {
  Pill, Car, UtensilsCrossed, Briefcase, Bell, Calendar,
  ArrowRight, ArrowUpRight, PhoneCall, MessageCircle, Sparkles,
} from 'lucide-react';

const quickActions = [
  { icon: Car, label: 'Book a ride', to: '/rides', tint: 'bg-amber-50 text-amber-700' },
  { icon: UtensilsCrossed, label: 'Order food', to: '/food', tint: 'bg-orange-50 text-orange-700' },
  { icon: Briefcase, label: 'Home service', to: '/bookings', tint: 'bg-care-50 text-care-700' },
  { icon: Pill, label: 'Add reminder', to: '/reminders', tint: 'bg-emerald-50 text-emerald-700' },
];

const activityTones = {
  Service: 'bg-care-50 text-care-700',
  Ride: 'bg-amber-50 text-amber-700',
  Food: 'bg-orange-50 text-orange-700',
};

function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return formatDistanceToNow(date, { addSuffix: true });
}

export default function ChildDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ reminders: [], bookings: [], rides: [], orders: [], family: [], notifications: [] });
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const [reminders, bookings, rides, orders, family, notifs] = await Promise.allSettled([
        api.get('/reminders'),
        api.get('/services/bookings'),
        api.get('/services/rides'),
        api.get('/services/orders'),
        api.get('/family'),
        api.get('/notifications?limit=5'),
      ]);

      const extract = (r, key) => r.status === 'fulfilled' ? (r.value.data.data?.[key] || []) : [];
      setData({
        reminders: extract(reminders, 'reminders'),
        bookings: extract(bookings, 'bookings'),
        rides: extract(rides, 'rides'),
        orders: extract(orders, 'orders'),
        family: extract(family, 'links'),
        notifications: extract(notifs, 'notifications'),
      });

      const unread = notifs.status === 'fulfilled' ? (notifs.value.data.data?.unreadCount || 0) : 0;
      setStats({
        activeReminders: extract(reminders, 'reminders').filter(r => r.isActive).length,
        upcomingBookings: extract(bookings, 'bookings').filter(b => ['requested', 'accepted', 'in_progress'].includes(b.status)).length,
        upcomingRides: extract(rides, 'rides').filter(r => ['requested', 'accepted'].includes(r.status)).length,
        unreadNotifications: unread,
      });
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const statCards = [
    { icon: Pill, label: 'Active reminders', value: stats.activeReminders, to: '/reminders', tone: 'green' },
    { icon: Briefcase, label: 'Upcoming bookings', value: stats.upcomingBookings, to: '/bookings', tone: 'care' },
    { icon: Car, label: 'Upcoming rides', value: stats.upcomingRides, to: '/rides', tone: 'amber' },
    { icon: Bell, label: 'Unread alerts', value: stats.unreadNotifications, to: '/notifications', tone: 'rose' },
  ];

  const parentLink = data.family.find(f => f.status === 'active' && f.parent);

  const recentActivity = [
    ...data.bookings.slice(0, 3).map(b => ({
      id: b._id,
      type: 'Service',
      icon: Briefcase,
      details: b.serviceCategory?.replace(/_/g, ' ') || 'Household service',
      status: b.status,
      date: b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—',
    })),
    ...data.rides.slice(0, 2).map(r => ({
      id: r._id,
      type: 'Ride',
      icon: Car,
      details: `${r.pickup?.address?.split(',')[0] || 'Pickup'} → ${r.destination?.address?.split(',')[0] || 'Destination'}`,
      status: r.status,
      date: r.scheduledAt ? new Date(r.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—',
    })),
    ...data.orders.slice(0, 2).map(o => ({
      id: o._id,
      type: 'Food',
      icon: UtensilsCrossed,
      details: `${o.items?.length || 0} item${o.items?.length === 1 ? '' : 's'} ordered`,
      status: o.status,
      date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—',
    })),
  ].slice(0, 6);

  return (
    <DashboardLayout>
      {error && <Alert type="error" className="mb-5">{error}</Alert>}

      {/* Welcome hero */}
      <section className="dashboard-enter relative overflow-hidden rounded-3xl bg-care-900 shadow-[0_24px_60px_-30px_rgba(8,47,73,0.65)]">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 55% 70% at 92% 10%, rgba(56,189,248,0.32), transparent 60%), radial-gradient(ellipse 45% 60% at 8% 100%, rgba(22,163,74,0.22), transparent 62%)',
          }}
        />
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:p-10">
          <div>
            <p className="text-sm font-semibold text-care-200">{today}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {greeting}, {firstName}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-care-100 sm:text-base">
              Here&apos;s your family&apos;s care snapshot for today. Medicines, appointments and alerts,
              all in one calm place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/rides"
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-care-800 shadow-sm transition-colors hover:bg-care-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-care-900"
              >
                Book a ride <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a
                href="tel:112"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-care-900"
                aria-label="Call emergency services at 112"
              >
                <PhoneCall size={16} aria-hidden="true" /> Emergency 112
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-inset ring-white/15 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-care-200">Parent status</p>
              {parentLink ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-300/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
                  Linked
                </span>
              ) : (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-care-100">Not linked</span>
              )}
            </div>

            {loading ? (
              <div className="mt-4 space-y-3" aria-hidden="true">
                <div className="h-12 w-full animate-pulse rounded-lg bg-white/15" />
                <div className="h-4 w-2/3 animate-pulse rounded-lg bg-white/10" />
              </div>
            ) : parentLink ? (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-lg font-bold text-white">
                    {parentLink.parent?.name?.[0] || '?'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{parentLink.parent?.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-care-200">
                      <MessageCircle size={12} aria-hidden="true" /> WhatsApp connected · consent active
                    </p>
                  </div>
                </div>
                <Link
                  to="/family"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-care-100 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-care-900"
                >
                  Manage family &amp; consent <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-relaxed text-care-100">
                  No parent linked yet. Add your parent with WhatsApp OTP verification, or accept an invitation code.
                </p>
                <Link
                  to="/family"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-care-800 transition-colors hover:bg-care-50"
                >
                  Add parent details <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Care summary */}
      <section
        aria-label="Care summary"
        aria-busy={loading}
        className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4"
      >
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </section>

      {/* Quick actions */}
      <Card className="mt-5 p-5 sm:mt-6 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-care-50 text-care-700">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-care-950">Quick actions</h2>
            <p className="text-sm text-care-500">Everything your family needs, one tap away.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="group flex min-h-[5.25rem] cursor-pointer flex-col items-start justify-center gap-2 rounded-xl border border-care-100 bg-white p-3 transition duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-care-200 hover:bg-care-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-500 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${action.tint}`}>
                <action.icon size={19} aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-care-800">{action.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid items-start gap-5 sm:mt-6 lg:grid-cols-3 lg:gap-6">
        {/* Recent activity */}
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-care-950">Recent bookings &amp; services</h2>
              <p className="mt-0.5 text-sm text-care-500">Latest care requests across your family.</p>
            </div>
            <Link
              to="/bookings"
              className="inline-flex min-h-9 items-center gap-1 rounded-lg text-sm font-semibold text-care-700 transition-colors hover:text-care-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-500 focus-visible:ring-offset-2"
            >
              View all <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-5 space-y-3" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : recentActivity.length ? (
            <ul className="mt-3 divide-y divide-care-50">
              {recentActivity.map((row) => (
                <li key={row.id} className="flex items-center gap-3 py-3.5 first:pt-2 last:pb-0">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${activityTones[row.type]}`}>
                    <row.icon size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold capitalize text-care-900">{row.details}</p>
                    <p className="mt-0.5 text-xs text-care-500">{row.type} · {row.date}</p>
                  </div>
                  <StatusBadge status={row.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Calendar size={26} />}
              title="No bookings yet"
              description="Book a ride, order food, or request a household service."
              action={<Link to="/rides"><Button size="sm">Book a ride</Button></Link>}
            />
          )}
        </Card>

        {/* Recent alerts */}
        <Card className="flex flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-care-950">Recent alerts</h2>
              <p className="mt-0.5 text-sm text-care-500">Updates that may need your attention.</p>
            </div>
            {!loading && (stats.unreadNotifications || 0) > 0 && (
              <Badge variant="danger">{stats.unreadNotifications} new</Badge>
            )}
          </div>

          {loading ? (
            <div className="mt-5 space-y-3" aria-hidden="true">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : data.notifications.length ? (
            <>
              <ul className="mt-3 flex-1 space-y-2">
                {data.notifications.slice(0, 4).map((n) => (
                  <li key={n._id}>
                    <Link
                      to="/notifications"
                      className={`block rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-500 focus-visible:ring-offset-2 ${
                        n.isRead
                          ? 'border-care-100 bg-white hover:bg-care-50/60'
                          : 'border-care-200 bg-care-50/70 hover:bg-care-100/60'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-care-200' : 'bg-care-600'}`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-care-900">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-care-500">{n.body}</p>
                          {n.createdAt && <p className="mt-1.5 text-[11px] font-medium text-care-400">{timeAgo(n.createdAt)}</p>}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/notifications"
                className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-lg text-sm font-semibold text-care-700 transition-colors hover:text-care-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-500 focus-visible:ring-offset-2"
              >
                View all alerts <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </>
          ) : (
            <EmptyState
              icon={<Bell size={26} />}
              title="No alerts yet"
              description="Booking updates and care reminders will show up here."
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
