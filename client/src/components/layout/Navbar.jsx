import { Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, LogOut, User, Bell, Shield, Heart, MessageSquare, Home, Users, Settings, LayoutDashboard, Building2, AlertCircle, Truck, Utensils, Pill, Sparkles, Zap, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['child', 'parent'] },
    { path: '/dashboard/bookings', label: 'Bookings', icon: Building2, roles: ['child', 'parent'] },
    { path: '/dashboard/reminders', label: 'Medicines', icon: Pill, roles: ['child', 'parent'] },
    { path: '/dashboard/rides', label: 'Rides', icon: Truck, roles: ['child', 'parent'] },
    { path: '/dashboard/food', label: 'Food', icon: Utensils, roles: ['child', 'parent'] },
    { path: '/dashboard/services', label: 'Services', icon: Sparkles, roles: ['child', 'parent'] },
    { path: '/dashboard/emergency', label: 'Emergency', icon: AlertCircle, roles: ['child', 'parent'] },
    { path: '/dashboard/notifications', label: 'Notifications', icon: Bell, roles: ['child', 'parent'] },
    { path: '/provider', label: 'My Jobs', icon: Building2, roles: ['provider'] },
    { path: '/provider/profile', label: 'Profile', icon: User, roles: ['provider'] },
    { path: '/admin', label: 'Overview', icon: LayoutDashboard, roles: ['admin'] },
    { path: '/admin/users', label: 'Users', icon: Users, roles: ['admin'] },
    { path: '/admin/providers', label: 'Providers', icon: Building2, roles: ['admin'] },
    { path: '/admin/integrations', label: 'Integrations', icon: Settings, roles: ['admin'] },
    { path: '/admin/audit', label: 'Audit Logs', icon: ShieldCheck, roles: ['admin'] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(user?.role));

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2" aria-label="CareConnect Home">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-navy-900 hidden sm:block">CareConnect</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {filteredItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Notifications"
                  aria-expanded={notifOpen}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-teal-700" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700">{user.name}</span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                      <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Settings</Link>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Logout</button>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              {filteredItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                      isActive
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {notifOpen && (
          <div className="absolute right-4 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Notifications</h3>
              <button className="text-sm text-teal-600 hover:underline">Mark all read</button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <div className="p-4 text-center text-gray-500 text-sm">No new notifications</div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}