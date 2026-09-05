import React from 'react';

const colorVariants = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Probation: 'bg-amber-50 text-amber-700 border-amber-200',
  'On Leave': 'bg-blue-50 text-blue-700 border-blue-200',
  Terminated: 'bg-rose-50 text-rose-700 border-rose-200',
  Draft: 'bg-slate-100 text-slate-700 border-slate-300',
  Expired: 'bg-orange-50 text-orange-700 border-orange-200',
  'Full-Time': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Part-Time': 'bg-purple-50 text-purple-700 border-purple-200',
  Contract: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Intern: 'bg-teal-50 text-teal-700 border-teal-200',
};

export const Badge = ({ children, status = '', className = '' }) => {
  const variantClass = colorVariants[status] || colorVariants[children] || 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75" />
      {children || status}
    </span>
  );
};
