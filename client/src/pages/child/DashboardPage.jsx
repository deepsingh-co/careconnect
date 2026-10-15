import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Card, Badge, StatusBadge, EmptyState, Skeleton, Alert } from '../../components/ui';
import {
  Users, Pill, Home, Car, Utensils, Bell, AlertTriangle,
  Clock, CheckCircle, XCircle, AlertCircle, Plus, ChevronRight,
  Heart, MapPin, MessageSquare, TrendingUp
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast, differenceInMinutes } from 'date-fns';

export default function ChildDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    parent: null,
    bookings: [],
    rides: [],
    foodOrders: [],
    reminders: [],
    remindersHistory: [],
    notifications: [],
    emergencyAlerts: [],
    familyLinks: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [familyRes, parentRes, bookingsRes, ridesRes, foodRes, remindersRes, historyRes, notifRes, alertsRes] = await Promise.allSettled([
        api.get('/family'),
        api.get('/services/categories'), // placeholder - need parent profile endpoint
        api.get('/services/bookings'),
        api.get('/services/rides'),
        api.get('/services/orders'),
        api.get('/reminders'),
        api.get('/reminders/history'),
        api.get('/notifications?unread=true'),
        api.get('/emergency/alerts'),
      ]);

      const familyData = familyRes.status === 'fulfilled' ? familyRes.value.data.data.links : [];
      const parentId = familyData[0]?.parent?._id || familyData[0]?.parent;

      if (parentId) {
        const parentProfileRes = await api.get(`/family`).catch(() => ({ data: { data: { links: [] } } }));
        const parentLink = parentProfileRes.data?.data?.links?.[0];
        if (parentLink?.parent) {
          setData(prev => ({ ...prev, parent: parentLink.parent, familyLinks: familyData }));
        }
      }

      setData(prev => ({
        ...prev,
        bookings: bookingsRes.status === 'fulfilled' ? bookingsRes.value.data.data.bookings : [],
        rides: ridesRes.status === 'fulfilled' ? ridesRes.value.data.data.rides : [],
        foodOrders: foodRes.status === 'fulfilled' ? foodRes.value.data.data.orders : [],
        reminders: remindersRes.status === 'fulfilled' ? remindersRes.value.data.data.reminders : [],
        remindersHistory: historyRes.status === 'fulfilled' ? historyRes.value.data.data.events : [],
        notifications: notifRes.status === 'fulfilled' ? notifRes.value.data.data.notifications : [],
        emergencyAlerts: alertsRes.status === 'fulfilled' ? alertsRes.value.data.data.alerts : [],
      }));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const { parent, bookings, rides, foodOrders, reminders, remindersHistory, notifications, emergencyAlerts } = data;

  const upcomingBookings = bookings
    .filter(b => !['completed', 'cancelled', 'failed'].includes(b.status))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 3);

  const activeReminders = reminders.filter(r => r.isActive);
  const missedReminders = remindersHistory
    .filter(e => e.acknowledgement === 'missed' || (e.acknowledgement === null && isPast(new Date(e.scheduledAt))))
    .slice(0, 3);

  const pendingNotifications = notifications.filter(n => !n.isRead).length;

  const formatTime = (dateStr) => {
    try { return format(parseISO(dateStr), 'HH:mm'); } catch { return ''; }
  };
  const formatDate = (dateStr) => {
    try { return format(parseISO(dateStr), 'MMM d, yyyy'); } catch { return ''; }
  };

  const getRelativeTime = (dateStr) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      return format(date, 'MMM d');
    } catch { return ''; }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Welcome back, {user?.name?.split(' ')[0] || 'Caregiver'}</h1>
          <p className="text-gray-600 mt-1">
            {parent ? `Monitoring {parent.name}` : 'No parent linked yet'}
          </p>
        </div>
        {!parent && (
          <Alert type="warning" className="w-full sm:w-auto flex-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">No parent linked</p>
                <p className="text-sm">Go to <a href="/dashboard/family" className="underline">Family</a> to send an invitation code.</p>
              </div>
            </div>
          </Alert>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
              <Pill className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeReminders.length}</p>
              <p className="text-sm text-gray-500">Active Medications</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Home className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
              <p className="text-sm text-gray-500">Upcoming Services</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Car className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {rides.filter(r => !['completed', 'cancelled'].includes(r.status)).length}
              </p>
              <p className="text-sm text-gray-500">Pending Rides</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingNotifications}</p>
              <p className="text-sm text-gray-500">Unread Alerts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Upcoming & Reminders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Bookings */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Services</h2>
              <a href="/dashboard/bookings" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            {upcomingBookings.length === 0 ? (
              <EmptyState
                icon={<Home className="w-12 h-12" />}
                title="No upcoming services"
                description="Book a cleaning, gardening, or other household service."
                action={<a href="/dashboard/bookings/new"><Button>Book Service</Button></a>}
              />
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div key={booking._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Home className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {booking.serviceCategory.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <span>{getRelativeTime(booking.scheduledAt)}</span>
                        <span>•</span>
                        <span>{formatTime(booking.scheduledAt)}</span>
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Active Reminders */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Medication Reminders</h2>
              <a href="/dashboard/reminders" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
                Manage <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            {activeReminders.length === 0 ? (
              <EmptyState
                icon={<Pill className="w-12 h-12" />}
                title="No active reminders"
                description="Set up medication reminders for your parent."
                action={<a href="/dashboard/reminders/new"><Button>Add Reminder</Button></a>}
              />
            ) : (
              <div className="space-y-3">
                {activeReminders.map((reminder) => (
                  <div key={reminder._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Pill className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{reminder.medicineName}</p>
                        <p className="text-sm text-gray-500">
                          {reminder.schedule.map(s => `${s.time} (${s.label})`).join(', ')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Missed Reminders */}
          {missedReminders.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">Missed Acknowledgements</h2>
              </div>
              <div className="space-y-2">
                {missedReminders.map((event) => (
                  <div key={event._id} className="p-3 bg-white rounded-lg border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{event.reminder?.medicineName || 'Medication'}</p>
                        <p className="text-sm text-gray-500">Scheduled: {formatDate(event.scheduledAt)} at {formatTime(event.scheduledAt)}</p>
                      </div>
                    </div>
                    <Badge variant="warning">Missed</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Notifications & Quick Actions */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
              {pendingNotifications > 0 && (
                <Badge variant="info">{pendingNotifications} unread</Badge>
              )}
            </div>
            {notifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="w-12 h-12" />}
                title="No notifications"
                description="Alerts will appear here."
              />
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif._id}
                    className={`p-3 rounded-lg transition-colors ${!notif.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{notif.body}</p>
                        <p className="text-xs text-gray-400 mt-1">{format(parseISO(notif.createdAt), 'MMM d, HH:mm')}</p>
                      </div>
                      {!notif.isRead && <div className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0 mt-1" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <a href="/dashboard/bookings/new" className="p-4 border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors text-center">
                <Home className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Book Service</p>
                <p className="text-xs text-gray-500">Cleaning, gardening, etc.</p>
              </a>
              <a href="/dashboard/rides/new" className="p-4 border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors text-center">
                <Car className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Book Ride</p>
                <p className="text-xs text-gray-500">Hospital, clinic, etc.</p>
              </a>
              <a href="/dashboard/food/new" className="p-4 border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors text-center">
                <Utensils className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Order Food</p>
                <p className="text-xs text-gray-500">Meals & groceries</p>
              </a>
              <a href="/dashboard/emergency" className="p-4 border border-red-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors text-center">
                <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Emergency</p>
                <p className="text-xs text-gray-500">Send alert to family</p>
              </a>
            </div>
          </Card>

          {/* Emergency Alerts */}
          {emergencyAlerts.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">Active Emergency Alerts</h2>
              </div>
              <div className="space-y-2">
                {emergencyAlerts.filter(a => a.status === 'active').slice(0, 3).map((alert) => (
                  <div key={alert._id} className="p-3 bg-white rounded-lg border border-red-200">
                    <p className="font-medium text-gray-900 text-sm">Emergency alert triggered</p>
                    <p className="text-xs text-gray-500">{format(parseISO(alert.createdAt), 'MMM d, HH:mm')}</p>
                    {alert.message && <p className="text-xs text-gray-600 mt-1">"{alert.message}"</p>}
                    <a href={`/dashboard/emergency/${alert._id}`} className="text-xs text-red-600 hover:underline mt-2 inline-block">View & Acknowledge</a>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}