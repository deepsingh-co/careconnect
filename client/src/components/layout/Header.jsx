import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut, Shield, Heart, Home, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function Header({ showMobileMenu, setShowMobileMenu }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, roles: ['child', 'parent'] },
    { path: '/dashboard/bookings', label: 'Bookings', icon: Shield, roles: ['child', 'parent'] },
    { path: '/dashboard/reminders', label: 'Reminders', icon: Heart, roles: ['child', 'parent'] },
    { path: '/dashboard/emergency', label: 'Emergency', icon: Shield, roles: ['child', 'parent'] },
    { path: '/provider', label: 'My Jobs', icon: Shield, roles: ['provider'] },
    { path: '/admin', label: 'Admin', icon: Settings, roles: ['admin'] },
  ];

  const filteredLinks = navLinks.filter(link => link.roles.includes(user?.role));

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 md:px-6">
      {/* Mobile menu button */}
      <button
        className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        aria-label="Toggle menu"
      >
        {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 text-navy font-bold text-xl">
        <svg className="h-8 w-8 text-teal-600" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 8v8M16 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <span className="hidden sm:block">CareConnect</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {filteredLinks.map(link => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5 inline-block mr-1" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right side - notifications, user menu */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        {user && (
          <div className="relative">
            <button
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 relative"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 font-medium text-navy">Notifications</div>
                <div className="py-2 text-center text-gray-500 text-sm">No new notifications</div>
                <div className="px-4 py-2 border-t border-gray-100">
                  <Link to="/dashboard/notifications" className="text-sm text-teal-600 hover:underline">View all</Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Profile Menu */}
        {user && (
          <div className="relative">
            <button
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="h-5 w-5 text-teal-600" />
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">{user.name}</span>
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-navy">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Settings</Link>
                <hr className="my-2 border-gray-100" />
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}

        {/* Login/Register buttons when not authenticated */}
        {!user && (
          <div className="hidden md:flex items-center gap-2">
            <Link to="/auth/login" className="px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700">Login</Link>
            <Link to="/auth/register" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700">Get Started</Link>
          </div>
        )}
      </div>
    </header>
  );
}