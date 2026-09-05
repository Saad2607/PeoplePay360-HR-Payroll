import React from 'react';
import { Badge } from '../common/Badge';
import { Edit2, Trash2, CheckCircle2, XCircle, ShieldCheck, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TimeOffTypeList = ({ timeOffTypes, onEditType, onDeleteType }) => {
  const { isHRManager } = useAuth();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Name & Code</th>
              <th className="py-3.5 px-4">Unit</th>
              <th className="py-3.5 px-4">Allocation Required</th>
              <th className="py-3.5 px-4">Approval Workflow</th>
              <th className="py-3.5 px-4">Payroll Integration</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {timeOffTypes.map((type) => (
              <tr key={type._id} className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-gray-900">{type.name}</div>
                  <span className="text-xs font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    {type.code}
                  </span>
                </td>

                <td className="py-3.5 px-4 capitalize font-medium text-gray-700">
                  {type.unit || 'days'}
                </td>

                <td className="py-3.5 px-4">
                  {type.allocationRequired ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Yes
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-flex items-center">
                      <XCircle className="w-3.5 h-3.5 mr-1 text-gray-400" /> No
                    </span>
                  )}
                </td>

                <td className="py-3.5 px-4 font-medium text-gray-900">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold">
                    {type.approvalWorkflow ? type.approvalWorkflow.replace('_', ' ') : 'Manager'}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-xs space-y-0.5">
                  <div className="flex items-center text-gray-700 font-medium">
                    {type.payrollIntegration?.isPaid ? (
                      <span className="text-emerald-700 font-semibold">Paid Leave</span>
                    ) : (
                      <span className="text-rose-700 font-semibold">Unpaid Leave</span>
                    )}
                  </div>
                  {type.payrollIntegration?.affectsPayroll && (
                    <div className="text-[11px] text-brand-600">Affects Payroll Engine</div>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  <Badge status={type.isActive ? 'Active' : 'Expired'}>
                    {type.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>

                <td className="py-3.5 px-4 text-right space-x-1">
                  {isHRManager && (
                    <>
                      <button
                        onClick={() => onEditType(type)}
                        title="Edit Type"
                        className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteType(type)}
                        title="Delete Type"
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
