import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Badge, Skeleton, Alert } from '../../components/ui';
import api from '../../services/api';
import { Briefcase, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/providers/pending');
      setProviders(res.data.data.providers);
    } catch { toast.error('Failed to load providers'); }
    finally { setLoading(false); }
  }

  async function review(id, decision) {
    const notes = decision === 'rejected' ? prompt('Reason for rejection (optional):') || '' : '';
    try {
      await api.patch(`/admin/providers/${id}/review`, { decision, notes });
      toast.success(`Provider ${decision}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review');
    }
  }

  return (
    <DashboardLayout title="Provider Verification">
      <Alert type="info" className="mb-4">
        Only verified and approved providers receive real job assignments. Review applications before approving.
      </Alert>

      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : providers.length ? (
        <div className="space-y-3">
          {providers.map((p) => (
            <Card key={p._id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                  <Briefcase size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{p.businessName || p.user?.name}</p>
                    <Badge variant="warning">{p.verificationStatus?.replace(/_/g, ' ')}</Badge>
                    {p.isDemo && <Badge variant="info">Demo</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{p.user?.email} • {p.user?.phone}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.services?.map((s) => <Badge key={s} variant="default">{s.replace(/_/g, ' ')}</Badge>)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    ID Verified: {p.idVerified ? 'Yes' : 'No'} • Background Check: {p.backgroundCheckPassed ? 'Passed' : 'Not passed'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => review(p._id, 'approved')}>
                    <CheckCircle size={14} className="mr-1" /> Approve
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => review(p._id, 'rejected')}>
                    <XCircle size={14} className="mr-1" /> Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Briefcase size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No pending provider applications.</p>
        </Card>
      )}
    </DashboardLayout>
  );
}
