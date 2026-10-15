import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Badge, Skeleton, Alert } from '../../components/ui';
import api from '../../services/api';
import { Users, Briefcase, AlertTriangle, Activity, Settings, Shield, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [integrations, setIntegrations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [s, i] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/integrations'),
      ]);
      setStats(s.status === 'fulfilled' ? s.value.data.data : null);
      setIntegrations(i.status === 'fulfilled' ? i.value.data.data : null);
    } catch { /* empty states */ }
    finally { setLoading(false); }
  }

  const statusColor = (status) => {
    if (['connected', 'configured'].includes(status)) return 'success';
    if (['demo_mode', 'fallback_mode', 'manual_fulfillment', 'demo_catalogue', 'demo_data', 'simulated'].includes(status)) return 'warning';
    return 'danger';
  };

  return (
    <DashboardLayout title="Admin Overview">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: 'Total Users', value: stats?.totalUsers, color: 'text-blue-600 bg-blue-50' },
          { icon: Briefcase, label: 'Total Bookings', value: stats?.totalBookings, color: 'text-teal-600 bg-teal-50' },
          { icon: Settings, label: 'Pending Providers', value: stats?.pendingProviders, color: 'text-amber-600 bg-amber-50' },
          { icon: AlertTriangle, label: 'Active Alerts', value: stats?.activeAlerts, color: 'text-red-600 bg-red-50' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={20} /></div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">{loading ? '—' : (s.value ?? 0)}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Integration Status */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1e3a5f] flex items-center gap-2"><Activity size={18} /> Integration Status</h3>
          <Link to="/admin/integrations" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">Configure <ArrowRight size={14} /></Link>
        </div>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : integrations ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(integrations).map(([key, val]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <Badge variant={statusColor(val.status)}>{val.status?.replace(/_/g, ' ')}</Badge>
                </div>
                {val.notice && <p className="text-xs text-gray-500">{val.notice}</p>}
              </div>
            ))}
          </div>
        ) : (
          <Alert type="error">Failed to load integration status.</Alert>
        )}
      </Card>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Manage Users', to: '/admin/users', color: 'bg-blue-50 text-blue-700' },
          { icon: Briefcase, label: 'Provider Reviews', to: '/admin/providers', color: 'bg-amber-50 text-amber-700' },
          { icon: Settings, label: 'Integrations', to: '/admin/integrations', color: 'bg-teal-50 text-teal-700' },
          { icon: Shield, label: 'Audit Log', to: '/admin/audit', color: 'bg-purple-50 text-purple-700' },
        ].map((l) => (
          <Link key={l.label} to={l.to}>
            <Card className="p-5 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${l.color}`}><l.icon size={20} /></div>
              <p className="font-semibold text-[#1e3a5f]">{l.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
