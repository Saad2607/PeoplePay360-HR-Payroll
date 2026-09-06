import React from 'react';

/**
 * PeoplePay360 Brand Logo Component
 * Renders the custom vector 360-orbit 'P' monogram and typography
 * styled with the enterprise palette (Royal Blue #2563eb, Deep Navy #1e3a8a, Indigo #4f46e5).
 *
 * @param {Object} props
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size='md'] - Dimensions scale
 * @param {boolean} [props.showText=true] - Whether to render "PeoplePay360" wordmark
 * @param {boolean} [props.showSubtitle=true] - Whether to render "HR & Payroll" badge
 * @param {boolean} [props.isDark=false] - For dark backgrounds (white/lavender text)
 * @param {string} [props.className=''] - Additional CSS classes
 */
export const Logo = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  isDark = false,
  className = '',
}) => {
  // Dimensions configurations
  const sizeMap = {
    xs: { icon: 'w-6 h-6', text: 'text-base', badge: 'text-[9px] px-1.5 py-0' },
    sm: { icon: 'w-8 h-8', text: 'text-lg', badge: 'text-[10px] px-2 py-0.5' },
    md: { icon: 'w-9 h-9', text: 'text-xl', badge: 'text-[11px] px-2 py-0.5' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', badge: 'text-xs px-2.5 py-0.5' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl', badge: 'text-xs px-3 py-1' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
      {/* Vector Icon Emblem */}
      <div
        className={`${currentSize.icon} rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-600 p-1.5 shadow-md shadow-blue-900/20 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logo-orbit" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </linearGradient>
          </defs>

          {/* 360 Dynamic Orbit Ring */}
          <circle
            cx="50"
            cy="50"
            r="34"
            stroke="url(#logo-orbit)"
            strokeWidth="5"
            strokeDasharray="160 40"
            strokeLinecap="round"
            transform="rotate(-40 50 50)"
          />

          {/* Stylized Modern 'P' Monogram */}
          {/* Vertical Stem */}
          <rect x="35" y="25" width="9" height="50" rx="4.5" fill="#ffffff" />
          {/* Upper Bowl */}
          <path
            d="M 39 25 L 56 25 C 69 25 75 32 75 44 C 75 56 69 63 56 63 L 39 63"
            stroke="#ffffff"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 360 Satellite Nodes */}
          <circle cx="78" cy="27" r="5" fill="#38bdf8" />
          <circle cx="22" cy="73" r="4" fill="#818cf8" opacity="0.9" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span
              className={`font-black tracking-tight leading-none ${currentSize.text} ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              People
              <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>Pay</span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ml-0.5">
                360
              </span>
            </span>

            {showSubtitle && (
              <span
                className={`hidden sm:inline-flex font-bold rounded-md uppercase tracking-wider ${
                  currentSize.badge
                } ${
                  isDark
                    ? 'bg-white/10 text-blue-200 border border-white/20'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                HR &amp; Payroll
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
