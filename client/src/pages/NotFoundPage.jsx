import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">404 — Page Not Found</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        The page you are trying to access does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition"
      >
        <Home className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>
    </div>
  );
};
