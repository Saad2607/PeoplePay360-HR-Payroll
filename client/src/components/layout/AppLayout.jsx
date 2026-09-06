import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Sidebar } from '../common/Sidebar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { X } from 'lucide-react';

/**
 * AppLayout - Main application layout shell.
 * Coordinates sticky top navbar, responsive desktop sidebar, mobile drawer overlay,
 * main scrollable content area, and global logout confirmation.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Route view contents
 */
export const AppLayout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Close mobile drawer automatically when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isMobileMenuOpen]);

  // Handle ESC key for mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <div className="h-screen bg-slate-50 flex flex-col antialiased selection:bg-brand-500 selection:text-white overflow-hidden">
      {/* Top Application Navbar */}
      <Navbar
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar (hidden on screens < 1024px) */}
        <div className="hidden lg:block flex-shrink-0 h-full">
          <Sidebar onLogoutClick={() => setShowLogoutConfirm(true)} />
        </div>

        {/* Mobile / Tablet Navigation Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-over Drawer Panel */}
            <div className="relative flex-1 flex flex-col max-w-xs sm:max-w-sm w-full bg-white shadow-2xl z-50 animate-slide-in-left h-full">
              {/* Close button at top of drawer */}
              <div className="absolute top-2 right-2 pt-2 pr-2 z-10">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar Component inside Drawer */}
              <Sidebar
                onNavigate={() => setIsMobileMenuOpen(false)}
                onLogoutClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full border-r-0 pt-4 h-full"
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full transition-all">
          {children}
        </main>
      </div>

      {/* Global Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          await logout();
        }}
        title="Sign Out of PeoplePay360"
        message="Are you sure you want to end your current session? You will need to log back in to access company data."
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        variant="danger"
      />
    </div>
  );
};
