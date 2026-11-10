import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Badge, StatusBadge, EmptyState, Skeleton, Alert, StatCard } from '../../components/ui';
import api from '../../services/api';
import { Briefcase, CheckCircle, XCircle, MapPin, Calendar, PlayCircle, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProviderDashboard() {
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('available');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [j, p] = await Promise.allSettled([
        api.get('/provider/jobs'),
        api.get('/provider/profile'),
      ]);
      setJobs(j.status === 'fulfilled' ? j.value.data.data.jobs : []);
      setProfile(p.status === 'fulfilled' ? p.value.data.data.profile : null);
    } catch { /* handled by empty states */ }
    finally { setLoading(false); }
  }

  async function acceptJob(id) {
    try {
      await api.post(`/provider/jobs/${id}/accept`);
      toast.success('Job accepted!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept job');
    }
  }

  async function rejectJob(id) {
    if (!confirm('Reject this job?')) return;
    try {
      await api.post(`/provider/jobs/${id}/reject`);
      toast.success('Job rejected');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/provider/jobs/${id}/status`, { status });
      toast.success(`Job ${status.replace(/_/g, ' ')}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  }

  const isApproved = profile?.verificationStatus === 'approved';
  const available = jobs.filter(j => j.status === 'requested');
  const active = jobs.filter(j => ['accepted', 'in_progress'].includes(j.status));
  const completed = jobs.filter(j => j.status === 'completed');

  const filtered = tab === 'available' ? available : tab === 'active' ? active : completed;

  const tabs = [
    { key: 'available', label: 'Available', count: available.length },
    { key: 'active', label: 'Active', count: active.length },
    { key: 'completed', label: 'Completed', count: completed.length },
  ];

  return (
    <DashboardLayout
      title="Provider dashboard"
      subtitle="Accept nearby jobs, update their status and keep families informed."
    >
      {!loading && !isApproved && (
        <Alert type="warning" className="mb-5">
          Your provider account is <strong>{profile?.verificationStatus?.replace(/_/g, ' ') || 'pending'}</strong>.
          You will receive job assignments once an administrator approves your profile.
        </Alert>
      )}
      {profile?.isDemo && (
        <Alert type="demo" className="mb-5">Demo provider account — fictional data used for demonstration.</Alert>
      )}

      <section aria-label="Job summary" aria-busy={loading} className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard icon={Briefcase} label="Available jobs" value={available.length} tone="sky" loading={loading} />
        <StatCard icon={PlayCircle} label="Active jobs" value={active.length} tone="amber" loading={loading} />
        <StatCard icon={CheckCircle} label="Completed jobs" value={completed.length} tone="green" loading={loading} />
      </section>

      <div className="mt-5 sm:mt-6">
        <div
          role="tablist"
          aria-label="Job filters"
          className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-care-100 bg-white p-1 shadow-sm"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`jobs-tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls="jobs-panel"
              onClick={() => setTab(t.key)}
              className={`inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-500 focus-visible:ring-offset-1 ${
                tab === t.key ? 'bg-care-600 text-white shadow-sm' : 'text-care-600 hover:bg-care-50 hover:text-care-900'
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                  tab === t.key ? 'bg-white/20 text-white' : 'bg-care-50 text-care-700'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div id="jobs-panel" role="tabpanel" aria-labelledby={`jobs-tab-${tab}`} className="mt-4">
        {loading ? (
          <div className="space-y-3" aria-hidden="true">{[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : filtered.length ? (
          <ul className="space-y-3">
            {filtered.map((job) => (
              <li key={job._id}>
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-care-50 text-care-700">
                        <Briefcase size={20} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold capitalize text-care-950">{job.serviceCategory?.replace(/_/g, ' ')}</p>
                          <StatusBadge status={job.status} />
                          {job.isDemo && <Badge variant="warning">Demo</Badge>}
                        </div>
                        {job.description && <p className="mt-1 text-sm text-care-500">{job.description}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-care-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={13} aria-hidden="true" />
                            {new Date(job.scheduledAt).toLocaleString('en-IN')}
                          </span>
                          <span>{job.durationHours}h</span>
                          {job.estimatedPrice && <span className="font-semibold text-care-700">₹{job.estimatedPrice}</span>}
                        </div>
                        {job.status === 'accepted' && job.serviceAddress && (
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-care-500">
                            <MapPin size={13} aria-hidden="true" />
                            {job.serviceAddress.line1}, {job.serviceAddress.city}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                      {job.status === 'requested' && (
                        <>
                          <Button size="sm" onClick={() => acceptJob(job._id)}>
                            <CheckCircle size={14} className="mr-1" aria-hidden="true" /> Accept
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => rejectJob(job._id)}>
                            <XCircle size={14} className="mr-1" aria-hidden="true" /> Reject
                          </Button>
                        </>
                      )}
                      {job.status === 'accepted' && (
                        <Button size="sm" onClick={() => updateStatus(job._id, 'in_progress')}>
                          <PlayCircle size={14} className="mr-1" aria-hidden="true" /> Start job
                        </Button>
                      )}
                      {job.status === 'in_progress' && (
                        <Button size="sm" onClick={() => updateStatus(job._id, 'completed')}>
                          <CheckSquare size={14} className="mr-1" aria-hidden="true" /> Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card>
            <EmptyState
              icon={<Briefcase size={26} />}
              title="No jobs here"
              description={tab === 'available' ? 'New job requests will appear here.' : tab === 'active' ? 'No active jobs.' : 'Completed jobs will appear here.'}
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
