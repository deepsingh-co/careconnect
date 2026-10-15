import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Badge, Skeleton } from '../../components/ui';
import api from '../../services/api';
import { Shield } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/audit-logs')
      .then((res) => setLogs(res.data.data.logs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Audit Log">
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : logs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Actor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Resource</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-gray-800">{log.actor?.name || 'System'}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={log.action.includes('login') || log.action.includes('register') ? 'info' : 'default'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{log.resource || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{log.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Shield size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No audit logs yet.</p>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
