import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Badge, Select, Skeleton } from '../../components/ui';
import api from '../../services/api';
import { Users, Ban, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');

  useEffect(() => { load(); }, [role]);

  async function load() {
    setLoading(true);
    try {
      const params = role ? `?role=${role}` : '';
      const res = await api.get(`/admin/users${params}`);
      setUsers(res.data.data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }

  async function toggleActive(id) {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      toast.success('User status updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  }

  const roleBadge = { parent: 'teal', child: 'info', provider: 'warning', admin: 'danger' };

  return (
    <DashboardLayout title="User Management">
      <div className="flex gap-2 mb-4">
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-auto">
          <option value="">All Roles</option>
          <option value="parent">Parent</option>
          <option value="child">Child / Family</option>
          <option value="provider">Provider</option>
          <option value="admin">Admin</option>
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3"><Badge variant={roleBadge[u.role]}>{u.role}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Suspended'}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <Button variant={u.isActive ? 'danger' : 'primary'} size="sm" onClick={() => toggleActive(u._id)}>
                        {u.isActive ? <><Ban size={14} className="mr-1" /> Suspend</> : <><CheckCircle size={14} className="mr-1" /> Activate</>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
