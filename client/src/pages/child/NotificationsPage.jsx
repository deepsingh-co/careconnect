import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { EmptyState, Skeleton, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';

const typeColors = {
  booking_new: 'bg-blue-50 border-blue-200',
  booking_accepted: 'bg-care-50 border-care-200',
  booking_cancelled: 'bg-red-50 border-red-200',
  booking_completed: 'bg-green-50 border-green-200',
  worker_arrived: 'bg-amber-50 border-amber-200',
  reminder_due: 'bg-care-50 border-care-200',
  reminder_missed: 'bg-orange-50 border-orange-200',
  checkin_missed: 'bg-orange-50 border-orange-200',
  emergency_alert: 'bg-red-100 border-red-300',
  family_invitation: 'bg-purple-50 border-purple-200',
  family_link_accepted: 'bg-green-50 border-green-200',
  approval_request: 'bg-amber-50 border-amber-200',
  approval_approved: 'bg-emerald-50 border-emerald-200',
  approval_declined: 'bg-rose-50 border-rose-200',
  approval_expired: 'bg-gray-50 border-gray-200',
  approval_delivered: 'bg-emerald-50 border-emerald-200',
  system: 'bg-gray-50 border-gray-200',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    try {
      const params = filter === 'unread' ? '?unread=true' : '';
      const res = await api.get(`/notifications${params}`);
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }

  async function markAllRead() {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  }

  // Approve/decline straight from the notification so the child never has to
  // open the approvals page for a routine request.
  async function respond(notification, action) {
    const approvalId = notification.data?.approvalId;
    if (!approvalId) return;
    setBusyId(notification._id);
    try {
      const res = await api.post(`/approvals/${approvalId}/respond`, { action });
      const handoffUrl = res.data.data.handoffUrl;
      toast.success(
        action === 'approve'
          ? `Approved — your parent has been notified.${handoffUrl ? ' Delivery link is on the approvals page.' : ''}`
          : 'Declined — your parent has been informed.'
      );
      setNotifications(prev =>
        prev.map(n =>
          n._id === notification._id
            ? {
                ...n,
                isRead: true,
                data: { ...n.data, handled: true, handledAction: action },
              }
            : n
        )
      );
      if (!notification.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      const status = err.response?.status;
      toast.error(err.response?.data?.message || 'Could not update this request');
      // Already handled by another family member, expired, or no longer linked:
      // hide the stale buttons so the list stays truthful.
      if ([403, 404, 409, 410].includes(status)) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id
              ? {
                  ...n,
                  isRead: true,
                  data: { ...n.data, handled: true, handledAction: 'closed' },
                }
              : n
          )
        );
        if (!notification.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } finally {
      setBusyId(null);
    }
  }

  const handledLabel = {
    approve: 'Approved',
    decline: 'Declined',
    expired: 'Expired',
    failed: 'Could not be completed',
    closed: 'Already handled',
  };

  return (
    <DashboardLayout title="Notifications">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-care-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            All
          </button>
          <button onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'unread' ? 'bg-care-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            Unread ({unreadCount})
          </button>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck size={16} className="mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : notifications.length ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                n.isRead ? 'bg-white border-gray-200' : (typeColors[n.type] || 'bg-white border-gray-200')
              }`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  n.isRead ? 'bg-gray-100 text-gray-400' : 'bg-care-100 text-care-600'
                }`}>
                  <Bell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm ${n.isRead ? 'text-gray-600' : 'font-semibold text-gray-800'}`}>{n.title}</p>
                    {!n.isRead && <div className="w-2 h-2 bg-care-500 rounded-full" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>

                  {user?.role === 'child' &&
                    n.type === 'approval_request' &&
                    n.data?.approvalId &&
                    !n.data?.handled && (
                      <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="success"
                          loading={busyId === n._id}
                          onClick={() => respond(n, 'approve')}
                        >
                          <Check size={15} className="mr-1" aria-hidden="true" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === n._id}
                          onClick={() => respond(n, 'decline')}
                        >
                          <X size={15} className="mr-1" aria-hidden="true" /> Decline
                        </Button>
                      </div>
                    )}

                  {n.type === 'approval_request' && n.data?.handled && (
                    <p className="mt-2 text-xs font-medium text-gray-500">
                      {handledLabel[n.data.handledAction] || 'Handled'}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Bell size={32} />} title="No notifications"
          description={filter === 'unread' ? 'No unread notifications.' : 'Notifications will appear here as events happen.'} />
      )}
    </DashboardLayout>
  );
}
