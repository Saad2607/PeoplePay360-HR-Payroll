import React, { useState } from 'react';
import { AlertTriangle, Trash2, CheckCircle2, Loader2, Info } from 'lucide-react';
import { Modal } from './Modal';

const variantConfig = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-rose-100 text-rose-600',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 text-amber-600',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
  },
  primary: {
    icon: CheckCircle2,
    iconBg: 'bg-brand-100 text-brand-600',
    confirmBtn: 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 text-blue-600',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
  },
};

/**
 * ConfirmDialog - Enterprise modal dialog for irreversible or high-impact actions
 * (e.g. employee termination, contract revocation, time off rejection, payrun submission).
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visibility status
 * @param {Function} props.onClose - Cancel / close callback
 * @param {Function} props.onConfirm - Confirm action callback (can return a Promise)
 * @param {string} props.title - Dialog headline
 * @param {string|React.ReactNode} props.message - Descriptive warning/message
 * @param {string} [props.confirmText='Confirm'] - Confirm button text
 * @param {string} [props.cancelText='Cancel'] - Cancel button text
 * @param {'danger'|'warning'|'primary'|'info'} [props.variant='danger'] - Visual style
 * @param {boolean} [props.loading] - Controlled loading state
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Please confirm to proceed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading: externalLoading,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  const config = variantConfig[variant] || variantConfig.danger;
  const Icon = config.icon;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isLoading && onClose()}
      size="sm"
      closeOnBackdropClick={!isLoading}
    >
      <div className="text-center sm:text-left space-y-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}
          >
            <Icon className="w-6 h-6" />
          </div>

          <div className="space-y-1.5 flex-1">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <div className="text-sm text-gray-500 leading-relaxed">{message}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl shadow-md transition disabled:opacity-50 ${config.confirmBtn}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
