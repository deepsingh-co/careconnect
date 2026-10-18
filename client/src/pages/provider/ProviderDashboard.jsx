import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Badge, StatusBadge, EmptyState, Skeleton, Alert } from '../../components/ui';
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

  return (
    <DashboardLayout title="Provider Dashboard">
      {!loading && !isApproved && (
        <Alert type="warning" className="mb-4">
          Your provider account is <strong>{profile?.verificationStatus?.replace(/_/g, ' ') || 'pending'}</strong>.
          You will receive job assignments once an administrator approves your profile.
        </Alert>
      )}
      {profile?.isDemo && (
        <Alert type="demo" className="mb-4">Demo provider account — fictional data used for demonstration.</Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        {[
          { label: 'Available', value: available.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Active', value: active.length, color: 'bg-amber-50 text-amber-700' },
          { label: 'Completed', value: completed.length, color: 'bg-green-50 text-green-700' },
        ].map((s) => (
          <Card key={s.label} className="p-3 sm:p-4 text-center">
            <p className={`text-2xl sm:text-3xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'available', label: `Available (${available.length})` },
          { key: 'active', label: `Active (${active.length})` },
          { key: 'completed', label: `Completed (${completed.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((job) => (
            <Card key={job._id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                  <Briefcase size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 capitalize">{job.serviceCategory?.replace(/_/g, ' ')}</p>
                    <StatusBadge status={job.status} />
                    {job.isDemo && <Badge variant="warning">Demo</Badge>}
                  </div>
                  {job.description && <p className="text-sm text-gray-500 mt-0.5">{job.description}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(job.scheduledAt).toLocaleString('en-IN')}</span>
                    <span>{job.durationHours}h</span>
                    {job.estimatedPrice && <span className="font-medium text-gray-600">₹{job.estimatedPrice}</span>}
                  </div>
                  {job.status === 'accepted' && job.serviceAddress && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={12} /> {job.serviceAddress.line1}, {job.serviceAddress.city}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {job.status === 'requested' && (
                    <>
                      <Button size="sm" onClick={() => acceptJob(job._id)}>
                        <CheckCircle size={14} className="mr-1" /> Accept
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => rejectJob(job._id)}>
                        <XCircle size={14} className="mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {job.status === 'accepted' && (
                    <Button size="sm" onClick={() => updateStatus(job._id, 'in_progress')}>
                      <PlayCircle size={14} className="mr-1" /> Start Job
                    </Button>
                  )}
                  {job.status === 'in_progress' && (
                    <Button size="sm" onClick={() => updateStatus(job._id, 'completed')}>
                      <CheckSquare size={14} className="mr-1" /> Complete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Briefcase size={32} />} title="No jobs here"
          description={tab === 'available' ? 'New job requests will appear here.' : tab === 'active' ? 'No active jobs.' : 'Completed jobs will appear here.'} />
      )}
    </DashboardLayout>
  );
}
