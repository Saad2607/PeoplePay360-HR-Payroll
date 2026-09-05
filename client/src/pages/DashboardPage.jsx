import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/dashboardApi';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { DashboardFilters } from '../components/dashboard/DashboardFilters';
import { DashboardKpiCards } from '../components/dashboard/DashboardKpiCards';
import { OperationalAlerts } from '../components/dashboard/OperationalAlerts';
import { PayrollCharts } from '../components/dashboard/PayrollCharts';
import { AttendanceTimeOffOverview } from '../components/dashboard/AttendanceTimeOffOverview';
import { DepartmentBreakdown } from '../components/dashboard/DepartmentBreakdown';
import { Sparkles, ShieldCheck, Download, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { user } = useAuth();

  // Filter States
  const [filters, setFilters] = useState({
    period: 'all',
    department: '',
    employeeType: '',
  });

  // Data States
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load real backend dashboard metrics
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getSummary({
        period: filters.period,
        department: filters.department || undefined,
        employeeType: filters.employeeType || undefined,
      });
      setSummary(res.data || {});
    } catch (err) {
      setError(err.message || 'Failed to retrieve real-time dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const kpis = summary?.kpis || {};
  const charts = summary?.charts || {};
  const alerts = summary?.alerts || {};
  const attendance = summary?.attendance || {};
  const timeOff = summary?.timeOff || {};
  const departments = summary?.departmentBreakdown || [];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Payroll & Workforce Intelligence"
        subtitle="Real-time operational visibility across payroll disbursements, attendance logs, leave balances, and department costs."
        badge={
          <div className="flex items-center space-x-2">
            <StatusBadge status={user?.role || 'Employee'} size="sm" />
            <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Live Database Connected
            </span>
          </div>
        }
        breadcrumbs={[
          { label: 'Overview', href: '/' },
          { label: 'Executive Dashboard' },
        ]}
        actions={
          <div className="flex items-center space-x-2.5">
            <Link
              to="/payroll"
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Process Payrun
            </Link>
          </div>
        }
      />

      {/* 2. Error Message with Retry */}
      {error && (
        <ErrorMessage
          title="Dashboard Synchronization Notice"
          message={error}
          onRetry={loadDashboardData}
          onDismiss={() => setError(null)}
        />
      )}

      {/* 3. Real-Time Filters */}
      <DashboardFilters
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={loadDashboardData}
        loading={loading}
      />

      {/* 4. Dashboard KPI Cards */}
      <DashboardKpiCards kpis={kpis} loading={loading} />

      {/* 5. Operational Compliance & Action Alerts */}
      <OperationalAlerts alerts={alerts} loading={loading} />

      {/* 6. Real-Data Payroll Charts */}
      <PayrollCharts charts={charts} loading={loading} />

      {/* 7. Attendance & Time Off Overview */}
      <AttendanceTimeOffOverview
        attendance={attendance}
        timeOff={timeOff}
        loading={loading}
      />

      {/* 8. Department Breakdown Table */}
      <DepartmentBreakdown departments={departments} loading={loading} />
    </div>
  );
};
