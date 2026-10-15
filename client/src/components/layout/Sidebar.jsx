import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, Pill, Truck, Utensils, Sparkles,
  AlertCircle, Bell, Users, Settings, ShieldCheck, Building2 as BuildingIcon,
  LogOut, User, ChevronRight, Heart, MessageSquare, Home, Zap, Shield
} from 'lucide-react';

const roleNavItems = {
  child: [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/dashboard/bookings', label: 'Service Bookings', icon: Building2 },
    { path: '/dashboard/reminders', label: 'Medicine Reminders', icon: Pill },
    { path: '/dashboard/rides', label: 'Ride Requests', icon: Truck },
    { path: '/dashboard/food', label: 'Food Orders', icon: Utensils },
    { path: '/dashboard/services', label: 'Household Services', icon: Sparkles },
    { path: '/dashboard/emergency', label: 'Emergency Alerts', icon: AlertCircle },
    { path: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { path: '/dashboard/family', label: 'Family & Consent', icon: Users },
  ],
  parent: [
    { path: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { path: '/dashboard/bookings', label: 'My Bookings', icon: Building2 },
    { path: '/dashboard/reminders', label: 'My Medicines', icon: Pill },
    { path: '/dashboard/rides', label: 'My Rides', icon: Truck },
    { path: '/dashboard/food', label: 'My Food Orders', icon: Utensils },
    { path: '/dashboard/services', label: 'My Services', icon: Sparkles },
    { path: '/dashboard/profile', label: 'My Profile', icon: User },
    { path: '/dashboard/emergency', label: 'Emergency', icon: AlertCircle },
  ],
  provider: [
    { path: '/provider', label: 'My Jobs', icon: Building2 },
    { path: '/provider/schedule', label: 'Schedule', icon: LayoutDashboard },
    { path: '/provider/profile', label: 'Profile', icon: User },
    { path: '/provider/earnings', label: 'Earnings', icon: Zap },
    { path: '/provider/ratings', label: 'Ratings', icon: ShieldCheck },
  ],
  admin: [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/users', label: 'User Management', icon: Users },
    { path: '/admin/providers', label: 'Providers', icon: BuildingIcon },
    { path: '/admin/bookings', label: 'Booking Oversight', icon: Building2 },
    { path: '/admin/integrations', label: 'Integrations', icon: Settings },
    { path: '/admin/audit', label: 'Audit Logs', icon: ShieldCheck },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const items = roleNavItems[user?.role] || [];

  return (
    <div className="flex h-screen bg-white">
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
          collapsed ? 'w-16' : 'w-64'
        } lg:relative lg:translate-x-0`}
        aria-label="Sidebar navigation"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2" aria-label="CareConnect Home">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-white" />
            </div>
            {!collapsed && <span className="text-xl font-bold text-navy-900">CareConnect</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main menu">
          {items.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account</p>
              </div>
              <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
              <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link to="/profile" className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100" title="Profile"><User className="w-5 h-5" /></Link>
              <Link to="/settings" className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100" title="Settings"><Settings className="w-5 h-5" /></Link>
              <button onClick={logout} className="p-2.5 rounded-lg text-red-500 hover:bg-red-50" title="Logout"><LogOut className="w-5 h-5" /></button>
            </div>
          )}
        </div>
      </aside>

      <main
        className={`flex-1 min-h-screen bg-gray-50 transition-all duration-300 ${
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}