import React from 'react';
import { Badge } from '../common/Badge';
import { Eye, Edit2, Trash2, Calendar, FileText, CheckCircle2, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ContractList = ({ contracts, onSelectContract, onEditContract, onDeleteContract }) => {
  const { isHRManager, isAdmin } = useAuth();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Contract Number</th>
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">Department & Position</th>
              <th className="py-3.5 px-4">Wage & Wage Type</th>
              <th className="py-3.5 px-4">Basic Salary</th>
              <th className="py-3.5 px-4">Validity Period</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contracts.map((ctr) => {
              const empName = typeof ctr.employee === 'object' ? ctr.employee?.name : 'N/A';
              const empId = typeof ctr.employee === 'object' ? ctr.employee?.employeeId : '';
              const deptName = typeof ctr.department === 'object' ? ctr.department?.name : 'N/A';
              const posName = typeof ctr.jobPosition === 'object' ? ctr.jobPosition?.name : 'N/A';
              const isActive = ctr.status === 'Active';

              return (
                <tr
                  key={ctr._id}
                  className={`hover:bg-slate-50/80 transition ${
                    isActive ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-900 flex items-center space-x-2">
                    <FileText className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span
                      onClick={() => onSelectContract(ctr)}
                      className="hover:text-brand-600 cursor-pointer"
                    >
                      {ctr.contractNumber}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900">{empName}</div>
                    {empId && <div className="text-xs font-mono text-gray-400">{empId}</div>}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-900">{deptName}</div>
                    <div className="text-xs text-gray-500">{posName}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-gray-900">${ctr.wage ? ctr.wage.toLocaleString() : 0}</div>
                    <div className="text-xs text-gray-500">{ctr.wageType || 'Annual'}</div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-gray-700">
                    ${ctr.salaryStructure?.basic ? ctr.salaryStructure.basic.toLocaleString() : 0}
                  </td>

                  <td className="py-3.5 px-4 text-xs text-gray-500">
                    <div>Start: {ctr.startDate ? new Date(ctr.startDate).toLocaleDateString() : 'N/A'}</div>
                    <div>End: {ctr.endDate ? new Date(ctr.endDate).toLocaleDateString() : 'Indefinite'}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-1.5">
                      <Badge status={ctr.status}>{ctr.status}</Badge>
                      {isActive && (
                        <span title="Active Contract for Payroll" className="flex items-center text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => onSelectContract(ctr)}
                      title="View Contract Details"
                      className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {isHRManager && (
                      <button
                        onClick={() => onEditContract(ctr)}
                        title="Edit Contract"
                        className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => onDeleteContract(ctr)}
                        title="Delete Contract"
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
