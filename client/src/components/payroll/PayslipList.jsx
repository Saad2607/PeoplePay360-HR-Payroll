import React from 'react';
import { Badge } from '../common/Badge';
import { Eye, Download, FileText, Calendar, DollarSign } from 'lucide-react';
import { payslipApi } from '../../api/payslipApi';

export const PayslipList = ({ payslips, onViewDetails }) => {
  const handleDownloadPdf = async (id) => {
    try {
      const blob = await payslipApi.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      alert(err.message || 'Failed to download PDF payslip');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Payslip #</th>
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">Pay Period</th>
              <th className="py-3.5 px-4">Worked Days/Hours</th>
              <th className="py-3.5 px-4">Basic Salary</th>
              <th className="py-3.5 px-4">Gross Salary</th>
              <th className="py-3.5 px-4">Deductions</th>
              <th className="py-3.5 px-4">Net Salary</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payslips.map((ps) => {
              const empName = typeof ps.employee === 'object' ? ps.employee?.name : 'N/A';
              const empId = typeof ps.employee === 'object' ? ps.employee?.employeeId : '';

              return (
                <tr key={ps._id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-900 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-brand-600" />
                    <span>{ps.payslipNumber || ps._id.slice(-6)}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900">{empName}</div>
                    {empId && <div className="text-xs font-mono text-gray-400">{empId}</div>}
                  </td>

                  <td className="py-3.5 px-4 text-xs font-mono text-gray-600">
                    {ps.period?.startDate ? new Date(ps.period.startDate).toLocaleDateString() : 'N/A'} —{' '}
                    {ps.period?.endDate ? new Date(ps.period.endDate).toLocaleDateString() : 'N/A'}
                  </td>

                  <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                    {ps.workedDays !== undefined ? `${ps.workedDays} days` : ps.workedHours ? `${ps.workedHours} hrs` : 'Standard'}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-gray-700">
                    ₹{ps.basicSalary ? ps.basicSalary.toLocaleString('en-IN') : 0}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-brand-600">
                    ₹{ps.grossSalary ? ps.grossSalary.toLocaleString('en-IN') : 0}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-rose-600">
                    -₹{ps.totalDeductions ? ps.totalDeductions.toLocaleString('en-IN') : 0}
                  </td>

                  <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                    ₹{ps.netSalary ? ps.netSalary.toLocaleString('en-IN') : 0}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge status={ps.status}>{ps.status || 'Draft'}</Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => onViewDetails(ps._id)}
                      title="View Detailed Salary Rules Breakdown"
                      className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDownloadPdf(ps._id)}
                      title="Download Vector PDF"
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
    </div>
  );
};
