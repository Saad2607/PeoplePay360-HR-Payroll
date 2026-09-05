import React from 'react';
import { Loader2 } from 'lucide-react';

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

/**
 * LoadingSpinner - Accessible indicator for pending asynchronous states.
 *
 * @param {Object} props
 * @param {string} [props.label='Loading...'] - Text label to accompany the spinner
 * @param {boolean} [props.fullScreen=false] - Full viewport height container
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md'] - Spinner dimensions
 * @param {boolean} [props.inline=false] - Inline rendering without container padding
 * @param {boolean} [props.overlay=false] - Fixed or absolute backdrop overlay
 * @param {string} [props.className=''] - Additional container classes
 */
export const LoadingSpinner = ({
  label = 'Loading...',
  fullScreen = false,
  size = 'md',
  inline = false,
  overlay = false,
  className = '',
}) => {
  const iconSize = sizeMap[size] || sizeMap.md;

  if (overlay) {
    return (
      <div
        className={`absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center z-40 rounded-inherit ${className}`}
        role="status"
        aria-live="polite"
      >
        <Loader2 className={`${iconSize} text-brand-600 animate-spin mb-2`} />
        {label && <p className="text-xs font-semibold text-gray-700">{label}</p>}
      </div>
    );
  }

  if (fullScreen) {
    return (
      <div
        className={`min-h-[400px] flex flex-col items-center justify-center p-8 ${className}`}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-3" />
        {label && <p className="text-sm font-medium text-gray-600">{label}</p>}
      </div>
    );
  }

  if (inline) {
    return (
      <span
        className={`inline-flex items-center space-x-2 ${className}`}
        role="status"
        aria-live="polite"
      >
        <Loader2 className={`${iconSize} text-current animate-spin`} />
        {label && <span className="text-xs text-current font-medium">{label}</span>}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center justify-center p-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={`${iconSize} text-brand-600 animate-spin mr-2`} />
      {label && <span className="text-sm text-gray-500 font-medium">{label}</span>}
    </div>
  );
};
