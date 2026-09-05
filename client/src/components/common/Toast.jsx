import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const Toast = ({ type = 'success', message, onClose }) => {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-bounce-short max-w-md ${
        isSuccess ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-rose-600 mr-3 flex-shrink-0" />
      )}
      <div className="flex-1 mr-2">{message}</div>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
