import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users,
  FileText,
  LayoutDashboard,
  Calendar,
  Clock,
  IndianRupee,
  BarChart3,
  Layers,
  Sliders,
  UserCheck,
  LogOut,
  ShieldCheck,
  Shield,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from './StatusBadge';

/**
 * Sidebar - Role-based enterprise sidebar navigation.
 * Dynamically adjusts visible modules based on user role (Admin, HR Manager,
 * HR Payroll User, HR Payroll Manager, Employee).
 *
 * @param {Object} props
 * @param {Function} [props.onNavigate] - Callback when any navigation link is clicked (e.g. to close mobile drawer)
 * @param {Function} [props.onLogoutClick] - Callback to prompt global logout confirmation
 * @param {string} [props.className=''] - Additional container classes
 */
export const Sidebar = ({ onNavigate, onLogoutClick, className = '' }) => {
  const { user } = useAuth();
  const location = useLocation();

  const userRole = user?.role || 'Employee';

  // Navigation definitions based on specification and segregation of duties
  const getNavSections = (role) => {
    switch (role) {
      case 'Admin':
        return [
          {
            title: 'Administration',
            items: [
              { label: 'Admin Console', path: '/', icon: LayoutDashboard },
              { label: 'User & Role Manager', path: '/admin/users', icon: Shield, badge: 'Admin' },
            ],
          },
          {
            title: 'HR Operations',
            items: [
              { label: 'Employees', path: '/employees', icon: Users },
              { label: 'Contracts', path: '/contracts', icon: FileText },
              { label: 'Attendance', path: '/attendance', icon: Clock },
              { label: 'Time Off & Leaves', path: '/timeoff', icon: Calendar },
            ],
          },
          {
            title: 'Payroll & Analytics',
            items: [
              { label: 'Payroll Engine', path: '/payroll', icon: IndianRupee },
              { label: 'Executive Reports', path: '/reports', icon: BarChart3 },
            ],
          },
        ];

      case 'HR Manager':
        return [
          {
            title: 'People & Operations',
            items: [
              { label: 'HR Dashboard', path: '/', icon: LayoutDashboard },
              { label: 'Employees Directory', path: '/employees', icon: Users },
              { label: 'Contracts Management', path: '/contracts', icon: FileText },
              { label: 'Attendance Monitoring', path: '/attendance', icon: Clock },
              { label: 'Time Off & Approvals', path: '/timeoff', icon: Calendar },
            ],
          },
          {
            title: 'Compensation & Analytics',
            items: [
              { label: 'Payroll & Payslips', path: '/payroll', icon: IndianRupee },
              { label: 'HR Reports', path: '/reports', icon: BarChart3 },
            ],
          },
        ];

      case 'HR Payroll User':
        return [
          {
            title: 'Payroll Operations',
            items: [
              { label: 'Payroll Dashboard', path: '/', icon: LayoutDashboard },
              { label: 'Payruns & Workflows', path: '/payroll', icon: IndianRupee },
              { label: 'Payslips Audit', path: '/payroll?tab=payslips', icon: FileText },
              { label: 'Payroll Reports', path: '/reports', icon: BarChart3 },
            ],
          },
          {
            title: 'Workforce Reference',
            items: [
              { label: 'Employee Reference', path: '/employees', icon: Users, badge: 'Read-Only' },
              { label: 'Contract Wages', path: '/contracts', icon: FileText, badge: 'Read-Only' },
              { label: 'Attendance Records', path: '/attendance', icon: Clock, badge: 'Read-Only' },
            ],
          },
        ];

      case 'HR Payroll Manager':
        return [
          {
            title: 'Compensation & Rules',
            items: [
              { label: 'Manager Dashboard', path: '/', icon: LayoutDashboard },
              { label: 'Salary Structures', path: '/payroll?tab=structures', icon: Layers },
              { label: 'Salary Rules', path: '/payroll?tab=structures', icon: Sliders },
              { label: 'Payruns & Approvals', path: '/payroll', icon: IndianRupee },
              { label: 'Financial Reports', path: '/reports', icon: BarChart3 },
            ],
          },
          {
            title: 'Workforce Reference',
            items: [
              { label: 'Employee Directory', path: '/employees', icon: Users, badge: 'Reference' },
              { label: 'Contract Wages', path: '/contracts', icon: FileText, badge: 'Reference' },
            ],
          },
        ];

      case 'Employee':
      default:
        return [
          {
            title: 'Self-Service Portal',
            items: [
              { label: 'My Dashboard', path: '/', icon: LayoutDashboard },
              { label: 'Punch & Attendance', path: '/attendance', icon: Clock },
              { label: 'Leaves & Time Off', path: '/timeoff', icon: Calendar },
              { label: 'My Payslips', path: '/payroll', icon: IndianRupee },
            ],
          },
        ];
    }
  };

  const sections = getNavSections(userRole);

  /**
   * Determine whether a link is currently active, taking query params into account.
   */
  const isItemActive = (path) => {
    const [itemPath, itemQuery] = path.split('?');
    if (location.pathname !== itemPath) return false;

    if (!itemQuery) {
      if (
        location.search &&
        (location.search.includes('tab=payslips') || location.search.includes('tab=structures'))
      ) {
        return false;
      }
      return true;
    }

    return location.search.includes(itemQuery);
  };

  return (
    <aside
      className={`w-64 bg-white border-r border-gray-200 h-full min-h-[calc(100vh-57px)] flex flex-col justify-between p-4 ${className}`}
    >
      <div className="space-y-6 overflow-y-auto pr-1">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 select-none">
              {section.title}
            </p>
            <nav className="space-y-1">
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                const active = isItemActive(item.path);

                return (
                  <Link
                    key={`${item.path}-${idx}`}
                    to={item.path}
                    onClick={() => onNavigate && onNavigate()}
                    className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition duration-150 ${
                      active
                        ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs'
                        : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center truncate">
                      <Icon
                        className={`w-5 h-5 mr-3 flex-shrink-0 ${
                          active ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono font-normal">
                          {item.badge}
                        </span>
                      )}
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-600 flex-shrink-0" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Role Profile & Session Card */}
      <div className="pt-4 mt-auto border-t border-gray-100 space-y-3">
        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">
              {user?.name || 'Authorized User'}
            </p>
            <div className="mt-1">
              <StatusBadge status={userRole} size="sm" />
            </div>
          </div>

          <button
            type="button"
            onClick={onLogoutClick}
            aria-label="Sign out"
            title="Sign out of PeoplePay360"
            className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center">
            <ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" /> Secure Session
          </span>
          <span className="font-mono">v1.0</span>
        </div>
      </div>
    </aside>
  );
};
