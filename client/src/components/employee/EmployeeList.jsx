import React from 'react';
import { Badge } from '../common/Badge';
import { Eye, Edit2, Trash2, Mail, Phone, Calendar, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const EmployeeList = ({ employees, onSelectEmployee, onEditEmployee, onDeleteEmployee }) => {
  const { isHRManager, isAdmin } = useAuth();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 min-w-[700px]">
          <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">ID</th>
              <th className="py-3.5 px-4">Department & Position</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Joining Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((emp) => {
              const deptName = typeof emp.department === 'object' ? emp.department?.name : emp.department;
              const posName = typeof emp.jobPosition === 'object' ? emp.jobPosition?.name : emp.jobPosition;

              return (
                <tr key={emp._id} className="hover:bg-slate-50/80 transition group">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-bold flex items-center justify-center shadow-sm">
                        {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                      </div>
                      <div>
                        <div
                          onClick={() => onSelectEmployee(emp)}
                          className="font-semibold text-gray-900 hover:text-brand-600 cursor-pointer transition flex items-center space-x-1"
                        >
                          <span>{emp.name}</span>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center space-x-2 mt-0.5">
                          <span className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {emp.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-brand-700 bg-brand-50/50 rounded py-1 px-2 fit-content">
                    {emp.employeeId || 'N/A'}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-900">{deptName || 'Unassigned'}</div>
                    <div className="text-xs text-gray-500">{posName || 'N/A'}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge status={emp.employeeType}>{emp.employeeType || 'Full-Time'}</Badge>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge status={emp.status}>{emp.status || 'Active'}</Badge>
                  </td>

                  <td className="py-3.5 px-4 text-xs text-gray-500">
                    {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => onSelectEmployee(emp)}
                      title="View Details"
                      className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {isHRManager && (
                      <button
                        onClick={() => onEditEmployee(emp)}
                        title="Edit Employee"
                        className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => onDeleteEmployee(emp)}
                        title="Delete Employee"
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
