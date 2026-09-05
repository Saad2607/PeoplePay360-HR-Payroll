import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ label = 'Loading...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="w-6 h-6 text-brand-600 animate-spin mr-2" />
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
};
