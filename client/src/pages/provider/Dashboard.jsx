import { useState } from 'react';
import {
  Briefcase, CheckCircle2, XCircle, PlayCircle, PackageCheck, MapPin, Clock,
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import {
  Card, Button, Badge, StatusBadge, Skeleton, EmptyState, Alert,
} from '../../components/ui';

const tabOrder = ['requested', 'accepted', 'in_progress', 'completed'];

export default function ProviderDashboard() {
  const profile = useApi('/provider/profile');
  const [tab, setTab] = useState('requested');
  const jobs = useApi(`/provider/jobs?status=${tab}`, { deps: [tab] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const prov = profile.data?.data?.profile;
  const list = jobs.data?.data?.jobs || [];

  const act = async (fn) => {
    setError('');
    setSuccess('');
    try {
      await fn();
      setSuccess('Job updated.');
      jobs.refetch();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  const counts = jobs.data?.data?.counts;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Worker portal</h1>
          <p className="text-sm text-gray-500 mt-1">
            Accept assigned jobs, update arrival and completion status.
          </p>
        </div>
        {prov && (
          <div className="flex items-center gap-2">
            <Badge variant={prov.verificationStatus === 'approved' ? 'success' : 'warning'}>
              {prov.verificationStatus.replace(/_/g, ' ')}
            </Badge>
            {prov.isDemo && <Badge variant="warning">Fictional demo provider</Badge>}
          </div>
        )}
      </div>

      {error && <Alert type="error" className="mt-4">{error}</Alert>}
      {success && <Alert type="success" className="mt-4">{success}</Alert>}

      {/* Profile status */}
      <Card className="p-5 mt-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-[#1e3a5f]">
              {prov?.businessName || 'Provider account'}
            </div>
            <div className="text-sm text-gray-500 capitalize mt-1">
              Services: {prov?.services?.join(', ').replace(/_/g, ' ') || '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Area: {prov?.serviceArea?.cities?.join(', ') || '—'} ·{' '}
              {prov?.pricing?.hourlyRate ? `₹${prov.pricing.hourlyRate}/hour` : 'Pricing on request'}
              {prov?.rating ? ` · ${prov.rating}★ (${prov.totalReviews})` : ''}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Verification</div>
            <div className={`font-semibold ${prov?.verificationStatus === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>
              {prov?.idVerified ? 'ID verified' : 'ID pending'}
              {' · '}
              {prov?.backgroundCheckPassed ? 'Background check passed' : 'Background check pending'}
            </div>
          </div>
        </div>

        {prov && prov.verificationStatus !== 'approved' && (
          <Alert type="warning" className="mt-4">
            Your account is pending administrator verification. Only approved providers receive
            real assignments. An admin must approve your application in the admin dashboard.
          </Alert>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mt-6">
        {tabOrder.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tab === t
                ? 'bg-[#0d9488] text-white border-[#0d9488]'
                : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
            }`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Jobs */}
      <Card className="p-5 mt-4">
        <h2 className="font-semibold text-[#1e3a5f] mb-4 capitalize">{tab.replace(/_/g, ' ')} jobs</h2>
        {jobs.loading ? (
          <Skeleton className="h-40" />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={40} />}
            title={`No ${tab.replace(/_/g, ' ')} jobs`}
            description={
              prov?.verificationStatus !== 'approved'
                ? 'Jobs appear here once your account is verified.'
                : 'New assignments will appear here.'
            }
          />
        ) : (
          <div className="space-y-4">
            {list.map((j) => (
              <div key={j._id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 capitalize">
                        {j.serviceCategory.replace(/_/g, ' ')}
                      </span>
                      <StatusBadge status={j.status} />
                      <Badge variant="info">{j.serviceType?.replace(/_/g, ' ')}</Badge>
                      {j.isDemo && <Badge variant="warning">Demo</Badge>}
                    </div>
                    <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-3">
                      <span className="flex items-center gap-1"><Clock size={12} />
                        {new Date(j.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} IST
                      </span>
                      <span className="flex items-center gap-1"><MapPin size={12} />
                        {j.serviceAddress?.line1 || 'Address released after acceptance'}
                        {j.serviceAddress?.city ? `, ${j.serviceAddress.city}` : ''}
                      </span>
                      <span>Duration: {j.durationHours}h</span>
                    </div>
                    {j.description && <div className="text-xs text-gray-600 mt-1">{j.description}</div>}
                    {j.estimatedPrice && (
                      <div className="text-sm font-semibold text-[#1e3a5f] mt-1">₹{j.estimatedPrice}</div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {j.status === 'requested' && (
                      <>
                        <Button size="sm" onClick={() => act(() => api.post(`/provider/jobs/${j._id}/accept`))}>
                          <CheckCircle2 size={14} className="mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="secondary"
                          onClick={() => act(() => api.post(`/provider/jobs/${j._id}/reject`))}>
                          <XCircle size={14} className="mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {j.status === 'accepted' && (
                      <Button size="sm" onClick={() => act(() => api.patch(`/provider/jobs/${j._id}/status`, { status: 'in_progress' }))}>
                        <PlayCircle size={14} className="mr-1" /> Start work
                      </Button>
                    )}
                    {j.status === 'in_progress' && (
                      <Button size="sm" onClick={() => act(() => api.patch(`/provider/jobs/${j._id}/status`, { status: 'completed' }))}>
                        <PackageCheck size={14} className="mr-1" /> Mark complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Alert type="info" className="mt-4">
        Providers only see the full service address after accepting a job. All status changes are
        logged and the family is notified automatically.
      </Alert>
    </div>
  );
}
