import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, FileText, LayoutDashboard, Calendar, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { isHRManager } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Employees', path: '/employees', icon: Users },
    { label: 'Contracts', path: '/contracts', icon: FileText },
    { label: 'Attendance', path: '/attendance', icon: Clock },
    { label: 'Time Off & Leaves', path: '/timeoff', icon: Calendar },
    { label: 'Payroll & Payruns', path: '/payroll', icon: DollarSign },
  ];

  const integrationItems = [
    { label: 'Attendance', path: '/employees?tab=attendance', icon: Clock, note: 'Krish Module' },
    { label: 'Time Off & Leaves', path: '/employees?tab=timeoff', icon: Calendar, note: 'Krish Module' },
    { label: 'Payruns & Payroll', path: '/contracts', icon: DollarSign, note: 'Engine Connected' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-57px)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Main Management
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3 text-current" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Payroll & HR Modules
          </p>
          <nav className="space-y-1">
            {integrationItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={idx}
                  to={item.path}
                  className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-brand-600" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">
                    {item.note}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Role badge footer */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
        <span className="font-semibold text-slate-700 block mb-0.5">Frontend Integration Role</span>
        <span className="text-slate-500">Jay (Employee & Contract Lead)</span>
      </div>
    </aside>
  );
};
