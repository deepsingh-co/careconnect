import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import {
  Bell, Menu, X, LayoutDashboard, Pill, Briefcase, Car, UtensilsCrossed,
  Users, HeartPulse, Shield, Settings, LogOut, ChevronRight, ShieldCheck,
} from 'lucide-react';

const navByRole = {
  child: [
    {
      heading: 'Overview',
      items: [{ to: '/dashboard', label: 'Home', icon: LayoutDashboard }],
    },
    {
      heading: 'Care',
      items: [
        { to: '/reminders', label: 'Reminders', icon: Pill },
        { to: '/bookings', label: 'Bookings', icon: Briefcase },
        { to: '/rides', label: 'Rides', icon: Car },
        { to: '/food', label: 'Food', icon: UtensilsCrossed },
      ],
    },
    {
      heading: 'Family',
      items: [
        { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
        { to: '/family', label: 'Family', icon: Users },
        { to: '/emergency', label: 'Emergency', icon: HeartPulse, tone: 'danger' },
        { to: '/notifications', label: 'Alerts', icon: Bell },
      ],
    },
  ],
  provider: [
    {
      heading: 'Workspace',
      items: [{ to: '/provider/jobs', label: 'My Jobs', icon: LayoutDashboard }],
    },
    {
      heading: 'Account',
      items: [{ to: '/provider/profile', label: 'Profile', icon: Settings }],
    },
  ],
  admin: [
    {
      heading: 'Overview',
      items: [{ to: '/admin', label: 'Overview', icon: LayoutDashboard }],
    },
    {
      heading: 'Manage',
      items: [
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/providers', label: 'Providers', icon: Briefcase },
        { to: '/provider/jobs', label: 'Jobs', icon: LayoutDashboard },
      ],
    },
    {
      heading: 'System',
      items: [
        { to: '/admin/integrations', label: 'Integrations', icon: Settings },
        { to: '/admin/audit', label: 'Audit Log', icon: Shield },
      ],
    },
  ],
};

const roleLabels = {
  parent: 'Parent',
  child: 'Family Caregiver',
  provider: 'Service Provider',
  admin: 'Administrator',
};

const exactRoutes = ['/dashboard', '/admin', '/provider/jobs'];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'CC';
}

function SidebarPanel({ links, user, roleLabel, onNavigate, onLogout, showClose, closeButtonRef, onClose }) {
  return (
    <>
      <div className="flex h-20 shrink-0 items-center gap-3 px-5">
        <Link to="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
          <Logo size={38} />
          <span className="text-xl font-bold tracking-tight text-care-950">CareConnect</span>
        </Link>
        {showClose && (
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="ml-auto grid h-11 w-11 place-items-center rounded-xl text-care-600 transition-colors hover:bg-care-50 hover:text-care-900"
            aria-label="Close navigation"
          >
            <X size={22} />
          </button>
        )}
      </div>

      <div className="px-4 pb-3">
        <p className="rounded-xl bg-care-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-care-600">
          {roleLabel}
        </p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6" aria-label="Dashboard navigation">
        {links.map((group) => (
          <div key={group.heading}>
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-care-400">
              {group.heading}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={exactRoutes.includes(item.to)}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-care-50 text-care-800 before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-care-600 before:content-['']"
                        : 'text-care-600 hover:bg-care-50/70 hover:text-care-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={19}
                        aria-hidden="true"
                        className={item.tone === 'danger' && !isActive ? 'text-rose-500' : undefined}
                      />
                      <span>{item.label}</span>
                      {item.tone === 'danger' && (
                        <span className="ml-auto rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600">
                          112
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-care-100 p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-care-50/70 p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-care-600 text-sm font-bold text-white">
            {initials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-care-900" title={user?.name}>{user?.name || 'CareConnect user'}</p>
            <p className="truncate text-xs text-care-500">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-care-500 transition-colors hover:bg-white hover:text-rose-600"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeButtonRef = useRef(null);

  const links = navByRole[user?.role] || navByRole.child;
  const roleLabel = roleLabels[user?.role] || 'Family Caregiver';
  const canUseCarePages = ['child', 'admin'].includes(user?.role);

  const activeItem = links
    .flatMap((group) => group.items)
    .filter((item) =>
      exactRoutes.includes(item.to)
        ? location.pathname === item.to
        : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
    )
    .sort((a, b) => b.to.length - a.to.length)[0];

  const today = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleNavigate = () => setMobileOpen(false);

  return (
    <div className="dashboard-canvas min-h-screen">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-care-800 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-care-500"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-care-100 bg-white lg:flex"
        aria-label="Sidebar navigation"
      >
        <SidebarPanel
          links={links}
          user={user}
          roleLabel={roleLabel}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile navigation drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-care-950/40 transition-opacity duration-200 motion-reduce:transition-none ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleNavigate}
          aria-hidden="true"
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col bg-white shadow-2xl transition-transform duration-200 motion-reduce:transition-none ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-label="Mobile navigation"
          role="dialog"
          aria-modal="true"
        >
          <SidebarPanel
            links={links}
            user={user}
            roleLabel={roleLabel}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            showClose
            closeButtonRef={closeButtonRef}
            onClose={handleNavigate}
          />
        </aside>
      </div>

      <div className="lg:pl-72" inert={mobileOpen}>
        <header className="sticky top-0 z-30 border-b border-care-100 bg-white/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-xl text-care-700 transition-colors hover:bg-care-50 lg:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
            >
              <Menu size={22} />
            </button>

            <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
              <Logo size={28} />
              <span className="font-bold text-care-950">CareConnect</span>
            </Link>

            <div className="hidden items-center gap-2 text-sm lg:flex" aria-hidden="true">
              <span className="font-medium text-care-400">CareConnect</span>
              <ChevronRight size={14} className="text-care-300" />
              <span className="font-semibold text-care-900">{activeItem?.label || 'Dashboard'}</span>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <span className="mr-2 hidden text-sm font-medium text-care-400 xl:block">{today}</span>

              {canUseCarePages && (
                <Link
                  to="/notifications"
                  className="grid h-11 w-11 place-items-center rounded-xl text-care-600 transition-colors hover:bg-care-50 hover:text-care-800"
                  aria-label="View notifications"
                >
                  <Bell size={20} />
                </Link>
              )}

              {canUseCarePages && (
                <span className="hidden h-8 w-px bg-care-100 sm:block" aria-hidden="true" />
              )}

              <div className="hidden items-center gap-2.5 pl-1 sm:flex">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-care-100 text-xs font-bold text-care-700">
                  {initials(user?.name)}
                </span>
                <div className="hidden md:block">
                  <p className="max-w-[12rem] truncate text-sm font-semibold text-care-900">{user?.name}</p>
                  <p className="text-xs text-care-500">{roleLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main id="dashboard-main" className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {title && (
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-care-950 sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-care-600 sm:text-base">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
