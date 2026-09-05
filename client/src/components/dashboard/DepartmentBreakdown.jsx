import React from 'react';
import { Building2, Users, DollarSign, Layers } from 'lucide-react';
import { DataTable } from '../common/DataTable';

/**
 * DepartmentBreakdown - Enterprise department breakdown reporting headcount and salary expenditure
 *
 * @param {Object} props
 * @param {Array} props.departments - Array of department records with headcount and salary metrics
 * @param {boolean} [props.loading=false] - Loading indicator
 */
export const DepartmentBreakdown = ({ departments = [], loading = false }) => {
  const totalCompanyExpenditure = departments.reduce(
    (sum, d) => sum + (d.totalSalaryExpenditure || 0),
    0
  );

  const totalHeadcount = departments.reduce(
    (sum, d) => sum + (d.headcount || 0),
    0
  );

  const columns = [
    {
      key: 'name',
      label: 'Department Name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-brand-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {row.code || row.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-gray-900 text-xs sm:text-sm">
              {row.name}
            </div>
            <div className="text-[11px] text-gray-400 font-mono">
              Dept ID: {String(row.departmentId).slice(-6)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'headcount',
      label: 'Headcount',
      align: 'center',
      render: (row) => (
        <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-gray-800 text-xs font-semibold">
          <Users className="w-3.5 h-3.5 text-gray-500 mr-1" />
          <span>{row.headcount} Staff</span>
        </div>
      ),
    },
    {
      key: 'activeContractsCount',
      label: 'Active Contracts',
      align: 'center',
      render: (row) => (
        <span className="text-xs font-medium text-gray-600">
          {row.activeContractsCount} of {row.headcount}
        </span>
      ),
    },
    {
      key: 'totalSalaryExpenditure',
      label: 'Total Salary Expenditure',
      align: 'right',
      render: (row) => (
        <div>
          <div className="font-mono text-xs sm:text-sm font-extrabold text-gray-900">
            ?{Number(row.totalSalaryExpenditure).toLocaleString('en-IN')}
          </div>
          {totalCompanyExpenditure > 0 && (
            <div className="text-[10px] text-gray-400">
              {Math.round((row.totalSalaryExpenditure / totalCompanyExpenditure) * 100)}% of total
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'avgSalary',
      label: 'Avg Salary / Head',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-lg">
          ?{Number(row.avgSalary).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center">
            <Building2 className="w-4 h-4 mr-1.5 text-brand-600" />
            Departmental Remuneration & Workforce Breakdown
          </h3>
          <p className="text-[11px] text-gray-500">
            Departmental resource allocations, verified active headcount, and payroll burdens
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="bg-slate-100 text-gray-700 px-2.5 py-1 rounded-lg font-semibold">
            {totalHeadcount} Total Staff
          </span>
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold font-mono">
            ?{Number(totalCompanyExpenditure).toLocaleString('en-IN')} Total Cost
          </span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={departments}
        loading={loading}
        keyField="departmentId"
        emptyTitle="No Departmental Data Found"
        emptyDescription="No department records match the selected operational filters."
      />
    </div>
  );
};
