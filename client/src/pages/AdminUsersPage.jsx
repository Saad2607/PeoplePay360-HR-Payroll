import React, { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Toast } from '../components/common/Toast';
import { PageHeader } from '../components/common/PageHeader';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';

export const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authApi.getUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter !== '' ? statusFilter : undefined,
        page,
        limit: 10,
      });
      setUsers(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch user directory', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, page]);

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser?._id && newRole !== 'Admin') {
      if (!window.confirm('Warning: Demoting yourself from Admin will remove your access to this console. Continue?')) {
        return;
      }
    }

    try {
      await authApi.updateUserRole(userId, newRole);
      setToast({ message: `Role updated to ${newRole}`, type: 'success' });
      fetchUsers();
    } catch (err) {
      setToast({ message: err.message || 'Failed to update role', type: 'error' });
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    if (userId === currentUser?._id) {
      setToast({ message: 'You cannot deactivate your own administrative account.', type: 'error' });
      return;
    }

    try {
      await authApi.toggleUserStatus(userId, !currentStatus);
      setToast({
        message: `Account ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        type: 'success'
      });
      fetchUsers();
    } catch (err) {
      setToast({ message: err.message || 'Failed to update account status', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Header */}
      <PageHeader
        title="System User & Role Administration"
        subtitle="Manage authenticated accounts, assign organizational roles, and enforce security policies."
        breadcrumbs={[
          { label: 'Admin Console', href: '/' },
          { label: 'User Directory' },
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="HR Manager">HR Manager</option>
            <option value="HR Payroll Manager">HR Payroll Manager</option>
            <option value="HR Payroll User">HR Payroll User</option>
            <option value="Employee">Employee</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner label="Loading user directory..." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Linked Employee</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => {
                    const isSelf = u._id === currentUser?._id;
                    const isActive = u.isActive !== false;

                    return (
                      <tr key={u._id} className="hover:bg-gray-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-mono">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-gray-600">
                          {u.employee ? (
                            <div>
                              <div className="text-xs font-semibold text-gray-900">
                                {u.employee.name} ({u.employee.employeeId})
                              </div>
                              <div className="text-[11px] text-gray-500">
                                {u.employee.department?.name || 'Dept'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Not Linked</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 font-semibold bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="Employee">Employee</option>
                            <option value="HR Manager">HR Manager</option>
                            <option value="HR Payroll User">HR Payroll User</option>
                            <option value="HR Payroll Manager">HR Payroll Manager</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-500">
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Never logged in'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(u._id, isActive)}
                            disabled={isSelf}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-30 ${
                              isActive
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {users.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-400 text-sm">
                        No users found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Showing page {meta.page} of {meta.totalPages} ({meta.total} total accounts)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page >= meta.totalPages}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
