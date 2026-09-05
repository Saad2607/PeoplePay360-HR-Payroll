import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { payrunApi } from '../../api/payrunApi';
import { salaryStructureApi } from '../../api/salaryStructureApi';
import { salaryRuleApi } from '../../api/salaryRuleApi';
import { dashboardApi } from '../../api/dashboardApi';
import { DashboardFilters } from './DashboardFilters';
import { DashboardKpiCards } from './DashboardKpiCards';
import { PayrollCharts } from './PayrollCharts';
import { OperationalAlerts } from './OperationalAlerts';
import { AttendanceTimeOffOverview } from './AttendanceTimeOffOverview';
import { DepartmentBreakdown } from './DepartmentBreakdown';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Toast } from '../common/Toast';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sliders,
  PlayCircle,
  ArrowRight,
  Layers,
  Building2,
  Lock,
  BarChart3
} from 'lucide-react';

export const PayrollManagerDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Filters State (PDF Requirement B9)
  const [filters, setFilters] = useState({
    period: 'all',
    department: '',
    employeeType: '',
  });

  // Consolidated Analytics Data
  const [summaryData, setSummaryData] = useState({
    kpis: {},
    charts: { salaryCostByDepartment: [], monthlyNetSalaryTrends: [] },
    alerts: {},
    attendance: {},
    timeOff: {},
    departments: [],
  });

  // Payruns & Structures for Operational Quick Queue
  const [payruns, setPayruns] = useState([]);
  const [structures, setStructures] = useState([]);
  const [rules, setRules] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Consolidated Operational & Payroll Data
  const fetchDashboardData = async (currentFilters = filters) => {
    setAnalyticsLoading(true);
    try {
      const [summaryRes, prRes, stRes, ruRes] = await Promise.all([
        dashboardApi.getSummary(currentFilters).catch(() => ({ data: {} })),
        payrunApi.getAll({ limit: 10 }).catch(() => ({ data: [] })),
        salaryStructureApi.getAll().catch(() => ({ data: [] })),
        salaryRuleApi.getAll().catch(() => ({ data: [] })),
      ]);

      if (summaryRes.data) {
        setSummaryData(summaryRes.data);
      }
      setPayruns(prRes.data || []);
      setStructures(stRes.data || []);
      setRules(ruRes.data || []);
    } catch (err) {
      console.error('Failed to load payroll manager dashboard:', err);
      setToast({ message: 'Error loading executive payroll metrics', type: 'error' });
    } finally {
      setLoading(false);
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(filters);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchDashboardData(newFilters);
  };

  // Payrun Status Transitions
  const handleValidatePayrun = async (payrunId) => {
    setActionLoading(true);
    try {
      await payrunApi.validate(payrunId);
      setToast({ message: 'Payrun verified and approved into Confirmed status', type: 'success' });
      fetchDashboardData(filters);
    } catch (err) {
      setToast({ message: err.message || 'Failed to approve payrun', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async (payrunId) => {
    setActionLoading(true);
    try {
      await payrunApi.markPaid(payrunId, { paymentMethod: 'Bank Transfer' });
      setToast({ message: 'Payrun marked as Paid. Payslips disbursed to employees!', type: 'success' });
      fetchDashboardData(filters);
    } catch (err) {
      setToast({ message: err.message || 'Failed to finalize payrun', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const draftPayruns = payruns.filter((p) => p.status === 'Draft' || p.status === 'Computed');
  const confirmedPayruns = payruns.filter((p) => p.status === 'Validated' || p.status === 'Confirmed');

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading Executive Payroll & Compensation Dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 mr-1 text-emerald-300" /> Executive Payroll & Compensation Controls
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name}!
          </h1>
          <p className="text-emerald-200/80 text-xs sm:text-sm max-w-2xl">
            Real-time executive oversight of salary structures, rule calculations, approval queues, attendance quality, and period disbursements.
          </p>

          <div className="pt-3 flex flex-wrap gap-2 sm:gap-3">
            <Link
              to="/payroll"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition shadow-sm"
            >
              <PlayCircle className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
              Payrun Engine
            </Link>
            <Link
              to="/payroll?tab=structures"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5 text-teal-300" />
              Salary Structures & Rules
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition shadow-xs"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5 text-indigo-300" />
              Audit Reports
            </Link>
          </div>
        </div>
      </div>

      {/* 1. Live Filtering Controls (PDF Requirement B9) */}
      <DashboardFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={() => fetchDashboardData(filters)}
        loading={analyticsLoading}
      />

      {/* 2. Primary KPI Cards (PDF Requirement B9) */}
      <DashboardKpiCards kpis={summaryData.kpis || {}} loading={analyticsLoading} />

      {/* 3. Operational Alerts (PDF Requirement B9) */}
      <OperationalAlerts alerts={summaryData.alerts || {}} loading={analyticsLoading} />

      {/* 4. Two Column Layout: Payruns Approvals Queue & Salary Structures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payruns Approval Queue */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-brand-600" />
                Payrun Approvals & Sign-off Queue
              </h3>
              <Link to="/payroll" className="text-xs text-brand-600 font-semibold hover:underline">
                View All
              </Link>
            </div>

            {draftPayruns.length > 0 || confirmedPayruns.length > 0 ? (
              <div className="space-y-3">
                {draftPayruns.map((pr) => (
                  <div
                    key={pr._id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-gray-900">{pr.name}</div>
                      <div className="text-xs text-gray-500">
                        Net: ₹{(pr.totalNet ?? pr.totalNetPay ?? 0).toLocaleString('en-IN')} • Status: <span className="font-semibold text-amber-700">{pr.status}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleValidatePayrun(pr._id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition disabled:opacity-50"
                    >
                      Approve Payrun
                    </button>
                  </div>
                ))}

                {confirmedPayruns.map((pr) => (
                  <div
                    key={pr._id}
                    className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-gray-900">{pr.name}</div>
                      <div className="text-xs text-gray-500">
                        Net: ₹{(pr.totalNet ?? pr.totalNetPay ?? 0).toLocaleString('en-IN')} • Status: <span className="font-semibold text-blue-700">Validated (Ready to Disburse)</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkPaid(pr._id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition disabled:opacity-50"
                    >
                      Mark Paid & Disburse
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm">
                All payruns are up-to-date. No pending approvals in queue.
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Strict segregation of duties enforced</span>
            <Link to="/payroll" className="text-xs font-semibold text-brand-600 hover:underline flex items-center">
              Open Full Payrun Console <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* Salary Structures & Rules Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <Sliders className="w-5 h-5 mr-2 text-teal-600" />
                Active Salary Structures ({structures.length}) & Rules ({rules.length})
              </h3>
              <Link to="/payroll?tab=structures" className="text-xs text-teal-600 font-semibold hover:underline">
                Configure
              </Link>
            </div>

            <div className="space-y-3">
              {structures.slice(0, 4).map((st) => (
                <div key={st._id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{st.name}</div>
                    <div className="text-xs text-gray-500 font-mono">Code: {st.code}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                    Active
                  </span>
                </div>
              ))}
              {structures.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-sm">
                  No salary structures configured yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              to="/payroll?tab=structures"
              className="text-xs text-gray-500 hover:text-brand-600 font-semibold flex items-center justify-center"
            >
              Configure Structures & Formula Rules <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Responsive Interactive Charts (PDF Requirement B9) */}
      <PayrollCharts charts={summaryData.charts || {}} loading={analyticsLoading} />

      {/* 6. Department Headcount & Salary Breakdown (PDF Requirement B9) */}
      <DepartmentBreakdown departments={summaryData.departments || []} loading={analyticsLoading} />

      {/* 7. Attendance & Time Off Health Overview (PDF Requirement B9) */}
      <AttendanceTimeOffOverview
        attendance={summaryData.attendance || {}}
        timeOff={summaryData.timeOff || {}}
        loading={analyticsLoading}
      />
    </div>
  );
};
