import { useState } from 'react';
import { Users, Shield, Ban, CheckCircle2 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import { Card, Button, Badge, Select, Skeleton, EmptyState, Alert } from '../../components/ui';

const roleLabels = {
  parent: 'Parent',
  child: 'Family caregiver',
  provider: 'Provider',
  admin: 'Admin',
};

export default function AdminUsers() {
  const [role, setRole] = useState('');
  const users = useApi(`/admin/users?limit=50${role ? `&role=${role}` : ''}`, { deps: [role] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const toggle = async (u) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/admin/users/${u._id}/toggle`);
      setSuccess(`${u.name} ${u.isActive ? 'suspended' : 'activated'}.`);
      users.refetch();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.');
    }
  };

  const list = users.data?.data?.users || [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">User management</h1>
            <p className="text-sm text-gray-500">View and moderate all platform accounts.</p>
          </div>
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-auto">
          <option value="">All roles</option>
          {Object.entries(roleLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>

      {success && <Alert type="success" className="mt-4">{success}</Alert>}
      {error && <Alert type="error" className="mt-4">{error}</Alert>}

      <Card className="p-5 mt-6">
        {users.loading ? (
          <Skeleton className="h-64" />
        ) : list.length === 0 ? (
          <EmptyState icon={<Users size={40} />} title="No users found" />
        ) : (
          <div className="space-y-3">
            {list.map((u) => (
              <div key={u._id} className="flex flex-wrap items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{u.name}</span>
                    <Badge variant={u.role === 'admin' ? 'info' : u.role === 'parent' ? 'teal' : 'default'}>
                      {roleLabels[u.role]}
                    </Badge>
                    <Badge variant={u.isActive ? 'success' : 'danger'}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                    {u.phone && (
                      <Badge variant={u.phoneVerified ? 'success' : 'default'}>
                        {u.phoneVerified ? 'Phone verified' : 'Phone unverified'}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {u.email} · Joined {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    {u.lastLoginAt ? ` · Last login ${new Date(u.lastLoginAt).toLocaleString('en-IN')}` : ''}
                  </div>
                </div>
                {u.role !== 'admin' && (
                  <Button
                    size="sm"
                    variant={u.isActive ? 'danger' : 'primary'}
                    onClick={() => toggle(u)}
                  >
                    {u.isActive ? <><Ban size={14} className="mr-1" /> Suspend</> : <><CheckCircle2 size={14} className="mr-1" /> Activate</>}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Alert type="info" className="mt-4">
        <Shield size={14} className="inline mr-1" />
        Account status changes are recorded in the audit log with the acting administrator's ID.
      </Alert>
    </div>
  );
}
