import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { payslipApi } from '../../api/payslipApi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { FileText, Printer, Download, Calendar, User, Building2, Calculator, ShieldCheck } from 'lucide-react';

export const PayslipDetailsModal = ({ isOpen, onClose, payslipId }) => {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !payslipId) return;

    const fetchPayslip = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await payslipApi.getById(payslipId);
        setPayslip(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load payslip breakdown');
      } finally {
        setLoading(false);
      }
    };

    fetchPayslip();
  }, [isOpen, payslipId]);

  const handleDownloadPdf = async () => {
    try {
      const blob = await payslipApi.downloadPdf(payslipId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      alert(err.message || 'Failed to download PDF payslip');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payslip Breakdown — ${payslip?.payslipNumber || 'Details'}`}
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <LoadingSpinner label="Fetching itemized salary rule breakdown..." />
      ) : error || !payslip ? (
        <div className="p-6 text-center text-rose-600">{error || 'Payslip record not found'}</div>
      ) : (
        <div className="space-y-6 text-sm">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gradient-to-br from-slate-50 to-brand-50/40 rounded-2xl border border-slate-200 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-brand-600 text-white rounded-xl shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-mono text-lg font-bold text-gray-900">{payslip.payslipNumber}</h3>
                  <Badge status={payslip.status}>{payslip.status}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Employee: <strong className="text-gray-900">{payslip.employee?.name}</strong> ({payslip.employee?.employeeId})
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition shadow-sm"
              >
                <Printer className="w-4 h-4 mr-1.5" /> Print
              </button>
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition"
              >
                <Download className="w-4 h-4 mr-1.5" /> Download PDF
              </button>
            </div>
          </div>

          {/* Org & Period Info */}
          <div className="grid grid-cols-2 gap-4 text-xs p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-gray-400 block uppercase font-semibold">Pay Period</span>
              <span className="font-mono text-gray-900 font-bold">
                {new Date(payslip.period?.startDate).toLocaleDateString()} — {new Date(payslip.period?.endDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase font-semibold">Department & Position</span>
              <span className="font-semibold text-gray-800">
                {payslip.department?.name || 'Engineering'} • {payslip.jobPosition?.name || 'Developer'}
              </span>
            </div>
          </div>

          {/* Itemized Line Items Salary Breakdown */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-sm flex items-center border-b pb-2">
              <Calculator className="w-4 h-4 mr-2 text-brand-600" /> Itemized Salary Rule Breakdown
            </h4>

            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-slate-100 text-gray-700 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Rule / Component Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Basic Salary */}
                <tr className="font-semibold bg-gray-50/50">
                  <td className="py-2.5 px-3 text-gray-900">Basic Salary</td>
                  <td className="py-2.5 px-3 uppercase text-[10px] text-gray-500 font-mono">BASIC</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-900">
                    ₹{payslip.basicSalary ? payslip.basicSalary.toLocaleString('en-IN') : 0}
                  </td>
                </tr>

                {/* Allowances */}
                {payslip.allowances && Object.entries(payslip.allowances).map(([k, v]) => {
                  if (!v) return null;
                  return (
                    <tr key={k}>
                      <td className="py-2 px-3 capitalize text-gray-800">{k.replace(/([A-Z])/g, ' $1')}</td>
                      <td className="py-2 px-3 text-emerald-700 font-semibold text-[10px]">ALLOWANCE</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700">+₹{Number(v).toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}

                {/* Deductions */}
                {payslip.deductions && Object.entries(payslip.deductions).map(([k, v]) => {
                  if (!v) return null;
                  return (
                    <tr key={k}>
                      <td className="py-2 px-3 capitalize text-gray-800">{k.replace(/([A-Z])/g, ' $1')}</td>
                      <td className="py-2 px-3 text-rose-700 font-semibold text-[10px]">DEDUCTION</td>
                      <td className="py-2 px-3 text-right font-mono text-rose-600">-₹{Number(v).toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Final Totals Banner */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 font-semibold uppercase block">Gross Salary</span>
              <span className="text-base font-bold text-emerald-900">
                ₹{payslip.grossSalary ? payslip.grossSalary.toLocaleString('en-IN') : 0}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-emerald-800 font-semibold uppercase block">Net Salary Payable</span>
              <span className="text-2xl font-extrabold text-emerald-700">
                ₹{payslip.netSalary ? payslip.netSalary.toLocaleString('en-IN') : 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
