// Shared reusable UI components — CareConnect accessible care palette

import { useId } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export function Button({ children, variant = 'primary', size = 'md', className = '', disabled, loading, type = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-care-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-care-600 text-white hover:bg-care-700',
    secondary: 'bg-white text-care-800 border border-care-200 hover:bg-care-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    ghost: 'text-care-700 hover:bg-care-50',
    navy: 'bg-care-900 text-white hover:bg-care-950',
  };
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-9',
    md: 'px-4 py-2.5 text-sm min-h-11',
    lg: 'px-6 py-3 text-base min-h-12',
    xl: 'px-8 py-4 text-lg min-h-14',
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-care-800">{label}</label>}
      <input
        id={inputId}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-base text-care-900 transition-colors placeholder:text-care-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-care-500 focus-visible:border-care-400 sm:text-sm ${
          error ? 'border-rose-300 bg-rose-50' : 'border-care-200 bg-white hover:border-care-300'
        } ${className}`}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', id, ...props }) {
  const generatedId = useId();
  const selectId = id || generatedId;
  return (
    <div className="w-full">
      {label && <label htmlFor={selectId} className="mb-1.5 block text-sm font-semibold text-care-800">{label}</label>}
      <select
        id={selectId}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-care-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-care-500 sm:text-sm ${
          error ? 'border-rose-300' : 'border-care-200 hover:border-care-300'
        } ${className}`}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-care-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-care-600' : 'bg-care-200'
      }`}
      {...props}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-2xl border border-care-100 bg-white shadow-[0_1px_2px_rgba(12,74,110,0.04),0_12px_32px_-20px_rgba(12,74,110,0.18)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

const statTones = {
  care: 'bg-care-50 text-care-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  sky: 'bg-sky-50 text-sky-700',
};

export function StatCard({ icon: Icon, label, value, to, tone = 'care', loading = false, hint }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${statTones[tone] || statTones.care}`}>
          <Icon size={21} aria-hidden="true" />
        </span>
        {to && (
          <ArrowUpRight
            size={18}
            aria-hidden="true"
            className="text-care-200 transition-colors group-hover:text-care-500"
          />
        )}
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight text-care-950">
        {loading ? <Skeleton className="h-9 w-14" /> : (value ?? 0)}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-care-600">{label}</p>
      {hint && <p className="mt-1 text-xs text-care-400">{hint}</p>}
    </>
  );

  const classes =
    'group block rounded-2xl border border-care-100 bg-white p-5 shadow-[0_1px_2px_rgba(12,74,110,0.04),0_12px_32px_-20px_rgba(12,74,110,0.18)] transition duration-200 motion-reduce:transition-none';

  if (to) {
    return (
      <Link
        to={to}
        className={`${classes} cursor-pointer hover:-translate-y-0.5 hover:border-care-200 hover:shadow-[0_2px_4px_rgba(12,74,110,0.05),0_18px_40px_-20px_rgba(12,74,110,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-500 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0`}
      >
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-care-50 text-care-700 ring-care-100',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-800 ring-amber-200',
    danger: 'bg-rose-50 text-rose-700 ring-rose-200',
    info: 'bg-sky-50 text-sky-700 ring-sky-200',
    teal: 'bg-care-50 text-care-700 ring-care-200',
    care: 'bg-care-50 text-care-700 ring-care-200',
    purple: 'bg-violet-50 text-violet-700 ring-violet-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

export function Alert({ type = 'info', children, className = '' }) {
  const types = {
    info: 'bg-care-50 border-care-200 text-care-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    demo: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  };
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`rounded-xl border p-3 text-sm ${types[type]} ${className}`}>
      {children}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <span className={`block animate-pulse rounded-lg bg-care-100 ${className}`} aria-hidden="true" />;
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="px-4 py-12 text-center">
      {icon && (
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-care-50 text-care-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-care-900">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-care-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    requested: { v: 'info', l: 'Requested' },
    accepted: { v: 'care', l: 'Accepted' },
    in_progress: { v: 'warning', l: 'In Progress' },
    completed: { v: 'success', l: 'Completed' },
    cancelled: { v: 'danger', l: 'Cancelled' },
    failed: { v: 'danger', l: 'Failed' },
    pending: { v: 'warning', l: 'Pending' },
    active: { v: 'success', l: 'Active' },
    draft: { v: 'default', l: 'Draft' },
    placed: { v: 'care', l: 'Placed' },
    delivered: { v: 'success', l: 'Delivered' },
  };
  const s = map[status] || { v: 'default', l: status };
  return <Badge variant={s.v}>{s.l}</Badge>;
}
