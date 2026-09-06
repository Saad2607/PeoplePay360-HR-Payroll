import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  X,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink,
  Clock,
  IndianRupee,
  BarChart3
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Logo } from './Logo';
import { Link } from 'react-router-dom';

/**
 * Navbar - Top enterprise application navigation bar.
 * Contains mobile drawer toggle, branding, user profile dropdown menu,
 * and session controls.
 *
 * @param {Object} props
 * @param {boolean} [props.isMobileMenuOpen=false] - Mobile drawer status
 * @param {Function} [props.onToggleMobileMenu] - Toggle handler for mobile sidebar
 * @param {Function} [props.onLogoutClick] - Handler to prompt logout confirm dialog
 */
export const Navbar = ({
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  onLogoutClick,
}) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left: Mobile menu toggle & Brand */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Brand title */}
          <Link to="/" className="flex items-center group transition-transform">
            <Logo size="md" showText={true} showSubtitle={true} />
          </Link>
        </div>

        {/* Right: User Profile Menu & Controls */}
        <div className="flex items-center space-x-3">
          {/* User Profile Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition text-left"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-500 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>

              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-gray-900 leading-tight max-w-[130px] truncate">
                  {user?.name || 'User Account'}
                </div>
                <div className="text-[11px] text-gray-500 font-medium leading-tight">
                  {user?.role || 'Staff'}
                </div>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in divide-y divide-gray-100">
                {/* User info head */}
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <div className="mt-2.5">
                    <StatusBadge status={user?.role || 'Employee'} size="sm" />
                  </div>
                </div>

                {/* Quick module links */}
                <div className="py-1">
                  {(user?.role === 'Admin' || user?.role === 'HR Manager' || user?.role === 'Employee' || !user?.role) && (
                    <Link
                      to="/employees"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition"
                    >
                      <User className="w-3.5 h-3.5 mr-2.5 text-gray-400" />
                      {user?.role === 'Employee' ? 'My Employee Profile' : 'Employees Directory'}
                    </Link>
                  )}

                  {(user?.role === 'Admin' || user?.role === 'HR Manager' || user?.role === 'Employee' || !user?.role) && (
                    <Link
                      to="/attendance"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition"
                    >
                      <Clock className="w-3.5 h-3.5 mr-2.5 text-gray-400" />
                      Attendance & Hours
                    </Link>
                  )}

                  {(user?.role === 'Admin' || user?.role === 'HR Manager' || user?.role === 'HR Payroll User' || user?.role === 'HR Payroll Manager') && (
                    <Link
                      to="/payroll"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition"
                    >
                      <IndianRupee className="w-3.5 h-3.5 mr-2.5 text-gray-400" />
                      Payroll & Payslips
                    </Link>
                  )}

                  {(user?.role === 'Admin' || user?.role === 'HR Manager' || user?.role === 'HR Payroll User' || user?.role === 'HR Payroll Manager') && (
                    <Link
                      to="/reports"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition"
                    >
                      <BarChart3 className="w-3.5 h-3.5 mr-2.5 text-gray-400" />
                      Audit Reports
                    </Link>
                  )}
                </div>

                {/* Sign out */}
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      if (onLogoutClick) {
                        onLogoutClick();
                      } else {
                        logout();
                      }
                    }}
                    className="w-full flex items-center px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2.5 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
