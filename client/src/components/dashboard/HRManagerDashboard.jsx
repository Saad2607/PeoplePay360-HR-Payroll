import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeApi } from '../../api/employeeApi';
import { contractApi } from '../../api/contractApi';
import { departmentApi } from '../../api/departmentApi';
import { attendanceApi } from '../../api/attendanceApi';
import { timeOffRequestApi } from '../../api/timeOffRequestApi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Toast } from '../common/Toast';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calendar,
  IndianRupee,
  BarChart3
} from 'lucide-react';

export const HRManagerDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeContracts: 0,
    totalDepartments: 0,
    missingCheckoutsCount: 0,
  });

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchHRStats = async () => {
    setLoading(true);
    try {
      const [empRes, ctrRes, deptRes, missRes, leaveRes] = await Promise.all([
        employeeApi.getAll({ limit: 5 }),
        contractApi.getAll({ status: 'Active' }),
        departmentApi.getAll(),
        attendanceApi.getMissingCheckouts().catch(() => ({ data: [] })),
        timeOffRequestApi.getAll({ status: 'Pending', limit: 5 }).catch(() => ({ data: [] }))
      ]);

      setStats({
        totalEmployees: empRes.meta?.total || empRes.data?.length || 0,
        activeContracts: ctrRes.meta?.total || ctrRes.data?.length || 0,
        totalDepartments: deptRes.data?.length || 0,
        missingCheckoutsCount: missRes.data?.length || 0,
      });

      setRecentEmployees(empRes.data || []);
      setPendingLeaves(leaveRes.data || []);
    } catch (err) {
      console.error('Failed to load HR manager stats:', err);
      setToast({ message: 'Error loading HR dashboard metrics', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRStats();
  }, []);

  const handleApproveLeave = async (requestId) => {
    setActionLoading(true);
    try {
      await timeOffRequestApi.approve(requestId);
      setToast({ message: 'Leave request approved successfully', type: 'success' });
      fetchHRStats();
    } catch (err) {
      setToast({ message: err.message || 'Failed to approve leave request', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuseLeave = async (requestId) => {
    const reason = window.prompt('Enter reason for refusal (optional):');
    setActionLoading(true);
    try {
      await timeOffRequestApi.refuse(requestId, reason || 'Operational requirement');
      setToast({ message: 'Leave request refused', type: 'success' });
      fetchHRStats();
    } catch (err) {
      setToast({ message: err.message || 'Failed to refuse leave request', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading HR Operations Command Center..." />;
  }

  return (
    <div className="space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 mr-1 text-emerald-300" /> HR Operations Command Center
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-brand-100 max-w-2xl">
            Oversee employee records, contracts, working schedules, attendance validation, and time-off request approvals across the organization.
          </p>
          <div className="pt-3 flex flex-wrap gap-2.5">
            <Link
              to="/payroll"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition shadow-xs"
            >
              <IndianRupee className="w-3.5 h-3.5 mr-1.5 text-emerald-300" />
              Payroll & Payslips Audit
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition shadow-xs"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5 text-indigo-300" />
              HR Reports & Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Missing Checkouts Alert Warning (if any) */}
      {stats.missingCheckoutsCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-amber-900">
                {stats.missingCheckoutsCount} Missing Check-Outs Detected
              </span>
              <p className="text-xs text-amber-700">
                Employees forgot to clock out on previous shifts. Please review and apply manual corrections.
              </p>
            </div>
          </div>
          <Link
            to="/attendance"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            Review in Attendance
          </Link>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Headcount</span>
            <div className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalEmployees}</div>
            <Link to="/employees" className="text-xs text-brand-600 font-semibold hover:underline flex items-center mt-2">
              Manage Employees <ArrowRight className="w-3 h-3 ml-1" />
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
              Manage Contracts <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Departments</span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">{stats.totalDepartments}</div>
            <span className="text-xs text-gray-400 block mt-2">Active organizational units</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Grid: Pending Approvals & Recent Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Approvals Queue */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-brand-600" />
                Pending Leave Approvals ({pendingLeaves.length})
              </h3>
              <Link to="/timeoff" className="text-xs text-brand-600 font-semibold hover:underline">
                View All
              </Link>
            </div>

            {pendingLeaves.length > 0 ? (
              <div className="space-y-3">
                {pendingLeaves.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {req.employee?.name || 'Employee'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        <span className="font-semibold text-brand-700">{req.timeOffType?.name || 'Leave'}</span> •{' '}
                        {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}{' '}
                        ({req.totalDays} day{req.totalDays > 1 ? 's' : ''})
                      </div>
                      {req.reason && <p className="text-xs text-gray-600 mt-1 italic">"{req.reason}"</p>}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproveLeave(req._id)}
                        disabled={actionLoading}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                        title="Approve Leave"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRefuseLeave(req._id)}
                        disabled={actionLoading}
                        className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50"
                        title="Refuse Leave"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm">
                No leave requests pending approval.
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              to="/timeoff"
              className="text-xs text-gray-500 hover:text-brand-600 font-semibold flex items-center justify-center"
            >
              Open Complete Time-Off Manager <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        {/* Recently Added Employees */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                Recently Hired Staff
              </h3>
              <Link to="/employees" className="text-xs text-brand-600 font-semibold hover:underline">
                View Directory
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {recentEmployees.map((emp) => (
                <div key={emp._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                      {emp.name?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{emp.name}</div>
                      <div className="text-xs text-gray-500">
                        {emp.jobPosition?.name || 'Position'} • {emp.department?.name || 'Department'}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {emp.status || 'Active'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Employee lifecycle controls</span>
            <Link
              to="/employees"
              className="inline-flex items-center text-xs font-semibold text-brand-600 hover:underline"
            >
              Add New Employee <Plus className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
