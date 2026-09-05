import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { payrunApi } from '../../api/payrunApi';
import { salaryStructureApi } from '../../api/salaryStructureApi';
import { salaryRuleApi } from '../../api/salaryRuleApi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Toast } from '../common/Toast';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sliders,
  PlayCircle,
  ArrowRight,
  Layers,
  Building2,
  Lock
} from 'lucide-react';

export const PayrollManagerDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const [payruns, setPayruns] = useState([]);
  const [structures, setStructures] = useState([]);
  const [rules, setRules] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayrollManagerData = async () => {
    setLoading(true);
    try {
      const [prRes, stRes, ruRes] = await Promise.all([
        payrunApi.getAll({ limit: 10 }).catch(() => ({ data: [] })),
        salaryStructureApi.getAll().catch(() => ({ data: [] })),
        salaryRuleApi.getAll().catch(() => ({ data: [] }))
      ]);

      setPayruns(prRes.data || []);
      setStructures(stRes.data || []);
      setRules(ruRes.data || []);
    } catch (err) {
      console.error('Failed to load payroll manager data:', err);
      setToast({ message: 'Error loading executive payroll metrics', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollManagerData();
  }, []);

  // Calculate totals
  const totalDisbursed = payruns.filter((p) => p.status === 'Paid').reduce((acc, p) => acc + (p.totalNet ?? p.totalNetPay ?? 0), 0);
  const draftPayruns = payruns.filter((p) => p.status === 'Draft' || p.status === 'Computed');
  const confirmedPayruns = payruns.filter((p) => p.status === 'Validated' || p.status === 'Confirmed');

  // Handle Payrun Status Transition
  const handleValidatePayrun = async (payrunId) => {
    setActionLoading(true);
    try {
      await payrunApi.validate(payrunId);
      setToast({ message: 'Payrun verified and approved into Confirmed status', type: 'success' });
      fetchPayrollManagerData();
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
      fetchPayrollManagerData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to finalize payrun', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

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
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 mr-1 text-emerald-300" /> Executive Payroll & Compensation Controls
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name}!
          </h1>
          <p className="text-sm text-emerald-100 max-w-2xl">
            Oversee company-wide compensation structures, configure salary computation rules (Tax, PF, Allowances), approve payruns, and verify salary disbursements.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Payroll Volume</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            ₹{totalDisbursed.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-gray-500 mt-2 block">All completed payruns</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Awaiting Confirmation</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{draftPayruns.length}</div>
          <span className="text-xs text-amber-700 font-semibold mt-2 block">
            {draftPayruns.length > 0 ? 'Action required for approval' : 'Queue clear'}
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Configured Salary Rules</span>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">{rules.length}</div>
          <Link to="/payroll" className="text-xs text-indigo-600 font-semibold hover:underline mt-2 block">
            Manage Rules & Taxes →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Salary Structures</span>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">{structures.length}</div>
          <Link to="/payroll" className="text-xs text-slate-600 font-semibold hover:underline mt-2 block">
            Manage Templates →
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Payruns Awaiting Approval & Structure Overview */}
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
                Active Salary Structures & Rules
              </h3>
              <Link to="/payroll" className="text-xs text-teal-600 font-semibold hover:underline">
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
              to="/payroll"
              className="text-xs text-gray-500 hover:text-brand-600 font-semibold flex items-center justify-center"
            >
              Add New Salary Structure or Tax Rule <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
