import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import ChildDashboard from './pages/child/ChildDashboard';
import RemindersPage from './pages/child/RemindersPage';
import BookingsPage from './pages/child/BookingsPage';
import RidesPage from './pages/child/RidesPage';
import FoodPage from './pages/child/FoodPage';
import FamilyPage from './pages/child/FamilyPage';
import EmergencyPage from './pages/child/EmergencyPage';
import NotificationsPage from './pages/child/NotificationsPage';

import ParentDashboard from './pages/parent/ParentDashboard';

import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderProfilePage from './pages/provider/ProviderProfilePage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProvidersPage from './pages/admin/AdminProvidersPage';
import AdminIntegrationsPage from './pages/admin/AdminIntegrationsPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';

// Role-aware dashboard redirect
function RoleDashboard() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
      </div>
    );
  }
  if (user?.role === 'parent') return <ParentDashboard />;
  if (user?.role === 'provider') return <Navigate to="/provider/jobs" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <ChildDashboard />;
}

// Shared care pages: allow parent, child, admin
const CareRoles = ['parent', 'child', 'admin'];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />

          {/* Role-aware dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><RoleDashboard /></ProtectedRoute>} />

          {/* Shared care pages */}
          <Route path="/reminders" element={<ProtectedRoute roles={CareRoles}><RemindersPage /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute roles={CareRoles}><BookingsPage /></ProtectedRoute>} />
          <Route path="/rides" element={<ProtectedRoute roles={CareRoles}><RidesPage /></ProtectedRoute>} />
          <Route path="/food" element={<ProtectedRoute roles={CareRoles}><FoodPage /></ProtectedRoute>} />
          <Route path="/family" element={<ProtectedRoute roles={CareRoles}><FamilyPage /></ProtectedRoute>} />
          <Route path="/emergency" element={<ProtectedRoute roles={CareRoles}><EmergencyPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute roles={CareRoles}><NotificationsPage /></ProtectedRoute>} />

          {/* Provider */}
          <Route path="/provider/jobs" element={<ProtectedRoute roles={['provider', 'admin']}><ProviderDashboard /></ProtectedRoute>} />
          <Route path="/provider/profile" element={<ProtectedRoute roles={['provider', 'admin']}><ProviderProfilePage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/providers" element={<ProtectedRoute roles={['admin']}><AdminProvidersPage /></ProtectedRoute>} />
          <Route path="/admin/integrations" element={<ProtectedRoute roles={['admin']}><AdminIntegrationsPage /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute roles={['admin']}><AdminAuditPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
