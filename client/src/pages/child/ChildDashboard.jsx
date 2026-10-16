import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, StatusBadge, EmptyState, Button, Skeleton, Alert } from '../../components/ui';
import api from '../../services/api';
import {
  Pill, Car, UtensilsCrossed, Briefcase, HeartPulse, Bell,
  Calendar, Users, Activity, ArrowRight, Home, MessageCircle,
} from 'lucide-react';

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
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { icon: Pill, label: 'Active Reminders', value: stats.activeReminders, to: '/reminders', color: 'text-teal-600 bg-teal-50' },
    { icon: Briefcase, label: 'Upcoming Bookings', value: stats.upcomingBookings, to: '/bookings', color: 'text-blue-600 bg-blue-50' },
    { icon: Car, label: 'Upcoming Rides', value: stats.upcomingRides, to: '/rides', color: 'text-amber-600 bg-amber-50' },
    { icon: Bell, label: 'Unread Alerts', value: stats.unreadNotifications, to: '/notifications', color: 'text-red-600 bg-red-50' },
  ];

  const parentLink = data.family.find(f => f.status === 'active' && f.parent);

  return (
    <DashboardLayout title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}`}>
      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1e3a5f]">
                    {loading ? <Skeleton className="h-6 w-8 inline-block" /> : (s.value ?? 0)}
                  </p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-5">
          <h3 className="font-semibold text-[#1e3a5f] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Car, label: 'Book Ride', to: '/rides', color: 'bg-amber-50 text-amber-700' },
              { icon: UtensilsCrossed, label: 'Order Food', to: '/food', color: 'bg-orange-50 text-orange-700' },
              { icon: Briefcase, label: 'Home Service', to: '/bookings', color: 'bg-blue-50 text-blue-700' },
              { icon: Pill, label: 'Reminders', to: '/reminders', color: 'bg-teal-50 text-teal-700' },
            ].map((a) => (
              <Link key={a.label} to={a.to}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${a.color} hover:opacity-80 transition-opacity`}>
                <a.icon size={24} />
                <span className="text-xs font-medium text-center">{a.label}</span>
              </Link>
            ))}
          </div>
        </Card>

        {/* Family Status */}
        <Card className="p-5">
          <h3 className="font-semibold text-[#1e3a5f] mb-4">Family Link</h3>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : parentLink ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
                  {parentLink.parent?.name?.[0] || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{parentLink.parent?.name}</p>
                  <p className="text-xs text-gray-500">Parent • Linked</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <Link to="/family" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
                Manage family & consent <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">No parent linked yet. Add your parent's details with WhatsApp OTP verification, or accept an invitation code.</p>
              <Link to="/family"><Button size="sm">Add Parent Details</Button></Link>
            </div>
          )}
        </Card>

        {/* Recent Notifications */}
        <Card className="p-5">
          <h3 className="font-semibold text-[#1e3a5f] mb-4">Recent Alerts</h3>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : data.notifications.length ? (
            <div className="space-y-2">
              {data.notifications.slice(0, 4).map((n) => (
                <div key={n._id} className={`p-2 rounded-lg text-sm ${n.isRead ? 'bg-gray-50' : 'bg-teal-50'}`}>
                  <p className="font-medium text-gray-800">{n.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{n.body?.slice(0, 60)}…</p>
                </div>
              ))}
              <Link to="/notifications" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1 pt-1">
                View all alerts <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <EmptyState icon={<Bell size={32} />} title="No alerts yet" description="You'll see booking updates and alerts here." />
          )}
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1e3a5f]">Recent Bookings & Services</h3>
          <Link to="/bookings" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : data.bookings.length || data.rides.length || data.orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Details</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ...data.bookings.slice(0, 3).map(b => ({
                    type: 'Service', id: b._id,
                    details: b.serviceCategory?.replace(/_/g, ' ') || '—',
                    status: b.status,
                    date: new Date(b.scheduledAt).toLocaleDateString('en-IN'),
                  })),
                  ...data.rides.slice(0, 2).map(r => ({
                    type: 'Ride', id: r._id,
                    details: `${r.pickup?.address?.slice(0, 20)} → ${r.destination?.address?.slice(0, 20)}`,
                    status: r.status,
                    date: new Date(r.scheduledAt).toLocaleDateString('en-IN'),
                  })),
                  ...data.orders.slice(0, 2).map(o => ({
                    type: 'Food', id: o._id,
                    details: `${o.items?.length || 0} item(s)`,
                    status: o.status,
                    date: new Date(o.createdAt).toLocaleDateString('en-IN'),
                  })),
                ].slice(0, 6).map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5"><Badge variant="info">{row.type}</Badge></td>
                    <td className="py-2.5 text-gray-700">{row.details}</td>
                    <td className="py-2.5"><StatusBadge status={row.status} /></td>
                    <td className="py-2.5 text-gray-500">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Calendar size={32} />}
            title="No bookings yet"
            description="Book a ride, order food, or request a household service."
            action={<Link to="/rides"><Button size="sm">Book a Ride</Button></Link>}
          />
        )}
      </Card>
    </DashboardLayout>
  );
}
