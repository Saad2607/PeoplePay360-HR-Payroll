import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, ShieldCheck } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
            PeoplePay360
          </span>
          <span className="px-2 py-0.5 text-xs font-semibold bg-brand-50 text-brand-700 rounded-md border border-brand-100">
            HR & Payroll System
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 text-right">
            <div>
              <div className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</div>
              <div className="text-xs text-gray-500 flex items-center justify-end space-x-1">
                <ShieldCheck className="w-3 h-3 text-brand-600" />
                <span>{user?.role}</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm border border-brand-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
