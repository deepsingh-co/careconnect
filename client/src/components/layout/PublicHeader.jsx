import { Link } from 'react-router-dom';

export default function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" aria-label="CareConnect Home">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-navy-900">CareConnect</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">Features</Link>
            <Link to="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900">How It Works</Link>
            <Link to="#safety" className="text-sm font-medium text-gray-600 hover:text-gray-900">Safety</Link>
            <Link to="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900">FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/auth/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link to="/auth/register" className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}