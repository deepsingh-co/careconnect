import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Card, Badge, StatusBadge, EmptyState, Button, Alert, Input } from '../../components/ui';
import {
  Briefcase, Calendar, MapPin, Clock, Home, Sparkles, Flower,
  Car, Wrench, Zap, Tool, CheckCircle, XCircle, Loader2,
  Edit, ChevronRight, User, Settings
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const CATEGORY_ICONS = {
  home_cleaning: Home,
  deep_cleaning: Sparkles,
  gardening: Flower,
  car_wash: Car,
  plumbing: Wrench,
  electrical: Zap,
  other_home_service: Tool,
};

const CATEGORY_LABELS = {
  home_cleaning: 'Home Cleaning',
  deep_cleaning: 'Deep Cleaning',
  gardening: 'Gardening',
  car_wash: 'Car Wash',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  other_home_service: 'Other Home Service',
};

export default function ProviderDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, jobsRes] = await Promise.allSettled([
        api.get('/provider/profile'),
        api.get('/provider/jobs'),
      ]);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data.data.profile);
      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.data.data.jobs || []);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (jobId) => {
    try {
      await api.post(`/provider/jobs/${jobId}/accept`);
      toast.success('Job accepted!');
      fetchData();
    } catch (err) {
      toast.error('Failed to accept job');
    }
  };

  const handleReject = async (jobId) => {
    if (!confirm('Reject this job?')) return;
    try {
      await api.post(`/provider/jobs/${jobId}/reject`);
      toast.success('Job rejected');
      fetchData();
    } catch (err) {
      toast.error('Failed to reject job');
    }
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      await api.patch(`/provider/jobs/${jobId}/status`, { status: newStatus });
      toast.success('Status updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse bg-gray-200 rounded-xl" />)}</div>;

  if (!profile || profile.verificationStatus !== 'approved') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-amber-200 bg-amber-50">
          <Alert type="warning">
            <h3 className="font-semibold">Account Pending Verification</h3>
            <p className="mt-2">Your provider account is awaiting admin approval. You'll be able to see jobs once verified.</p>
            {profile && <p className="mt-2 text-sm">Status: <span className="font-medium capitalize">{profile.verificationStatus.replace('_', ' ')}</span></p>}
          </Alert>
        </Card>
        {profile && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
            <div className="space-y-3">
              <p><strong>Business:</strong> {profile.businessName || 'Not set'}</p>
              <p><strong>Services:</strong> {profile.services?.join(', ') || 'None'}</p>
              <p><strong>Area:</strong> {profile.serviceArea?.cities?.join(', ') || 'Not set'}</p>
            </div>
          </Card>
        )}
      </div>
    );
  }

  const filteredJobs = jobs
    .filter(j => !filterStatus || j.status === filterStatus)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const getNextStatus = (current) => {
    const flow = { accepted: 'in_progress', in_progress: 'completed' };
    return flow[current];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">My Jobs</h1>
          <p className="text-gray-600">{profile?.businessName || 'Provider'} Dashboard</p>
        </div>
        <Button variant="secondary" onClick={() => setShowProfile(true)}>
          <Settings className="w-4 h-4 mr-2" /> Profile
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending', count: jobs.filter(j => j.status === 'requested').length, color: 'blue', icon: Clock },
          { label: 'Accepted', count: jobs.filter(j => j.status === 'accepted').length, color: 'teal', icon: CheckCircle },
          { label: 'In Progress', count: jobs.filter(j => j.status === 'in_progress').length, color: 'orange', icon: Loader2 },
          { label: 'Completed', count: jobs.filter(j => j.status === 'completed').length, color: 'green', icon: CheckCircle2 },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card className="p-4">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="requested">Requested</option>
          <option value="accepted">Accepted</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </Card>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Briefcase className="w-16 h-16" />}
            title={jobs.length === 0 ? 'No jobs assigned' : 'No jobs match filter'}
            description={jobs.length === 0 ? 'New job requests will appear here.' : 'Try a different filter.'}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => {
            const Icon = CATEGORY_ICONS[job.serviceCategory] || Tool;
            const nextStatus = getNextStatus(job.status);
            return (
              <Card key={job._id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{CATEGORY_LABELS[job.serviceCategory] || job.serviceCategory}</h3>
                        <StatusBadge status={job.status} />
                        {job.isDemo && <Badge variant="demo">Demo</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{job.description || 'No description'}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(parseISO(job.scheduledAt), 'MMM d, yyyy')}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(parseISO(job.scheduledAt), 'HH:mm')}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.serviceAddress?.city}, {job.serviceAddress?.pincode}</span>
                        {job.durationHours && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {job.durationHours} hrs</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'requested' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => handleAccept(job._id)}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(job._id)}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {nextStatus && (
                      <Button size="sm" onClick={() => handleStatusUpdate(job._id, nextStatus)}>
                        {nextStatus === 'in_progress' ? 'Start Job' : 'Complete Job'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowProfile(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
              <button onClick={() => setShowProfile(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form className="space-y-4">
              <Input
                label="Business Name"
                value={profile.businessName || ''}
                onChange={e => setProfile({...profile, businessName: e.target.value})}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <label key={v} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.services?.includes(v)}
                        onChange={e => setProfile({
                          ...profile,
                          services: e.target.checked
                            ? [...(profile.services || []), v]
                            : (profile.services || []).filter(s => s !== v)
                        })}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
              <Input
                label="Service Cities (comma separated)"
                value={profile.serviceArea?.cities?.join(', ') || ''}
                onChange={e => setProfile({...profile, serviceArea: {...profile.serviceArea, cities: e.target.value.split(',').map(c => c.trim())}})}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Hourly Rate (₹)"
                  type="number"
                  value={profile.pricing?.hourlyRate || ''}
                  onChange={e => setProfile({...profile, pricing: {...profile.pricing, hourlyRate: parseInt(e.target.value) || 0}})}
                />
                <Input
                  label="Visit Rate (₹)"
                  type="number"
                  value={profile.pricing?.visitRate || ''}
                  onChange={e => setProfile({...profile, pricing: {...profile.pricing, visitRate: parseInt(e.target.value) || 0}})}
                />
              </div>
              <Button className="w-full" onClick={() => { toast.success('Profile saved'); setShowProfile(false); }}>
                Save Changes
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}