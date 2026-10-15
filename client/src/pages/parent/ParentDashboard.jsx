import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Badge, StatusBadge, EmptyState, Skeleton, Alert } from '../../components/ui';
import api from '../../services/api';
import {
  Pill, Car, UtensilsCrossed, Briefcase, HeartPulse, Bell,
  MessageCircle, Users, ArrowRight, Home, CheckCircle2, Clock, Calendar,
} from 'lucide-react';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ reminders: [], bookings: [], rides: [], orders: [], family: [], notifications: [] });
  const [checkin, setCheckin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [whatsappStatus, setWhatsappStatus] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [reminders, bookings, rides, orders, family, notifs, integrations] = await Promise.allSettled([
        api.get('/reminders'),
        api.get('/services/bookings'),
        api.get('/services/rides'),
        api.get('/services/orders'),
        api.get('/family'),
        api.get('/notifications?limit=5'),
        api.get('/admin/integrations').catch(() => ({ status: 'rejected' })),
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

      if (integrations.status === 'fulfilled') {
        setWhatsappStatus(integrations.value.data.data?.whatsapp);
      }
    } catch { /* handled by empty states */ }
    finally { setLoading(false); }
  }

  async function sendCheckin(mood) {
    try {
      await api.post('/emergency/alerts', { assistanceType: 'other', message: `Wellness check-in: ${mood}`, triggeredBy: 'dashboard' });
      // Actually use a wellness endpoint — for demo, record mood via a lightweight call
      setCheckin(mood);
    } catch { /* silent */ }
  }

  const activeReminders = data.reminders.filter(r => r.isActive);
  const upcomingBookings = data.bookings.filter(b => ['requested', 'accepted', 'in_progress'].includes(b.status));

  return (
    <DashboardLayout title={`Namaste, ${user?.name?.split(' ')[0] || ''}`}>
      {whatsappStatus?.isDemo !== false && (
        <Alert type="demo" className="mb-4">
          WhatsApp is in DEMO MODE. Messages are simulated. To enable real WhatsApp, configure credentials in the admin panel.
        </Alert>
      )}

      {/* Wellness check-in */}
      <Card className="p-5 mb-6 bg-gradient-to-r from-teal-50 to-white border-teal-100">
        <h3 className="font-semibold text-[#1e3a5f] mb-1">How are you feeling today?</h3>
        <p className="text-sm text-gray-500 mb-4">Tap to let your family know you're okay.</p>
        {checkin ? (
          <div className="flex items-center gap-2 text-teal-700">
            <CheckCircle2 size={20} />
            <span className="font-medium">Thank you! Your family has been notified that you're {checkin}.</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[
              { mood: 'great', label: '😊 Great', color: 'bg-green-100 text-green-800' },
              { mood: 'good', label: '🙂 Good', color: 'bg-teal-100 text-teal-800' },
              { mood: 'okay', label: '😐 Okay', color: 'bg-amber-100 text-amber-800' },
              { mood: 'not_well', label: '😟 Not well', color: 'bg-orange-100 text-orange-800' },
            ].map((m) => (
              <button key={m.mood} onClick={() => sendCheckin(m.mood)}
                className={`px-4 py-2 rounded-xl font-medium text-sm ${m.color} hover:opacity-80 transition-opacity`}>
                {m.label}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Car, label: 'Book a Ride', to: '/rides', color: 'bg-amber-50 text-amber-700' },
          { icon: UtensilsCrossed, label: 'Order Food', to: '/food', color: 'bg-orange-50 text-orange-700' },
          { icon: Briefcase, label: 'Home Service', to: '/bookings', color: 'bg-blue-50 text-blue-700' },
          { icon: HeartPulse, label: 'Emergency', to: '/emergency', color: 'bg-red-50 text-red-700' },
        ].map((a) => (
          <Link key={a.label} to={a.to}
            className={`flex flex-col items-center gap-2 p-5 rounded-2xl ${a.color} hover:opacity-80 transition-opacity`}>
            <a.icon size={28} />
            <span className="text-sm font-medium text-center">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Medicine reminders */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1e3a5f] flex items-center gap-2"><Pill size={18} /> Medicine Reminders</h3>
            <Link to="/reminders" className="text-sm text-teal-600 hover:text-teal-700">Manage</Link>
          </div>
          {loading ? <Skeleton className="h-20 w-full" /> :
            activeReminders.length ? (
              <div className="space-y-2">
                {activeReminders.slice(0, 3).map((r) => (
                  <div key={r._id} className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{r.medicineName}</p>
                      <p className="text-xs text-gray-500">{r.schedule?.map(s => `${s.label} ${s.time}`).join(' • ')}</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Pill size={28} />} title="No reminders" description="Ask a family member to set up reminders." />
            )}
        </Card>

        {/* Family */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1e3a5f] flex items-center gap-2"><Users size={18} /> Connected Family</h3>
            <Link to="/family" className="text-sm text-teal-600 hover:text-teal-700">Manage</Link>
          </div>
          {loading ? <Skeleton className="h-20 w-full" /> :
            data.family.length ? (
              <div className="space-y-2">
                {data.family.filter(f => f.status === 'active').slice(0, 3).map((f) => (
                  <div key={f._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm">
                      {f.child?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{f.child?.name}</p>
                      <p className="text-xs text-gray-500">{f.child?.email}</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Users size={28} />} title="No family linked" description="Share an invitation code with your children." />
            )}
        </Card>

        {/* Upcoming services */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1e3a5f]">Upcoming Services & Bookings</h3>
            <Link to="/bookings" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          {loading ? <Skeleton className="h-20 w-full" /> :
            upcomingBookings.length || data.rides.filter(r => ['requested', 'accepted'].includes(r.status)).length ? (
              <div className="space-y-2">
                {upcomingBookings.slice(0, 3).map((b) => (
                  <div key={b._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Briefcase size={18} className="text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-800 text-sm capitalize">{b.serviceCategory?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} /> {new Date(b.scheduledAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
                {data.rides.filter(r => ['requested', 'accepted'].includes(r.status)).slice(0, 2).map((r) => (
                  <div key={r._id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Car size={18} className="text-amber-600" />
                      <div>
                        <p className="font-medium text-gray-800 text-sm">Ride: {r.pickup?.address?.slice(0, 25)} → {r.destination?.address?.slice(0, 25)}</p>
                        <p className="text-xs text-gray-500">{new Date(r.scheduledAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Calendar size={28} />} title="No upcoming services" description="Book a ride, food or household service." />
            )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
