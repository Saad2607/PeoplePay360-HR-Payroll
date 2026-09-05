import React, { useState } from 'react';
import { AlertCircle, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * ErrorMessage - Enterprise error feedback banner or card with retry actions.
 *
 * @param {Object} props
 * @param {string} [props.title='Error'] - Error title
 * @param {string|Error} props.message - Error message string or Error instance
 * @param {Function} [props.onRetry] - Retry callback function
 * @param {Function} [props.onDismiss] - Dismiss callback function
 * @param {'banner'|'card'|'inline'} [props.variant='banner'] - Display style
 * @param {string} [props.details] - Optional technical details or stack
 * @param {string} [props.className=''] - Additional container classes
 */
export const ErrorMessage = ({
  title = 'An error occurred',
  message,
  onRetry,
  onDismiss,
  variant = 'banner',
  details,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!message) return null;

  const resolvedMessage =
    typeof message === 'object' && message !== null
      ? message.message || 'An unexpected error occurred'
      : String(message);

  if (variant === 'inline') {
    return (
      <div className={`flex items-center text-xs text-rose-600 space-x-1.5 ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="font-medium">{resolvedMessage}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 font-semibold underline hover:text-rose-800"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-rose-200 bg-rose-50/80 p-4 transition-all text-rose-900 ${
        variant === 'card' ? 'shadow-sm p-6' : ''
      } ${className}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            {title && <h4 className="text-sm font-bold text-rose-950">{title}</h4>}
            <p className="text-xs text-rose-800 leading-relaxed break-words">
              {resolvedMessage}
            </p>

            {details && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-[11px] font-semibold text-rose-700 flex items-center hover:underline"
                >
                  {showDetails ? 'Hide technical details' : 'View technical details'}
                  {showDetails ? (
                    <ChevronUp className="w-3 h-3 ml-1" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </button>
                {showDetails && (
                  <pre className="mt-1.5 p-2 rounded-lg bg-rose-100 text-[10px] font-mono text-rose-900 overflow-x-auto whitespace-pre-wrap">
                    {details}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
