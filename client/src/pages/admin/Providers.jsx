import { useState } from 'react';
import { Briefcase, CheckCircle2, XCircle } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import { Card, Button, Badge, Skeleton, EmptyState, Alert } from '../../components/ui';

export default function AdminProviders() {
  const pending = useApi('/admin/providers/pending');
  const all = useApi('/admin/providers');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const review = async (id, decision) => {
    let notes = 'Approved by administrator.';
    if (decision !== 'approved') {
      notes = window.prompt(`Reason for "${decision}" (recorded in audit log):`) || '';
    }
    setError('');
    setSuccess('');
    try {
      await api.patch(`/admin/providers/${id}/review`, { decision, notes });
      setSuccess(`Provider ${decision}.`);
      pending.refetch();
      all.refetch();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Review failed.');
    }
  };

  const pendingList = pending.data?.data?.providers || [];

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Briefcase size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Provider verification</h1>
          <p className="text-sm text-gray-500">
            Only approved providers receive real assignments.
          </p>
        </div>
      </div>

      {success && <Alert type="success" className="mt-4">{success}</Alert>}
      {error && <Alert type="error" className="mt-4">{error}</Alert>}

      <Card className="p-5 mt-6">
        <h2 className="font-semibold text-[#1e3a5f] mb-4">Applications awaiting review</h2>
        {pending.loading ? (
          <Skeleton className="h-32" />
        ) : pendingList.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={40} />}
            title="No pending applications"
            description="New provider sign-ups will appear here for verification."
          />
        ) : (
          <div className="space-y-4">
            {pendingList.map((p) => (
              <div key={p._id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{p.businessName}</span>
                      <Badge variant="warning">pending_review</Badge>
                    </div>
                    <div className="text-sm text-gray-600 capitalize mt-1">
                      {p.services?.join(', ').replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Contact: {p.user?.name} · {p.user?.email} · {p.user?.phone || 'no phone'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Area: {p.serviceArea?.cities?.join(', ') || '—'} ·
                      ID verified: {p.idVerified ? 'yes' : 'no'} ·
                      Background check: {p.backgroundCheckPassed ? 'passed' : 'pending'}
                    </div>
                    {p.isDemo && <Badge variant="warning" className="mt-2">Fictional demo data</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => review(p._id, 'approved')}>
                      <CheckCircle2 size={14} className="mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => review(p._id, 'rejected')}>
                      <XCircle size={14} className="mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 mt-6">
        <h2 className="font-semibold text-[#1e3a5f] mb-4">All providers</h2>
        {all.loading ? (
          <Skeleton className="h-32" />
        ) : (all.data?.data?.providers || []).length === 0 ? (
          <EmptyState icon={<Briefcase size={40} />} title="No providers" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {(all.data?.data?.providers || []).map((p) => (
              <div key={p._id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{p.businessName}</span>
                  <Badge variant={
                    p.verificationStatus === 'approved' ? 'success'
                    : p.verificationStatus === 'pending_review' ? 'warning'
                    : 'danger'
                  }>
                    {p.verificationStatus.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 capitalize mt-2">
                  {p.services?.join(' · ').replace(/_/g, ' ')}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {p.rating}★ ({p.totalReviews} reviews) · {p.serviceArea?.cities?.join(', ') || '—'}
                </div>
                {p.isDemo && <Badge variant="warning" className="mt-2">Fictional demo provider</Badge>}
                <div className="flex gap-2 mt-3">
                  {p.verificationStatus === 'approved' ? (
                    <Button size="sm" variant="secondary" onClick={() => review(p._id, 'suspended')}>
                      Suspend
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => review(p._id, 'approved')}>
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
