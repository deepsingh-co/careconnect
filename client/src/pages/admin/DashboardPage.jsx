import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Card, Badge, StatusBadge, Button, Alert, Input } from '../../components/ui';
import {
  Users, Shield, Settings, Activity, TrendingUp, Clock,
  CheckCircle, XCircle, Loader2, Eye, Edit, Trash2,
  Database, Smartphone, Brain, Globe, AlertTriangle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [integrationStatus, setIntegrationStatus] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, integRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/integrations'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
      if (integRes.status === 'fulfilled') setIntegrationStatus(integRes.value.data.data);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderReview = async (providerId, decision) => {
    if (!confirm(`${decision === 'approved' ? 'Approve' : 'Reject'} this provider?`)) return;
    try {
      await api.patch(`/admin/providers/${providerId}/review`, { decision });
      toast.success(`Provider ${decision}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to review provider');
    }
  };

  const handleUserToggle = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle`);
      toast.success(`User ${currentStatus ? 'suspended' : 'activated'}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  if (loading) return <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse bg-gray-200 rounded-xl" />)}</div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'providers', label: 'Providers', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>
        <Badge variant="danger">Admin Access</Badge>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1" role="tablist">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white border-b-2 border-teal-600 text-teal-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 inline mr-1" /> {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.totalUsers || 0, color: 'blue', icon: Users },
              { label: 'Total Bookings', value: stats.totalBookings || 0, color: 'teal', icon: Activity },
              { label: 'Pending Providers', value: stats.pendingProviders || 0, color: 'orange', icon: Shield },
              { label: 'Active Alerts', value: stats.activeAlerts || 0, color: 'red', icon: AlertTriangle },
            ].map(stat => (
              <Card key={stat.label} className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Integration Status */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Status</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: 'database', label: 'Database', icon: Database },
                { key: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
                { key: 'ai', label: 'AI/Intent Detection', icon: Brain },
                { key: 'maps', label: 'Maps/Geocoding', icon: Globe },
                { key: 'email', label: 'Email', icon: Smartphone },
                { key: 'rideProvider', label: 'Ride Provider', icon: Car },
                { key: 'foodProvider', label: 'Food Provider', icon: Utensils },
                { key: 'householdProviders', label: 'Household Providers', icon: Home },
              ].map(item => {
                const status = integrationStatus[item.key];
                const isConnected = status?.status === 'connected' || status?.status === 'configured';
                return (
                  <div key={item.key} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500 capitalize">{status?.status || 'unknown'}</p>
                      </div>
                    </div>
                    {status?.notice && (
                      <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded">{status.notice}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <Button variant="secondary" onClick={() => setActiveTab('users')}>
                <Users className="w-4 h-4 mr-2" /> Manage Users
              </Button>
              <Button variant="secondary" onClick={() => setActiveTab('providers')}>
                <Shield className="w-4 h-4 mr-2" /> Review Providers
              </Button>
              <Button variant="secondary" onClick={() => setActiveTab('integrations')}>
                <Settings className="w-4 h-4 mr-2" /> Configure Integrations
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Management</h2>
            {/* In a real app, this would fetch from /admin/users with pagination */}
            <Alert type="info">
              User management table would appear here. Fetch from <code>/admin/users</code> with pagination.
              Include: name, email, role, status, last login, actions (toggle active, view details).
            </Alert>
          </Card>
        </div>
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Provider Applications</h2>
            {/* In a real app, fetch from /admin/providers/pending */}
            <Alert type="info">
              Provider review queue would appear here. Fetch from <code>/admin/providers/pending</code>.
              Each provider shows: business name, services, area, verification documents, actions (approve/reject).
            </Alert>
          </Card>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Configuration</h2>
            <div className="space-y-6">
              {[
                { key: 'whatsapp', label: 'WhatsApp', icon: Smartphone, status: integrationStatus.whatsapp },
                { key: 'ai', label: 'AI/Intent Detection', icon: Brain, status: integrationStatus.ai },
                { key: 'maps', label: 'Maps/Geocoding', icon: Globe, status: integrationStatus.maps },
                { key: 'email', label: 'Email', icon: Smartphone, status: integrationStatus.email },
              ].map(item => (
                <div key={item.key} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.label}</h3>
                        <p className="text-sm text-gray-500">Status: {item.status?.status || 'unknown'}</p>
                      </div>
                    </div>
                    <Badge variant={item.status?.status === 'configured' ? 'success' : 'warning'}>
                      {item.status?.status === 'configured' ? 'Configured' : 'Demo Mode'}
                    </Badge>
                  </div>
                  {item.status?.notice && (
                    <p className="text-sm text-amber-700 mt-2 bg-amber-50 p-2 rounded">{item.status.notice}</p>
                  )}
                  <div className="mt-3 text-sm text-gray-600">
                    <p>Configure via environment variables in <code>.env</code>:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {item.key === 'whatsapp' && (
                        <>
                          <li><code>WHATSAPP_PROVIDER=meta|twilio</code></li>
                          <li><code>META_WHATSAPP_TOKEN, META_WHATSAPP_PHONE_NUMBER_ID, META_WHATSAPP_WEBHOOK_VERIFY_TOKEN</code></li>
                          <li><code>TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN</code></li>
                        </>
                      )}
                      {item.key === 'ai' && (
                        <>
                          <li><code>AI_PROVIDER=openai|google</code></li>
                          <li><code>OPENAI_API_KEY</code> or <code>GOOGLE_AI_API_KEY</code></li>
                        </>
                      )}
                      {item.key === 'maps' && (
                        <li><code>GOOGLE_MAPS_API_KEY</code></li>
                      )}
                      {item.key === 'email' && (
                        <>
                          <li><code>SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS</code></li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}