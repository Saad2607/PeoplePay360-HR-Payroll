import React, { useState } from 'react';
import { Badge } from '../common/Badge';
import { Eye, Edit2, Mail, Building2, Briefcase } from 'lucide-react';

export const EmployeeKanban = ({ employees, departments, onSelectEmployee, onEditEmployee }) => {
  const [groupBy, setGroupBy] = useState('department'); // 'department' or 'status'

  // Group employees
  const groups = {};

  if (groupBy === 'department') {
    departments.forEach((d) => {
      groups[d.name] = [];
    });
    groups['Unassigned'] = [];

    employees.forEach((emp) => {
      const deptName = typeof emp.department === 'object' ? emp.department?.name : 'Unassigned';
      const key = deptName && groups[deptName] ? deptName : 'Unassigned';
      groups[key].push(emp);
    });
  } else {
    ['Active', 'Probation', 'On Leave', 'Terminated'].forEach((st) => {
      groups[st] = [];
    });
    employees.forEach((emp) => {
      const st = emp.status || 'Active';
      if (groups[st]) groups[st].push(emp);
      else {
        groups[st] = [emp];
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="text-sm font-semibold text-gray-700">Kanban View</div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-500">Group By:</span>
          <button
            onClick={() => setGroupBy('department')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              groupBy === 'department' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Department
          </button>
          <button
            onClick={() => setGroupBy('status')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              groupBy === 'status' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Status
          </button>
        </div>
      </div>

      {/* Board Columns */}
      <div className="flex lg:grid lg:grid-cols-4 gap-4 items-start overflow-x-auto pb-4 snap-x">
        {Object.entries(groups).map(([groupName, groupEmployees]) => (
          <div key={groupName} className="min-w-[280px] sm:min-w-[300px] lg:min-w-0 flex-1 snap-start bg-slate-100/70 p-4 rounded-2xl border border-slate-200 space-y-3 min-h-[350px]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-gray-800 text-sm">{groupName}</h4>
              <span className="text-xs font-semibold px-2 py-0.5 bg-white text-gray-600 rounded-full shadow-sm">
                {groupEmployees.length}
              </span>
            </div>

            <div className="space-y-3">
              {groupEmployees.map((emp, empIdx) => {
                const posName = typeof emp.jobPosition === 'object' ? emp.jobPosition?.name : emp.jobPosition;

                return (
                  <div
                    key={emp._id || empIdx}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm">
                          {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 text-sm hover:text-brand-600 cursor-pointer" onClick={() => onSelectEmployee(emp)}>
                            {emp.name}
                          </h5>
                          <span className="text-[11px] font-mono text-brand-600 font-medium">
                            {emp.employeeId}
                          </span>
                        </div>
                      </div>
                      <Badge status={emp.status}>{emp.status}</Badge>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center">
                        <Briefcase className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <span>{posName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center truncate">
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <Badge status={emp.employeeType}>{emp.employeeType}</Badge>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onSelectEmployee(emp)}
                          className="p-1 text-gray-400 hover:text-brand-600 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditEmployee(emp)}
                          className="p-1 text-gray-400 hover:text-amber-600 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {groupEmployees.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400">No employees</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
