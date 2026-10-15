import { Link } from 'react-router-dom';
import { Users, Briefcase, Home, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { Card, Badge, Skeleton, Alert, StatusBadge } from '../../components/ui';

export default function AdminDashboard() {
  const stats = useApi('/admin/stats');
  const pending = useApi('/admin/providers/pending');
  const audit = useApi('/admin/audit-logs?limit=10');
  const s = stats.data?.data;
  const pendingList = pending.data?.data?.providers || [];
  const logs = audit.data?.data?.logs || [];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Administration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform oversight, provider verification and audit history.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          [
            { icon: Users, l: 'Total users', v: s?.totalUsers ?? 0, to: '/admin/users', tone: 'bg-blue-50 text-blue-700' },
            { icon: Home, l: 'Total bookings', v: s?.totalBookings ?? 0, to: '/admin/bookings', tone: 'bg-teal-50 text-teal-700' },
            { icon: Briefcase, l: 'Pending providers', v: s?.pendingProviders ?? 0, to: '/admin/providers', tone: 'bg-amber-50 text-amber-700' },
            { icon: AlertTriangle, l: 'Active alerts', v: s?.activeAlerts ?? 0, to: '/dashboard/emergency', tone: 'bg-red-50 text-red-700' },
          ].map((x) => (
            <Link key={x.l} to={x.to} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 transition-colors">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${x.tone}`}>
                <x.icon size={20} />
              </div>
              <div className="text-2xl font-bold text-[#1e3a5f]">{x.v}</div>
              <div className="text-sm text-gray-600">{x.l}</div>
            </Link>
          ))
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1e3a5f]">Pending provider verification</h2>
            <Link to="/admin/providers" className="text-sm text-teal-600 hover:underline">Review all</Link>
          </div>
          {pending.loading ? (
            <Skeleton className="h-32" />
          ) : pendingList.length === 0 ? (
            <div className="flex items-center gap-3 text-sm text-gray-500 py-6">
              <CheckCircle2 size={20} className="text-green-500" />
              No provider applications awaiting review.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingList.slice(0, 4).map((p) => (
                <div key={p._id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{p.businessName}</div>
                    <div className="text-xs text-gray-500 capitalize">{p.services?.join(', ').replace(/_/g, ' ')}</div>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-[#1e3a5f] mb-4">Recent audit activity</h2>
          {audit.loading ? (
            <Skeleton className="h-32" />
          ) : logs.length === 0 ? (
            <div className="text-sm text-gray-500 py-6">No audit events recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 6).map((log) => (
                <div key={log._id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2">
                  <div className="min-w-0">
                    <span className="font-mono text-gray-700">{log.action}</span>
                    <span className="text-gray-400 ml-2">{log.actor?.name}</span>
                  </div>
                  <span className="text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Alert type="info" className="mt-6">
        <strong>Server-side authorization:</strong> every admin endpoint checks the authenticated
        user's role. Hiding admin pages in the frontend is not used as a security control.
      </Alert>
    </div>
  );
}
