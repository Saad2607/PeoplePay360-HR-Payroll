import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { payrunApi } from '../../api/payrunApi';
import { payslipApi } from '../../api/payslipApi';
import { contractApi } from '../../api/contractApi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Toast } from '../common/Toast';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  PlayCircle,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';

export const PayrollUserDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [payruns, setPayruns] = useState([]);
  const [activeContractsCount, setActiveContractsCount] = useState(0);
  const [recentPayslips, setRecentPayslips] = useState([]);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const [prRes, psRes, ctrRes] = await Promise.all([
        payrunApi.getAll({ limit: 5 }).catch(() => ({ data: [] })),
        payslipApi.getAll({ limit: 5 }).catch(() => ({ data: [] })),
        contractApi.getAll({ status: 'Active' }).catch(() => ({ data: [] }))
      ]);

      setPayruns(prRes.data || []);
      setRecentPayslips(psRes.data || []);
      setActiveContractsCount(ctrRes.meta?.total || ctrRes.data?.length || 0);
    } catch (err) {
      console.error('Failed to load payroll stats:', err);
      setToast({ message: 'Error loading payroll workspace', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const latestPayrun = payruns[0] || null;

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading Payroll Processing Dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <IndianRupee className="w-4 h-4 mr-1 text-emerald-400" /> Payroll Operations & Processing
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name}!
            </h1>
            <p className="text-sm text-emerald-100 max-w-2xl">
              Process monthly payruns, compute automated deductions from attendance records, review generated payslips, and export payroll reports.
            </p>
          </div>

          <Link
            to="/payroll"
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-white text-emerald-900 font-bold text-sm shadow-md hover:bg-emerald-50 transition"
          >
            <PlayCircle className="w-5 h-5 mr-2 text-emerald-700" />
            Launch Payrun Wizard
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Payrun Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current / Latest Payrun</span>
            {latestPayrun ? (
              <div className="mt-2">
                <div className="text-xl font-bold text-gray-900">{latestPayrun.name || 'Monthly Payrun'}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      latestPayrun.status === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : latestPayrun.status === 'Confirmed'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {latestPayrun.status}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {latestPayrun.selectedEmployees?.length || latestPayrun.payslips?.length || 0} employees included
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 mt-2">No payrun created this month yet.</div>
            )}
          </div>
          <Link to="/payroll" className="text-xs text-emerald-600 font-semibold hover:underline flex items-center mt-4">
            View Payrun Workflows <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        {/* Total Payroll Figures */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Disbursed / Net Payable</span>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">
              ₹{(latestPayrun?.totalNet ?? latestPayrun?.totalNetPay ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Gross: ₹{(latestPayrun?.totalGross ?? latestPayrun?.totalGrossPay ?? 0).toLocaleString('en-IN')} | Deductions: ₹{(latestPayrun?.totalDeductions || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Payrun Contract Readiness */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Eligible Contracts</span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">{activeContractsCount}</div>
            <span className="text-xs text-gray-400 block mt-2">Ready for automated salary computation</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Section: Payruns Queue & Recent Payslips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payruns List */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-emerald-600" />
                Payruns Workflow
              </h3>
              <Link to="/payroll" className="text-xs text-emerald-600 font-semibold hover:underline">
                Open Wizard
              </Link>
            </div>

            {payruns.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {payruns.map((pr) => (
                  <div key={pr._id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{pr.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Period: {pr.payPeriod?.startDate ? new Date(pr.payPeriod.startDate).toLocaleDateString() : 'Current'}{' '}
                        to {pr.payPeriod?.endDate ? new Date(pr.payPeriod.endDate).toLocaleDateString() : 'Month End'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-gray-900">
                        ₹{pr.totalNetPay?.toLocaleString('en-IN') || '0'}
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 ${
                          pr.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : pr.status === 'Confirmed'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {pr.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm">
                No payruns processed yet. Click "Launch Payrun Wizard" above to execute your first payroll.
              </div>
            )}
          </div>
        </div>

        {/* Recently Generated Payslips */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-indigo-600" />
                Recently Issued Payslips
              </h3>
              <Link to="/payroll" className="text-xs text-indigo-600 font-semibold hover:underline">
                View All Slips
              </Link>
            </div>

            {recentPayslips.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentPayslips.map((ps) => (
                  <div key={ps._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{ps.employee?.name || 'Employee'}</div>
                      <div className="text-xs text-gray-500">
                        Basic: ₹{ps.basicSalary?.toLocaleString('en-IN')} | Allowances: +₹{ps.totalAllowances?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-700">
                        ₹{ps.netSalary?.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-gray-400 block font-mono">Net Paid</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm">
                No payslips issued yet. They will appear here automatically once a payrun is computed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
