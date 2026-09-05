import React, { useState, useEffect } from 'react';
import { payrunApi } from '../../api/payrunApi';
import { payslipApi } from '../../api/payslipApi';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  DollarSign,
  Send,
  AlertTriangle,
  FileText,
  Users,
  ShieldCheck,
  Download,
  Eye,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PayrunDetails = ({ payrunId, onBack, onViewPayslip }) => {
  const { isPayrollUser } = useAuth();

  const [payrun, setPayrun] = useState(null);
  const [validationReport, setValidationReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Payment method modal state
  const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState(`PAY-${Math.floor(100000 + Math.random() * 900000)}`);

  const fetchPayrun = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await payrunApi.getById(payrunId);
      setPayrun(res.data);

      // Check validation audit
      try {
        const valRes = await payrunApi.checkValidation(payrunId);
        setValidationReport(valRes.data);
      } catch {
        setValidationReport(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payrun details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (payrunId) fetchPayrun();
  }, [payrunId]);

  // Workflow Handlers
  const handleCompute = async () => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await payrunApi.compute(payrunId);
      setSuccessMsg(res.message || 'Payrun computed successfully');
      fetchPayrun();
    } catch (err) {
      setError(err.message || 'Failed to compute payrun');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await payrunApi.validate(payrunId);
      setSuccessMsg(res.message || 'Payrun validated and approved');
      fetchPayrun();
    } catch (err) {
      setError(err.message || 'Failed to validate payrun');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await payrunApi.markPaid(payrunId, { paymentMethod, reference });
      setSuccessMsg(res.message || 'Payrun marked as Paid');
      setIsPaidModalOpen(false);
      fetchPayrun();
    } catch (err) {
      setError(err.message || 'Failed to mark payrun as paid');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPayslips = async () => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await payrunApi.sendPayslips(payrunId);
      setSuccessMsg(res.message || 'Bulk payslips emailed successfully');
      fetchPayrun();
    } catch (err) {
      setError(err.message || 'Failed to send payslips via email');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async (payslipId) => {
    try {
      const blob = await payslipApi.downloadPdf(payslipId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      alert(err.message || 'Failed to download PDF payslip');
    }
  };

  if (loading) return <LoadingSpinner fullScreen label="Loading payrun processing console..." />;

  if (!payrun) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">{error || 'Payrun not found'}</h3>
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payruns
        </button>
      </div>
    );
  }

  const isDraft = payrun.status === 'Draft';
  const isComputed = payrun.status === 'Computed';
  const isValidated = payrun.status === 'Validated';
  const isPaid = payrun.status === 'Paid';

  const payslipsList = payrun.payslips || [];
  const structName = typeof payrun.salaryStructure === 'object' ? payrun.salaryStructure?.name : 'Standard';

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">{payrun.name}</h2>
              <Badge status={payrun.status}>{payrun.status}</Badge>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center space-x-3">
              <span>Structure: <strong className="text-gray-800">{structName}</strong></span>
              <span>•</span>
              <span>
                Period: <strong className="text-gray-800">{new Date(payrun.period?.startDate).toLocaleDateString()} — {new Date(payrun.period?.endDate).toLocaleDateString()}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Workflow Processing Buttons */}
        {isPayrollUser && (
          <div className="flex flex-wrap items-center gap-2">
            {isDraft && (
              <button
                onClick={handleCompute}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Compute Payrun
              </button>
            )}

            {(isDraft || isComputed) && (
              <button
                onClick={handleValidate}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Validate & Approve
              </button>
            )}

            {isValidated && (
              <button
                onClick={() => setIsPaidModalOpen(true)}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
              >
                <DollarSign className="w-4 h-4 mr-2" /> Mark as Paid
              </button>
            )}

            {(isValidated || isPaid) && (
              <button
                onClick={handleSendPayslips}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Bulk Send Payslips
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-medium flex items-center">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" /> {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-sm font-semibold flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-600 flex-shrink-0" /> {successMsg}
        </div>
      )}

      {/* Warnings & Audit Inspection Banner */}
      {validationReport && validationReport.warnings?.length > 0 && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
          <h4 className="font-bold text-amber-900 text-sm flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-amber-600" /> Payroll Validation Audit ({validationReport.warnings.length} Warnings Detected)
          </h4>
          <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
            {validationReport.warnings.map((warn, i) => (
              <li key={i}>{warn.message || warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Payrun Totals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase">Staff Count</span>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">
            {payrun.selectedEmployees?.length || payslipsList.length}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase">Total Gross Salary</span>
          <div className="text-2xl font-extrabold text-brand-600 mt-1">
            ₹{payrun.totalGrossSalary ? payrun.totalGrossSalary.toLocaleString('en-IN') : 0}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase">Total Deductions</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            -₹{payrun.totalDeductions ? payrun.totalDeductions.toLocaleString('en-IN') : 0}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <span className="text-xs font-bold text-emerald-800 uppercase">Total Net Salary</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            ₹{payrun.totalNetSalary ? payrun.totalNetSalary.toLocaleString('en-IN') : 0}
          </div>
        </div>
      </div>

      {/* Generated Payslips Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 text-brand-600 mr-2" /> Generated Payslips ({payslipsList.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Payslip #</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Basic Salary</th>
                <th className="py-3 px-4">Gross Salary</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payslipsList.map((ps) => {
                const empName = typeof ps.employee === 'object' ? ps.employee?.name : 'N/A';
                const empId = typeof ps.employee === 'object' ? ps.employee?.employeeId : '';

                return (
                  <tr key={ps._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {ps.payslipNumber || ps._id.slice(-6)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{empName}</div>
                      {empId && <div className="text-xs font-mono text-gray-400">{empId}</div>}
                    </td>

                    <td className="py-3 px-4 font-semibold text-gray-700">
                      ₹{ps.basicSalary ? ps.basicSalary.toLocaleString('en-IN') : 0}
                    </td>

                    <td className="py-3 px-4 font-semibold text-brand-600">
                      ₹{ps.grossSalary ? ps.grossSalary.toLocaleString('en-IN') : 0}
                    </td>

                    <td className="py-3 px-4 font-semibold text-rose-600">
                      -₹{ps.totalDeductions ? ps.totalDeductions.toLocaleString('en-IN') : 0}
                    </td>

                    <td className="py-3 px-4 font-extrabold text-emerald-700">
                      ₹{ps.netSalary ? ps.netSalary.toLocaleString('en-IN') : 0}
                    </td>

                    <td className="py-3 px-4">
                      <Badge status={ps.status}>{ps.status || 'Draft'}</Badge>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => onViewPayslip(ps._id)}
                        title="View Detailed Rule Breakdown"
                        className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDownloadPdf(ps._id)}
                        title="Download Vector PDF Payslip"
                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {payslipsList.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            No payslips generated yet. Click <strong className="text-brand-600">Compute Payrun</strong> to generate payslips.
          </div>
        )}
      </div>

      {/* Mark Paid Modal */}
      {isPaidModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Mark Payrun as Paid</h3>

            <form onSubmit={handleMarkPaid} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Direct Deposit">Direct Deposit</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Transaction / Reference ID
                </label>
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPaidModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
