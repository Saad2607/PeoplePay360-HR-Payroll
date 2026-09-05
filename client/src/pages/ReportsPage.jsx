import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { payrunApi } from '../api/payrunApi';
import { attendanceApi } from '../api/attendanceApi';
import { allocationApi } from '../api/allocationApi';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  DollarSign,
  Clock,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Building2,
  Users
} from 'lucide-react';

export const ReportsPage = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('payroll'); // 'payroll' | 'attendance' | 'leaves'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [payruns, setPayruns] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveAllocations, setLeaveAllocations] = useState([]);

  // Metrics
  const [metrics, setMetrics] = useState({
    totalDisbursed: 0,
    paidPayrunsCount: 0,
    totalAttendance: 0,
    onTimeRate: '100%',
    activeAllocations: 0,
  });

  const loadReportsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [payrunRes, attRes, allocRes] = await Promise.allSettled([
        payrunApi.getAll({ limit: 50 }),
        attendanceApi.getAll({ limit: 50 }),
        allocationApi.getAll({ limit: 50 }),
      ]);

      const payrunData = payrunRes.status === 'fulfilled' ? payrunRes.value.data || [] : [];
      const attData = attRes.status === 'fulfilled' ? attRes.value.data || [] : [];
      const allocData = allocRes.status === 'fulfilled' ? allocRes.value.data || [] : [];

      setPayruns(payrunData);
      setAttendanceRecords(attData);
      setLeaveAllocations(allocData);

      // Calculate real metrics from responses
      const totalPaid = payrunData
        .filter((p) => p.status === 'Paid')
        .reduce((sum, p) => sum + (p.totalNet || p.totalGross || 0), 0);

      const paidCount = payrunData.filter((p) => p.status === 'Paid').length;
      const onTimeAtt = attData.filter((a) => a.status === 'Present').length;
      const onTimePct = attData.length > 0 ? `${Math.round((onTimeAtt / attData.length) * 100)}%` : '—';

      setMetrics({
        totalDisbursed: totalPaid,
        paidPayrunsCount: paidCount,
        totalAttendance: attData.length,
        onTimeRate: onTimePct,
        activeAllocations: allocData.length,
      });
    } catch (err) {
      setError(err.message || 'Failed to generate reports analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, []);

  // Columns for Payroll report
  const payrollColumns = [
    {
      key: 'title',
      label: 'Payrun Title',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.title || row.payrunNumber || 'Payrun'}</div>
          <div className="text-xs text-gray-400 font-mono">
            {row.periodStart ? new Date(row.periodStart).toLocaleDateString() : '—'} to{' '}
            {row.periodEnd ? new Date(row.periodEnd).toLocaleDateString() : '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'employeeCount',
      label: 'Employees',
      render: (row) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
          {row.payslips?.length || row.eligibleCount || 0} Staff
        </span>
      ),
    },
    {
      key: 'totalGross',
      label: 'Gross Amount',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-gray-900">
          ₹{(row.totalGross || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'totalNet',
      label: 'Net Disbursed',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-emerald-600">
          ₹{(row.totalNet || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status || 'Draft'} size="sm" />,
    },
  ];

  // Columns for Attendance report
  const attendanceColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">
            {typeof row.employee === 'object' ? row.employee?.name : 'Employee'}
          </div>
          <div className="text-xs text-gray-400 font-mono">
            {typeof row.employee === 'object' ? row.employee?.employeeId : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => (
        <span className="text-xs text-gray-600">
          {row.date ? new Date(row.date).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'checkIn',
      label: 'Check In',
      render: (row) => (
        <span className="font-mono text-xs text-gray-800">
          {row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      render: (row) => (
        <span className="font-mono text-xs text-gray-800">
          {row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status || 'Present'} size="sm" />,
    },
  ];

  // Columns for Leave Allocation report
  const leaveColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => (
        <span className="font-semibold text-gray-900">
          {typeof row.employee === 'object' ? row.employee?.name : 'Staff Member'}
        </span>
      ),
    },
    {
      key: 'timeOffType',
      label: 'Leave Type',
      render: (row) => (
        <span className="text-xs font-medium text-gray-800">
          {typeof row.timeOffType === 'object' ? row.timeOffType?.name : 'Standard'}
        </span>
      ),
    },
    {
      key: 'allocatedDays',
      label: 'Allocated Days',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-brand-700">
          {row.allocatedDays || 0} Days
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status || 'Approved'} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate organizational audit reports for payroll disbursements, workforce attendance, and leave allocations."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Reports' },
        ]}
        actions={
          <div className="flex items-center space-x-2.5">
            <button
              onClick={loadReportsData}
              disabled={loading}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
              Refresh Data
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Report
            </button>
          </div>
        }
      />

      {error && (
        <ErrorMessage
          title="Reports Sync Error"
          message={error}
          onRetry={loadReportsData}
          onDismiss={() => setError(null)}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Payroll Disbursed"
          value={`₹${metrics.totalDisbursed.toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
          loading={loading}
          description="Total funds settled across confirmed payruns"
        />
        <StatCard
          title="Paid Payruns"
          value={metrics.paidPayrunsCount}
          icon={FileSpreadsheet}
          color="brand"
          loading={loading}
          description="Fully completed payment cycles"
        />
        <StatCard
          title="Attendance Logs"
          value={metrics.totalAttendance}
          icon={Clock}
          color="indigo"
          loading={loading}
          trend={{ value: metrics.onTimeRate, isPositive: true, label: 'On-time rate' }}
        />
        <StatCard
          title="Active Allocations"
          value={metrics.activeAllocations}
          icon={Calendar}
          color="cyan"
          loading={loading}
          description="Approved employee leave quotas"
        />
      </div>

      {/* Report Module Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          {/* Tabs */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                activeTab === 'payroll'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 mr-1" />
              Payroll Summary
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                activeTab === 'attendance'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              Attendance Audit
            </button>

            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                activeTab === 'leaves'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Leave Allocations
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Live Records from MongoDB Cluster
          </div>
        </div>

        {/* Selected Tab Table */}
        {activeTab === 'payroll' && (
          <DataTable
            columns={payrollColumns}
            data={payruns}
            loading={loading}
            emptyTitle="No Payrun Records Available"
            emptyDescription="No payroll batches have been generated yet. Create a payrun from the Payroll module to view summary audits."
          />
        )}

        {activeTab === 'attendance' && (
          <DataTable
            columns={attendanceColumns}
            data={attendanceRecords}
            loading={loading}
            emptyTitle="No Attendance Records Logged"
            emptyDescription="No attendance clock-ins have been recorded yet for the selected period."
          />
        )}

        {activeTab === 'leaves' && (
          <DataTable
            columns={leaveColumns}
            data={leaveAllocations}
            loading={loading}
            emptyTitle="No Leave Allocations Found"
            emptyDescription="Leave quotas have not been allocated yet for employees."
          />
        )}
      </div>
    </div>
  );
};
