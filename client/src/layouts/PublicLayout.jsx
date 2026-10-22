import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from '../components/Logo';

const navLinks = [
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/#features', label: 'Features' },
  { to: '/#safety', label: 'Safety' },
  { to: '/#faq', label: 'FAQ' },
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="bg-[#1e3a5f] text-white text-center text-sm py-2 px-4">
        CareConnect coordinates care — it does not replace emergency services. For emergencies, call 112.
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" aria-label="CareConnect home">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map((l) => (
              <a key={l.label} href={l.to} className="text-gray-600 hover:text-[#0d9488] text-sm font-medium transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth/login" className="text-sm font-medium text-gray-700 hover:text-[#0d9488] px-3 py-2">
              Sign in
            </Link>
            <Link
              to="/auth/register"
              className="text-sm font-medium bg-[#0d9488] text-white px-4 py-2 rounded-lg hover:bg-[#0f766e] transition-colors"
            >
              Get started
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.to}
                onClick={() => setMobileOpen(false)}
                className="block text-gray-700 font-medium py-2"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-gray-200 flex gap-3">
              <Link to="/auth/login" className="flex-1 text-center border border-gray-300 rounded-lg py-2 text-sm font-medium">
                Sign in
              </Link>
              <Link to="/auth/register" className="flex-1 text-center bg-[#0d9488] text-white rounded-lg py-2 text-sm font-medium">
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <div className="text-xl font-bold">
                  Care<span className="text-[#2dd4bf]">Connect</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                WhatsApp-based coordination for families caring for elderly parents living independently.
              </p>
            </div>
            <div>
              <div className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">Product</div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="/#how-it-works" className="hover:text-white">How it works</a></li>
                <li><a href="/#features" className="hover:text-white">Features</a></li>
                <li><a href="/#safety" className="hover:text-white">Safety & privacy</a></li>
                <li><a href="/#faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">Account</div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/auth/login" className="hover:text-white">Sign in</Link></li>
                <li><Link to="/auth/register" className="hover:text-white">Create account</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">Legal & Contact</div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><a href="mailto:support@careconnect.health" className="hover:text-white">support@careconnect.health</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 text-xs text-gray-400 space-y-2">
            <p>
              © {new Date().getFullYear()} CareConnect. Demo application for hackathon purposes.
            </p>
            <p>
              CareConnect does not diagnose, treat, prescribe, or replace professional medical care or emergency services.
              Always consult qualified healthcare professionals for medical decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
