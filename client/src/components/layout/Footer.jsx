import { Link } from 'react-router-dom';
import { Heart, Twitter, Facebook, Instagram, Linkedin, Mail, Phone, MapPin, Shield, Users, HeartPulse, Globe } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Integrations', href: '#integrations' },
      { label: 'API Docs', href: '/api-docs' },
      { label: 'Changelog', href: '#changelog' },
    ],
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'Careers', href: '#careers' },
      { label: 'Blog', href: '#blog' },
      { label: 'Press', href: '#press' },
      { label: 'Contact', href: '/contact' },
    ],
    resources: [
      { label: 'Help Center', href: '/help' },
      { label: 'Documentation', href: '/docs' },
      { label: 'Community', href: '#community' },
      { label: 'Webinars', href: '#webinars' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
    support: [
      { label: 'For Families', href: '#families' },
      { label: 'For Providers', href: '#providers' },
      { label: 'Safety Center', href: '#safety' },
      { label: 'Accessibility', href: '#accessibility' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-navy-900 text-gray-300" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4" aria-label="CareConnect Home">
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CareConnect</span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-xs">
              WhatsApp-based smart elderly care & healthcare coordination platform.
              Helping families care for aging parents with dignity, safety, and peace of mind.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center text-gray-400 hover:bg-teal-600 hover:text-white transition-colors"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.product.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="text-gray-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.company.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="text-gray-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.resources.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="text-gray-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.support.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="text-gray-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-navy-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h4 className="text-white font-medium">Privacy First</h4>
                <p className="text-gray-400 text-sm">End-to-end encryption & consent-based sharing</p>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h4 className="text-white font-medium">Family Centered</h4>
                <p className="text-gray-400 text-sm">Built for caregivers, by caregivers</p>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <HeartPulse className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h4 className="text-white font-medium">Healthcare Focused</h4>
                <p className="text-gray-400 text-sm">Medication reminders & wellness tracking</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-navy-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} CareConnect. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}