import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  '3xl': 'max-w-6xl',
  full: 'max-w-full m-4',
};

/**
 * Modal - Enhanced accessible modal dialogue with responsive sizes,
 * subtitle support, header actions, and optional sticky footer.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visibility status
 * @param {Function} props.onClose - Close callback
 * @param {string|React.ReactNode} props.title - Modal title
 * @param {string|React.ReactNode} [props.subtitle] - Contextual subtitle
 * @param {React.ReactNode} props.children - Modal content body
 * @param {React.ReactNode} [props.footer] - Optional footer action buttons
 * @param {string} [props.maxWidth] - Custom maxWidth (legacy compatibility)
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'full'} [props.size] - Sizing preset
 * @param {boolean} [props.closeOnBackdropClick=true] - Backdrop click closes modal
 * @param {string} [props.className=''] - Additional container classes
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth,
  size = 'lg',
  closeOnBackdropClick = true,
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    // Lock body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolvedWidth = maxWidth || sizeMap[size] || 'max-w-2xl';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-gray-100 w-full ${resolvedWidth} transform transition-all overflow-hidden max-h-[92vh] flex flex-col ${className}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-slate-50/70">
          <div className="pr-4">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-gray-100 bg-slate-50/70 flex items-center justify-end gap-3 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
