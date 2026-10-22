import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';

export function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[#1e3a5f] mb-2">{title}</h2>
      <div className="space-y-3 text-sm sm:text-base">{children}</div>
    </section>
  );
}

export default function InfoPageLayout({ title, subtitle, updated, children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" aria-label="CareConnect home">
            <Logo size={32} />
            <span className="text-lg font-bold text-[#1e3a5f]">CareConnect</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/auth/login" className="text-sm font-medium text-gray-700 hover:text-teal-700 px-2 py-2">
              Sign in
            </Link>
            <Link
              to="/auth/register"
              className="text-sm font-medium bg-teal-600 text-white px-3.5 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link to="/" className="text-sm text-teal-700 hover:underline">← Back to home</Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1e3a5f] mt-4">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
        {updated && <p className="text-xs sm:text-sm text-gray-400 mt-2">Last updated: {updated}</p>}
        <div className="mt-8 space-y-8 text-gray-700 leading-relaxed">{children}</div>
      </main>

      <footer className="bg-[#162d4a] text-gray-300">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-sm">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 mb-4" aria-label="Footer">
            <Link to="/about" className="hover:text-white">About Us</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <a href="mailto:support@careconnect.health" className="hover:text-white">support@careconnect.health</a>
          </nav>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} CareConnect. CareConnect does not diagnose, treat or provide emergency services —
            in a medical emergency, call 112 immediately.
          </p>
        </div>
      </footer>
    </div>
  );
}
