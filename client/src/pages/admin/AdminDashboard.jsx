import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Badge, StatCard, Skeleton, Alert } from '../../components/ui';
import api from '../../services/api';
import { Users, Briefcase, AlertTriangle, Activity, Settings, Shield, ArrowRight, ArrowUpRight } from 'lucide-react';

const integrationLabels = {
  database: 'Database',
  whatsapp: 'WhatsApp',
  ai: 'AI',
  maps: 'Maps',
  email: 'Email',
  rideProvider: 'Ride provider',
  foodProvider: 'Food provider',
  householdProviders: 'Household providers',
};

const quickLinks = [
  { icon: Users, label: 'Manage users', description: 'Accounts, roles and access', to: '/admin/users', tint: 'bg-care-50 text-care-700' },
  { icon: Briefcase, label: 'Provider reviews', description: 'Verify new service providers', to: '/admin/providers', tint: 'bg-amber-50 text-amber-700' },
  { icon: Settings, label: 'Integrations', description: 'WhatsApp, AI, maps and email', to: '/admin/integrations', tint: 'bg-emerald-50 text-emerald-700' },
  { icon: Shield, label: 'Audit log', description: 'Trace sensitive operations', to: '/admin/audit', tint: 'bg-violet-50 text-violet-700' },
];

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

  const statCards = [
    { icon: Users, label: 'Total users', value: stats?.totalUsers, tone: 'care' },
    { icon: Briefcase, label: 'Total bookings', value: stats?.totalBookings, tone: 'green' },
    { icon: Settings, label: 'Pending providers', value: stats?.pendingProviders, tone: 'amber' },
    { icon: AlertTriangle, label: 'Active alerts', value: stats?.activeAlerts, tone: 'rose' },
  ];

  return (
    <DashboardLayout
      title="Admin overview"
      subtitle="Platform health, provider verification and integrations at a glance."
    >
      <section aria-label="Platform statistics" aria-busy={loading} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </section>

      <Card className="mt-5 p-5 sm:mt-6 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-care-50 text-care-700">
              <Activity size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-care-950">Integration status</h2>
              <p className="text-sm text-care-500">Live view of the services powering CareConnect.</p>
            </div>
          </div>
          <Link
            to="/admin/integrations"
            className="inline-flex min-h-9 items-center gap-1 rounded-lg text-sm font-semibold text-care-700 transition-colors hover:text-care-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-500 focus-visible:ring-offset-2"
          >
            Configure <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : integrations ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(integrations).map(([key, val]) => (
              <div key={key} className="rounded-xl border border-care-100 bg-care-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-care-900">
                    {integrationLabels[key] || key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <Badge variant={statusColor(val.status)}>{val.status?.replace(/_/g, ' ')}</Badge>
                </div>
                {val.notice && <p className="mt-2 text-xs leading-relaxed text-care-500">{val.notice}</p>}
              </div>
            ))}
          </div>
        ) : (
          <Alert type="error" className="mt-4">Failed to load integration status.</Alert>
        )}
      </Card>

      <section className="mt-5 sm:mt-6" aria-labelledby="admin-shortcuts">
        <h2 id="admin-shortcuts" className="sr-only">Admin shortcuts</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="group cursor-pointer rounded-2xl border border-care-100 bg-white p-5 shadow-[0_1px_2px_rgba(12,74,110,0.04),0_12px_32px_-20px_rgba(12,74,110,0.18)] transition duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-care-200 hover:shadow-[0_2px_4px_rgba(12,74,110,0.05),0_18px_40px_-20px_rgba(12,74,110,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-500 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${link.tint}`}>
                  <link.icon size={21} aria-hidden="true" />
                </span>
                <ArrowUpRight size={18} aria-hidden="true" className="text-care-200 transition-colors group-hover:text-care-500" />
              </div>
              <p className="mt-4 font-semibold text-care-950">{link.label}</p>
              <p className="mt-0.5 text-sm text-care-500">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
