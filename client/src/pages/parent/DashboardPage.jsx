import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Card, Badge, StatusBadge, EmptyState, Button, Alert } from '../../components/ui';
import {
  Pill, Heart, Home, Car, Utensils, AlertTriangle, Bell,
  CheckCircle, XCircle, Clock, MapPin, MessageSquare,
  Loader2, Plus
} from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';

export default function ParentDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    reminders: [],
    bookings: [],
    rides: [],
    foodOrders: [],
    notifications: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [remindersRes, bookingsRes, ridesRes, foodRes, notifRes] = await Promise.allSettled([
        api.get('/reminders'),
        api.get('/services/bookings'),
        api.get('/services/rides'),
        api.get('/services/orders'),
        api.get('/notifications?unread=true'),
      ]);
      setData({
        reminders: remindersRes.status === 'fulfilled' ? remindersRes.value.data.data.reminders : [],
        bookings: bookingsRes.status === 'fulfilled' ? bookingsRes.value.data.data.bookings : [],
        rides: ridesRes.status === 'fulfilled' ? ridesRes.value.data.data.rides : [],
        foodOrders: foodRes.status === 'fulfilled' ? foodRes.value.data.data.orders : [],
        notifications: notifRes.status === 'fulfilled' ? notifRes.value.data.data.notifications : [],
      });
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 animate-pulse bg-gray-200 rounded" />
            <div className="h-4 w-64 animate-pulse bg-gray-200 rounded mt-2" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const { reminders, bookings, rides, foodOrders, notifications } = data;
  const activeReminders = reminders.filter(r => r.isActive);
  const upcomingBookings = bookings.filter(b => !['completed', 'cancelled', 'failed'].includes(b.status)).slice(0, 3);
  const pendingRides = rides.filter(r => !['completed', 'cancelled', 'failed'].includes(r.status)).slice(0, 3);
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Hello, {user?.name?.split(' ')[0] || 'there'}</h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your care coordination.</p>
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
              <p className="text-2xl font-bold text-gray-900">{pendingRides.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{unreadNotifs}</p>
              <p className="text-sm text-gray-500">Unread Alerts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Medications */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Medications</h2>
            {activeReminders.length === 0 ? (
              <EmptyState
                icon={<Pill className="w-12 h-12" />}
                title="No active reminders"
                description="Your family can set up medication reminders for you."
              />
            ) : (
              <div className="space-y-3">
                {activeReminders.map(reminder => (
                  <div key={reminder._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                          <Pill className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{reminder.medicineName}</h3>
                          <p className="text-sm text-gray-500">
                            {reminder.schedule.map(s => `${s.time} ${s.label ? `(${s.label})` : ''}`).join(' • ')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                    {reminder.instructions && (
                      <p className="text-sm text-gray-600 mt-2 ml-15">{reminder.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Services */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Services</h2>
            {upcomingBookings.length === 0 ? (
              <EmptyState
                icon={<Home className="w-12 h-12" />}
                title="No upcoming services"
                description="Your family can book services for you."
              />
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map(booking => (
                  <div key={booking._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <Home className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {booking.serviceCategory.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(booking.scheduledAt), 'MMM d, yyyy')} at {format(parseISO(booking.scheduledAt), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Rides */}
          {pendingRides.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Rides</h2>
              <div className="space-y-3">
                {pendingRides.map(ride => (
                  <div key={ride._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                          <Car className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Ride to {ride.destination?.address}</h3>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(ride.scheduledAt), 'MMM d, yyyy HH:mm')} • From: {ride.pickup?.address}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={ride.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="secondary" className="w-full justify-start" onClick={() => {}}>
                <Pill className="w-4 h-4 mr-2" /> View Medications
              </Button>
              <Button variant="secondary" className="w-full justify-start" onClick={() => {}}>
                <Heart className="w-4 h-4 mr-2" /> Wellness Check-in
              </Button>
              <Button variant="secondary" className="w-full justify-start" onClick={() => {}}>
                <Car className="w-4 h-4 mr-2" /> Request Ride
              </Button>
              <Button variant="secondary" className="w-full justify-start" onClick={() => {}}>
                <Utensils className="w-4 h-4 mr-2" /> Order Food
              </Button>
              <Button variant="danger" className="w-full justify-start" onClick={() => {}}>
                <AlertTriangle className="w-4 h-4 mr-2" /> Emergency Help
              </Button>
            </div>
          </Card>

          {/* Notifications */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
            {notifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="w-12 h-12" />}
                title="No recent alerts"
              />
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.slice(0, 10).map(notif => (
                  <div
                    key={notif._id}
                    className={`p-3 rounded-lg ${!notif.isRead ? 'bg-blue-50' : 'bg-gray-50'}`}
                  >
                    <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{notif.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{format(parseISO(notif.createdAt), 'MMM d, HH:mm')}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Important Info */}
          <Card className="border-teal-200 bg-teal-50">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> How to Use WhatsApp
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p><strong>Just message naturally:</strong> "Beta, dawa khana yaad dilado" or "Doctor ke liye ride chahiye kal 10 baje"</p>
              <p><strong>Reply to reminders:</strong> "Taken", "Later", or "Need help"</p>
              <p><strong>Emergency:</strong> Send "HELP" or "Emergency" for immediate family alert</p>
              <p><strong>Languages:</strong> Hindi, English, or Hinglish all work</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}