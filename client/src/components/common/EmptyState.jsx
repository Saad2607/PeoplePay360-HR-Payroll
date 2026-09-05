import React from 'react';
import { FolderOpen } from 'lucide-react';

/**
 * EmptyState - Enterprise empty container state for tables, lists, and dashboards.
 *
 * @param {Object} props
 * @param {string} [props.title='No records found'] - Main empty state heading
 * @param {string} [props.description='There are no items matching your criteria.'] - Contextual description
 * @param {string} [props.actionLabel] - Primary action button text
 * @param {Function} [props.onAction] - Primary action callback
 * @param {string} [props.secondaryActionLabel] - Secondary action button text
 * @param {Function} [props.onSecondaryAction] - Secondary action callback
 * @param {React.ElementType} [props.icon=FolderOpen] - Lucide icon component
 * @param {boolean} [props.compact=false] - Compact padding variant
 * @param {React.ReactNode} [props.children] - Optional custom elements
 * @param {string} [props.className=''] - Container classes
 */
export const EmptyState = ({
  title = 'No records found',
  description = 'There are no items matching your criteria.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon: Icon = FolderOpen,
  compact = false,
  children,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-gray-300 my-4 transition-all ${
        compact ? 'p-6' : 'p-10 sm:p-12'
      } ${className}`}
    >
      <div
        className={`rounded-2xl bg-brand-50/80 border border-brand-100 flex items-center justify-center text-brand-600 mb-4 shadow-xs ${
          compact ? 'w-10 h-10' : 'w-14 h-14'
        }`}
      >
        <Icon className={compact ? 'w-5 h-5' : 'w-7 h-7'} />
      </div>

      <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>

      {description && (
        <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {(actionLabel || secondaryActionLabel || children) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-xs transition"
            >
              {secondaryActionLabel}
            </button>
          )}

          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-md shadow-brand-600/20 transition"
            >
              {actionLabel}
            </button>
          )}

          {children}
        </div>
      )}
    </div>
  );
};
