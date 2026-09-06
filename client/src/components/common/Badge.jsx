import React from 'react';
import { StatusBadge } from './StatusBadge';

export { StatusBadge };

const colorVariants = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Probation: 'bg-amber-50 text-amber-700 border-amber-200',
  'On Leave': 'bg-brand-50 text-brand-700 border-brand-200',
  Terminated: 'bg-rose-50 text-rose-700 border-rose-200',
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Expired: 'bg-amber-50 text-amber-700 border-amber-200',
  'Full-Time': 'bg-brand-50 text-brand-700 border-brand-200',
  'Part-Time': 'bg-slate-100 text-slate-700 border-slate-200',
  Contract: 'bg-brand-50 text-brand-700 border-brand-200',
  Intern: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const Badge = ({ children, status = '', className = '', size = 'md', showDot = true }) => {
  // If custom colorVariants match, preserve exact styling; otherwise use StatusBadge
  const rawKey = status || (typeof children === 'string' ? children : '');
  if (rawKey && !colorVariants[rawKey]) {
    return (
      <StatusBadge status={status} size={size} showDot={showDot} className={className}>
        {children}
      </StatusBadge>
    );
  }

  const variantClass =
    colorVariants[status] ||
    (typeof children === 'string' && colorVariants[children]) ||
    'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClass} ${className}`}
    >
      {showDot && <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75" />}
      {children || status}
    </span>
  );
};
