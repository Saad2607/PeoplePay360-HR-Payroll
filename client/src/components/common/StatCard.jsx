import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const colorThemes = {
  brand: {
    iconBg: 'bg-brand-50 text-brand-600',
    borderHover: 'hover:border-brand-300',
    valueText: 'text-gray-900',
    badgeText: 'text-brand-600',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    borderHover: 'hover:border-emerald-300',
    valueText: 'text-emerald-700',
    badgeText: 'text-emerald-600',
  },
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600',
    borderHover: 'hover:border-indigo-300',
    valueText: 'text-indigo-700',
    badgeText: 'text-indigo-600',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600',
    borderHover: 'hover:border-amber-300',
    valueText: 'text-amber-700',
    badgeText: 'text-amber-600',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600',
    borderHover: 'hover:border-rose-300',
    valueText: 'text-rose-700',
    badgeText: 'text-rose-600',
  },
  cyan: {
    iconBg: 'bg-cyan-50 text-cyan-600',
    borderHover: 'hover:border-cyan-300',
    valueText: 'text-cyan-700',
    badgeText: 'text-cyan-600',
  },
};

/**
 * StatCard - Metric display card for dashboard analytics & summary widgets.
 *
 * @param {Object} props
 * @param {string} props.title - Metric title / label
 * @param {string|number} props.value - Metric main numeric or text value
 * @param {React.ElementType} [props.icon] - Lucide Icon component
 * @param {Object} [props.trend] - Trend data { value: '+5.2%', isPositive: true, label: 'vs last month' }
 * @param {'brand'|'emerald'|'indigo'|'amber'|'rose'|'cyan'} [props.color='brand'] - Color theme
 * @param {string} [props.link] - Optional route to navigate to on card click or link button
 * @param {string} [props.linkLabel] - Label for the link button
 * @param {boolean} [props.loading=false] - Skeleton loading state
 * @param {string} [props.description] - Additional small context text
 * @param {string} [props.className=''] - Additional CSS classes
 */
export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'brand',
  link,
  linkLabel,
  loading = false,
  description,
  className = '',
}) => {
  const theme = colorThemes[color] || colorThemes.brand;

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-pulse space-y-4 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    );
  }

  return (
    <div
      className={`bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all duration-200 flex flex-col justify-between ${theme.borderHover} ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {title}
          </span>
          {Icon && (
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform ${theme.iconBg}`}
            >
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold tracking-tight ${theme.valueText}`}>
            {value}
          </span>

          {trend && (
            <span
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trend.value}
            </span>
          )}
        </div>

        {trend?.label && (
          <p className="text-xs text-gray-400 mt-1 font-medium">{trend.label}</p>
        )}

        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {link && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link
            to={link}
            className={`inline-flex items-center text-xs font-semibold hover:underline group ${theme.badgeText}`}
          >
            <span>{linkLabel || 'View details'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
