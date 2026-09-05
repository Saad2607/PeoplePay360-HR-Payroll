import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * PageHeader - Standardized enterprise top header for dashboard & module pages.
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.title - Page heading
 * @param {string|React.ReactNode} [props.subtitle] - Contextual description
 * @param {React.ReactNode} [props.badge] - Optional badge tag next to title
 * @param {Array<{ label: string, href?: string }>} [props.breadcrumbs] - Optional breadcrumbs trail
 * @param {React.ReactNode} [props.actions] - Action buttons / triggers container
 * @param {string} [props.className=''] - Additional container classes
 */
export const PageHeader = ({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  actions,
  className = '',
}) => {
  return (
    <div className={`space-y-2 mb-6 ${className}`}>
      {/* Optional Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1.5 text-xs text-gray-500 mb-1" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                {crumb.href && !isLast ? (
                  <Link
                    to={crumb.href}
                    className="hover:text-brand-600 transition-colors font-medium truncate max-w-[150px]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={`truncate max-w-[200px] ${isLast ? 'text-gray-900 font-semibold' : ''}`}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight truncate">
              {title}
            </h1>
            {badge && <div className="flex-shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 font-normal leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions slot */}
        {actions && (
          <div className="flex items-center flex-wrap gap-2.5 sm:self-center flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
