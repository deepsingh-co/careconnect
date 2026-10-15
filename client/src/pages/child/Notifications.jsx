import { Bell, CheckCheck, HeartPulse, Pill, CalendarCheck, Home, Car, Users } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import { Card, Button, Badge, Skeleton, EmptyState, Alert } from '../../components/ui';

const typeMeta = {
  booking_new: { icon: Home, color: 'text-blue-600 bg-blue-50' },
  booking_accepted: { icon: CheckCheck, color: 'text-teal-600 bg-teal-50' },
  booking_rejected: { icon: Home, color: 'text-amber-600 bg-amber-50' },
  booking_cancelled: { icon: Home, color: 'text-red-600 bg-red-50' },
  booking_completed: { icon: CheckCheck, color: 'text-green-600 bg-green-50' },
  worker_arrived: { icon: CheckCheck, color: 'text-blue-600 bg-blue-50' },
  reminder_due: { icon: Pill, color: 'text-teal-600 bg-teal-50' },
  reminder_missed: { icon: Pill, color: 'text-amber-600 bg-amber-50' },
  checkin_missed: { icon: CalendarCheck, color: 'text-amber-600 bg-amber-50' },
  emergency_alert: { icon: HeartPulse, color: 'text-red-600 bg-red-50' },
  family_invitation: { icon: Users, color: 'text-blue-600 bg-blue-50' },
  family_link_accepted: { icon: Users, color: 'text-teal-600 bg-teal-50' },
  system: { icon: Bell, color: 'text-gray-600 bg-gray-50' },
};

export default function NotificationsPage() {
  const notifs = useApi('/notifications?limit=50');

  const list = notifs.data?.data?.notifications || [];
  const unread = notifs.data?.data?.unreadCount || 0;

  const markRead = async (n) => {
    try {
      await api.patch(`/notifications/${n._id}/read`);
      notifs.refetch();
    } catch {
      /* ignore */
    }
  };

  const markAll = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      notifs.refetch();
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'You are all caught up.'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" onClick={markAll}>
            <CheckCheck size={16} className="mr-1" /> Mark all read
          </Button>
        )}
      </div>

      <Card className="p-5 mt-6">
        {notifs.loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Bell size={40} />}
            title="No notifications"
            description="Booking updates, reminders and family alerts will appear here."
          />
        ) : (
          <div className="space-y-3">
            {list.map((n) => {
              const meta = typeMeta[n.type] || typeMeta.system;
              const Icon = meta.icon;
              return (
                <div
                  key={n._id}
                  className={`flex gap-4 border rounded-xl p-4 transition-colors ${
                    n.isRead ? 'border-gray-100 bg-white' : 'border-teal-100 bg-teal-50/40'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-900">{n.title}</div>
                      <div className="text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {n.type === 'emergency_alert' && <Badge variant="danger">Urgent</Badge>}
                      {!n.isRead && (
                        <button
                          onClick={() => markRead(n)}
                          className="text-xs text-teal-600 font-medium hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Alert type="info" className="mt-4">
        Notification preferences are configured per account in Settings. Emergency alerts always
        notify linked family members regardless of preference.
      </Alert>
    </div>
  );
}
