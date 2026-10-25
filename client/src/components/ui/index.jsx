// Shared reusable UI components

export function Button({ children, variant = 'primary', size = 'md', className = '', disabled, loading, ...props }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-teal-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-teal-600 hover:bg-teal-50 focus:ring-teal-500',
    navy: 'bg-[#1e3a5f] text-white hover:bg-[#162d4a] focus:ring-[#1e3a5f]',
  };
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        className={`w-full px-3 py-2.5 border rounded-lg text-base sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        className={`w-full px-3 py-2.5 border rounded-lg text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
          error ? 'border-red-400' : 'border-gray-300'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Toggle({ checked = false, onChange, disabled = false, 'aria-label': ariaLabel, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-teal-600' : 'bg-gray-300'
      }`}
      {...props}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    teal: 'bg-teal-100 text-teal-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function Alert({ type = 'info', children, className = '' }) {
  const types = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    demo: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  };
  return (
    <div className={`p-3 rounded-lg border text-sm ${types[type]} ${className}`}>
      {children}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      {icon && <div className="text-gray-300 mb-3 flex justify-center">{icon}</div>}
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    requested: { v: 'info', l: 'Requested' },
    accepted: { v: 'teal', l: 'Accepted' },
    in_progress: { v: 'warning', l: 'In Progress' },
    completed: { v: 'success', l: 'Completed' },
    cancelled: { v: 'danger', l: 'Cancelled' },
    failed: { v: 'danger', l: 'Failed' },
    pending: { v: 'warning', l: 'Pending' },
    active: { v: 'success', l: 'Active' },
    draft: { v: 'default', l: 'Draft' },
    placed: { v: 'teal', l: 'Placed' },
    delivered: { v: 'success', l: 'Delivered' },
  };
  const s = map[status] || { v: 'default', l: status };
  return <Badge variant={s.v}>{s.l}</Badge>;
}
