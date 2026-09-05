import React from 'react';
import { FolderOpen } from 'lucide-react';

export const EmptyState = ({ title = 'No records found', description = 'There are no items matching your criteria.', actionLabel, onAction, icon: Icon = FolderOpen }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-gray-300 my-4">
      <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
