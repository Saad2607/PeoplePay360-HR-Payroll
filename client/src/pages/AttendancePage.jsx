import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../api/attendanceApi';
import { departmentApi } from '../api/departmentApi';
import { employeeApi } from '../api/employeeApi';
import { AttendanceList } from '../components/attendance/AttendanceList';
import { CheckInCheckOutModal } from '../components/attendance/CheckInCheckOutModal';
import { ManualCorrectionModal } from '../components/attendance/ManualCorrectionModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { PageHeader } from '../components/common/PageHeader';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import {
  LogIn,
  LogOut,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export const AttendancePage = () => {
  const { canManageHR, user } = useAuth();

  const [records, setRecords] = useState([]);
  const [missingCheckouts, setMissingCheckouts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filters & State
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [missingFilter, setMissingFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });

  const [loading, setLoading] = useState(true);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleMode, setConsoleMode] = useState('checkIn');
  const [correctingRecord, setCorrectingRecord] = useState(null);

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [dRes, eRes] = await Promise.all([
          departmentApi.getAll(),
          employeeApi.getAll({ limit: 100 }),
        ]);
        setDepartments(dRes.data || []);
        setEmployees(eRes.data || []);
      } catch (err) {
        console.error('Failed to load lookups', err);
      }
    };
    loadLookups();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: statusFilter || undefined,
        department: deptFilter || undefined,
        employee: empFilter || undefined,
        missingCheckout: missingFilter ? true : undefined,
        page,
        limit: 10,
      };

      const res = await attendanceApi.getAll(params);
      setRecords(res.data || []);
      if (res.meta) setMeta(res.meta);

      // Check missing checkouts for HR banner
      if (canManageHR) {
        try {
          const missRes = await attendanceApi.getMissingCheckouts();
          setMissingCheckouts(missRes.data || []);
        } catch {
          setMissingCheckouts([]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load attendance logs');
      setToast({ message: err.message || 'Failed to load attendance logs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [statusFilter, deptFilter, empFilter, missingFilter, page]);

  const handleOpenConsole = (mode) => {
    setConsoleMode(mode);
    setIsConsoleOpen(true);
  };

  const handleSuccess = (msg) => {
    setToast({ message: msg, type: 'success' });
    fetchAttendance();
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Console */}
      <PageHeader
        title="Attendance & Time Tracker"
        subtitle="Real-time worked hours, shift check-ins/outs, overtime, and audit logs."
        breadcrumbs={[
          { label: 'Overview', href: '/' },
          { label: 'Attendance' },
        ]}
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleOpenConsole('checkIn')}
              className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition"
            >
              <LogIn className="w-4 h-4 mr-2" /> Check In
            </button>

            <button
              onClick={() => handleOpenConsole('checkOut')}
              className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition"
            >
              <LogOut className="w-4 h-4 mr-2" /> Check Out
            </button>
          </div>
        }
      />

      {/* Error Message with Retry */}
      {error && (
        <ErrorMessage
          title="Attendance Module Notice"
          message={error}
          onRetry={fetchAttendance}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Missing Checkouts Alert Banner */}
      {canManageHR && missingCheckouts.length > 0 && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">
                Missing Checkout Warning ({missingCheckouts.length} records detected)
              </h4>
              <p className="text-xs text-amber-700">
                Staff members checked in without recording a checkout for their shift.
              </p>
            </div>
          </div>

          <button
            onClick={() => setMissingFilter(!missingFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              missingFilter ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-800 border-amber-300'
            }`}
          >
            {missingFilter ? 'Show All Logs' : 'Filter Missing Checkouts Only'}
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses (Present, Late, Absent...)</option>
              <option value="Present">Present Only</option>
              <option value="Late">Late Only</option>
              <option value="Half-Day">Half-Day Only</option>
              <option value="Absent">Absent Only</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          {canManageHR && (
            <div>
              <select
                value={empFilter}
                onChange={(e) => {
                  setEmpFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner label="Loading attendance records & calculating worked hours..." />
      ) : records.length === 0 ? (
        <EmptyState
          title="No attendance records found"
          description="No logs matching your current filter criteria."
          actionLabel="Check In Now"
          onAction={() => handleOpenConsole('checkIn')}
          icon={Clock}
        />
      ) : (
        <div className="space-y-4">
          <AttendanceList
            attendanceRecords={records}
            onManualCorrection={(rec) => setCorrectingRecord(rec)}
          />

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-500">
                Page <span className="font-semibold text-gray-900">{page}</span> of{' '}
                <span className="font-semibold text-gray-900">{meta.totalPages}</span> ({meta.total} total)
              </span>

              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Check In / Out Modal */}
      <CheckInCheckOutModal
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        mode={consoleMode}
        onSuccess={handleSuccess}
      />

      {/* Manual Correction Modal */}
      <ManualCorrectionModal
        isOpen={!!correctingRecord}
        onClose={() => setCorrectingRecord(null)}
        attendanceRecord={correctingRecord}
        onSuccess={handleSuccess}
      />

      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}
    </div>
  );
};
