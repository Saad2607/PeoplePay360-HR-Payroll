import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeApi } from '../../api/employeeApi';
import { contractApi } from '../../api/contractApi';
import { departmentApi } from '../../api/departmentApi';
import { payrunApi } from '../../api/payrunApi';
import { authApi } from '../../api/authApi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Toast } from '../common/Toast';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  FileText,
  IndianRupee,
  Building2,
  Settings,
  UserCheck,
  UserX,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Organization-wide stats
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeContracts: 0,
    totalDepartments: 0,
    totalPayrollDisbursed: 0,
  });

  // Users data
  const [usersList, setUsersList] = useState([]);
  const [roleCounts, setRoleCounts] = useState({});

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [empRes, ctrRes, deptRes, prRes, usrRes] = await Promise.all([
        employeeApi.getAll({ limit: 1 }),
        contractApi.getAll({ status: 'Active', limit: 1 }),
        departmentApi.getAll(),
        payrunApi.getAll({ limit: 20 }).catch(() => ({ data: [] })),
        authApi.getUsers({ limit: 10 }).catch(() => ({ data: [] }))
      ]);

      const payruns = prRes.data || [];
      const totalDisbursed = payruns.filter(p => p.status === 'Paid').reduce((acc, p) => acc + (p.totalNet ?? p.totalNetPay ?? 0), 0);

      setStats({
        totalEmployees: empRes.meta?.total || empRes.data?.length || 0,
        activeContracts: ctrRes.meta?.total || ctrRes.data?.length || 0,
        totalDepartments: deptRes.data?.length || 0,
        totalPayrollDisbursed: totalDisbursed,
      });

      const users = usrRes.data || [];
      setUsersList(users);

      // Compute role breakdown
      const counts = {};
      users.forEach((u) => {
        counts[u.role] = (counts[u.role] || 0) + 1;
      });
      setRoleCounts(counts);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setToast({ message: 'Error loading admin dashboard metrics', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await authApi.updateUserRole(userId, newRole);
      setToast({ message: 'User role updated successfully', type: 'success' });
      fetchAdminData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to update user role', type: 'error' });
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await authApi.toggleUserStatus(userId, !currentStatus);
      setToast({
        message: `User account ${!currentStatus ? 'activated' : 'deactivated'}`,
        type: 'success'
      });
      fetchAdminData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to change account status', type: 'error' });
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading Enterprise Super-Admin Dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Admin Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-sky-300 text-xs font-semibold border border-white/15 backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 mr-1 text-sky-400" /> Enterprise Super-Admin Console
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Company Administration: Welcome, {user?.name}!
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Universal system control across Human Resources, Payroll Engines, User Permissions, and Organization Architecture.
            </p>
          </div>

          <Link
            to="/admin/users"
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-white text-slate-900 font-bold text-sm shadow-md hover:bg-slate-50 transition"
          >
            <Users className="w-5 h-5 mr-2 text-brand-600" />
            Manage System Users
          </Link>
        </div>
      </div>

      {/* Enterprise KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Headcount</span>
            <div className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalEmployees}</div>
            <Link to="/employees" className="text-xs text-brand-600 font-semibold hover:underline flex items-center mt-2">
              HR Directory →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Contracts</span>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.activeContracts}</div>
            <Link to="/contracts" className="text-xs text-emerald-600 font-semibold hover:underline flex items-center mt-2">
              Contracts Console →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Disbursed</span>
            <div className="text-3xl font-extrabold text-purple-600 mt-1">
              ₹{stats.totalPayrollDisbursed.toLocaleString('en-IN')}
            </div>
            <Link to="/payroll" className="text-xs text-purple-600 font-semibold hover:underline flex items-center mt-2">
              Payroll Workflows →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Departments</span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">{stats.totalDepartments}</div>
            <span className="text-xs text-gray-400 block mt-2">Active Org Units</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Role Distribution Pill Cards */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
          <Settings className="w-4 h-4 mr-2 text-brand-600" />
          Active System User Distribution by Role
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Admins', role: 'Admin', color: 'bg-slate-900 text-white border-slate-800' },
            { label: 'HR Managers', role: 'HR Manager', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Payroll Managers', role: 'HR Payroll Manager', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
            { label: 'Payroll Users', role: 'HR Payroll User', color: 'bg-sky-50 text-sky-700 border-sky-200' },
            { label: 'Employees', role: 'Employee', color: 'bg-slate-100 text-slate-700 border-slate-200' },
          ].map((item, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${item.color} flex flex-col justify-between`}>
              <span className="text-xs font-bold">{item.label}</span>
              <div className="text-2xl font-extrabold mt-2">
                {roleCounts[item.role] || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Management Quick Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-brand-600" />
              System Users & Role Switcher
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Instantly assign role permissions to any registered user.
            </p>
          </div>
          <Link
            to="/admin/users"
            className="text-xs font-semibold text-brand-600 hover:underline flex items-center"
          >
            Full User Manager <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold border-b">
              <tr>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersList.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-gray-900">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </td>
                  <td className="py-3 px-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 font-semibold bg-white text-gray-800 shadow-sm focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="Employee">Employee</option>
                      <option value="HR Manager">HR Manager</option>
                      <option value="HR Payroll User">HR Payroll User</option>
                      <option value="HR Payroll Manager">HR Payroll Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {u.isActive !== false ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(u._id, u.isActive !== false)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        u.isActive !== false
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {u.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
