import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import {
  Bell, Menu, X, Home, Calendar, Pill, Car, UtensilsCrossed,
  Users, Settings, LogOut, HeartPulse, LayoutDashboard, Shield, Briefcase,
} from 'lucide-react';

const navByRole = {
  child: [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/reminders', label: 'Reminders', icon: Pill },
    { to: '/bookings', label: 'Bookings', icon: Briefcase },
    { to: '/rides', label: 'Rides', icon: Car },
    { to: '/food', label: 'Food', icon: UtensilsCrossed },
    { to: '/family', label: 'Family', icon: Users },
    { to: '/emergency', label: 'Emergency', icon: HeartPulse },
    { to: '/notifications', label: 'Alerts', icon: Bell },
  ],
  provider: [
    { to: '/provider/jobs', label: 'My Jobs', icon: LayoutDashboard },
    { to: '/provider/profile', label: 'Profile', icon: Settings },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/providers', label: 'Providers', icon: Briefcase },
    { to: '/admin/integrations', label: 'Integrations', icon: Settings },
    { to: '/admin/audit', label: 'Audit Log', icon: Shield },
    { to: '/provider/jobs', label: 'Jobs', icon: Home },
  ],
};

export default function DashboardLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = navByRole[user?.role] || navByRole.child;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const roleLabels = { parent: 'Parent', child: 'Family Caregiver', provider: 'Service Provider', admin: 'Administrator' };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-lg font-bold text-[#1e3a5f]">CareConnect</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-gray-500">{roleLabels[user?.role]}</span>
            <span className="text-gray-300">|</span>
            <span className="font-medium text-gray-800">{user?.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100" aria-label="Notifications">
              <Bell size={20} className="text-gray-600" />
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg" aria-label="Logout">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:block border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`
                }
              >
                <link.icon size={16} />
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-gray-100 bg-white shadow-lg max-h-[70vh] overflow-y-auto">
            <div className="px-2 py-2 flex flex-col">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/dashboard'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <link.icon size={18} />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {title && <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f] mb-4">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
