import React from 'react';
import { Badge } from '../common/Badge';
import { Eye, Trash2, Calendar, Users, DollarSign, CheckCircle2, PlayCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PayrunList = ({ payruns, onSelectPayrun, onDeletePayrun }) => {
  const { isHRManager, isPayrollUser } = useAuth();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Payrun Name</th>
              <th className="py-3.5 px-4">Salary Structure</th>
              <th className="py-3.5 px-4">Pay Period</th>
              <th className="py-3.5 px-4">Employees</th>
              <th className="py-3.5 px-4">Total Net Salary</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payruns.map((run) => {
              const structName = typeof run.salaryStructure === 'object' ? run.salaryStructure?.name : 'Standard Structure';
              const empCount = run.selectedEmployees?.length || run.payslips?.length || 0;
              const totalNet = run.totalNetSalary || run.summary?.totalNetSalary || 0;

              return (
                <tr key={run._id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    <span
                      onClick={() => onSelectPayrun(run)}
                      className="hover:text-brand-600 cursor-pointer flex items-center"
                    >
                      <PlayCircle className="w-4 h-4 mr-2 text-brand-600" />
                      {run.name}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-gray-700">
                    {structName}
                  </td>

                  <td className="py-3.5 px-4 text-xs font-mono text-gray-600">
                    {run.period?.startDate ? new Date(run.period.startDate).toLocaleDateString() : 'N/A'} —{' '}
                    {run.period?.endDate ? new Date(run.period.endDate).toLocaleDateString() : 'N/A'}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      <Users className="w-3 h-3 mr-1 text-gray-500" /> {empCount} Staff
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-extrabold text-emerald-700 text-base">
                    ₹{totalNet ? totalNet.toLocaleString('en-IN') : 0}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge status={run.status}>{run.status || 'Draft'}</Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => onSelectPayrun(run)}
                      className="inline-flex items-center px-3 py-1 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Open Console
                    </button>

                    {run.status === 'Draft' && isPayrollUser && (
                      <button
                        onClick={() => onDeletePayrun(run)}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
