import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Building2, Layers } from 'lucide-react';

/**
 * PayrollCharts - Responsive interactive enterprise charts powered by real backend payroll data
 *
 * @param {Object} props
 * @param {Object} props.charts - Real backend charts dataset
 * @param {Array} props.charts.salaryCostByDepartment - Department breakdown
 * @param {Array} props.charts.monthlyNetSalaryTrends - 6-month monthly trends
 * @param {boolean} [props.loading=false] - Loading status
 */
export const PayrollCharts = ({ charts = {}, loading = false }) => {
  const { salaryCostByDepartment = [], monthlyNetSalaryTrends = [] } = charts;

  const [hoveredTrend, setHoveredTrend] = useState(null);
  const [hoveredDept, setHoveredDept] = useState(null);

  // Compute totals for Department chart percentages
  const totalCompanySalary = salaryCostByDepartment.reduce(
    (sum, d) => sum + (d.totalSalary || 0),
    0
  );

  // Max value for Monthly Trends chart scaling
  const maxTrendSalary = Math.max(
    ...monthlyNetSalaryTrends.map((t) => Math.max(t.grossSalary || 0, t.netSalary || 0)),
    10000
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-pulse h-80 flex flex-col justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-100 rounded w-full" />
            <div className="h-6 bg-gray-100 rounded w-5/6" />
            <div className="h-6 bg-gray-100 rounded w-4/6" />
          </div>
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-pulse h-80 flex flex-col justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-48 bg-gray-100 rounded-xl" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Salary Cost by Department */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  Salary Cost by Department
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Remuneration expenditure proportion across teams
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
              Total: ₹{Number(totalCompanySalary).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Department Bar Breakdown */}
          <div className="mt-6 space-y-4">
            {salaryCostByDepartment.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No department expenditure records available
              </div>
            ) : (
              salaryCostByDepartment.map((dept, idx) => {
                const percentage =
                  totalCompanySalary > 0
                    ? Math.round((dept.totalSalary / totalCompanySalary) * 100)
                    : 0;
                const isHovered = hoveredDept === idx;

                return (
                  <div
                    key={dept.departmentName || idx}
                    onMouseEnter={() => setHoveredDept(idx)}
                    onMouseLeave={() => setHoveredDept(null)}
                    className={`p-2.5 rounded-xl transition-colors ${
                      isHovered ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900 font-bold truncate max-w-[180px]">
                          {dept.departmentName}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono px-1.5 py-0.5 rounded bg-gray-100">
                          {dept.employeeCount || 0} Staff
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-right">
                        <span className="text-gray-900 font-mono font-bold">
                          ₹{Number(dept.totalSalary).toLocaleString('en-IN')}
                        </span>
                        <span className="text-gray-400 text-[11px] font-normal w-8 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Real-time aggregation from active contracts & payruns</span>
          <span className="font-semibold text-gray-700">
            {salaryCostByDepartment.length} Active Departments
          </span>
        </div>
      </div>

      {/* 2. Monthly Net Salary Trends */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  Monthly Net Salary Trends
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Historical 6-month disbursement curve & volume
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-brand-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-600 mr-1.5" /> Net Pay
              </span>
              <span className="flex items-center text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 mr-1.5" /> Gross Pay
              </span>
            </div>
          </div>

          {/* SVG Multi-Bar Trend Chart */}
          <div className="mt-6">
            <div className="h-52 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6">
              {monthlyNetSalaryTrends.map((trend, idx) => {
                const netHeightPct =
                  maxTrendSalary > 0
                    ? Math.max(6, Math.round((trend.netSalary / maxTrendSalary) * 100))
                    : 6;
                const grossHeightPct =
                  maxTrendSalary > 0
                    ? Math.max(8, Math.round((trend.grossSalary / maxTrendSalary) * 100))
                    : 8;
                const isHovered = hoveredTrend === idx;

                return (
                  <div
                    key={trend.month || idx}
                    onMouseEnter={() => setHoveredTrend(idx)}
                    onMouseLeave={() => setHoveredTrend(null)}
                    className="relative flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-14 z-20 bg-slate-900 text-white text-[11px] rounded-xl py-1.5 px-3 shadow-xl whitespace-nowrap pointer-events-none transform -translate-y-1">
                        <p className="font-bold text-slate-200">{trend.label}</p>
                        <p className="text-emerald-400 font-mono font-semibold">
                          Net: ₹{Number(trend.netSalary).toLocaleString('en-IN')}
                        </p>
                        <p className="text-slate-400 font-mono text-[10px]">
                          Gross: ₹{Number(trend.grossSalary).toLocaleString('en-IN')} ({trend.payslipCount} slips)
                        </p>
                      </div>
                    )}

                    {/* Columns */}
                    <div className="w-full max-w-[40px] flex items-end justify-center space-x-1 h-full">
                      {/* Gross bar */}
                      <div
                        className={`w-1/2 rounded-t-md transition-all duration-300 ${
                          isHovered ? 'bg-slate-400' : 'bg-slate-200'
                        }`}
                        style={{ height: `${grossHeightPct}%` }}
                      />

                      {/* Net bar */}
                      <div
                        className={`w-1/2 rounded-t-md transition-all duration-300 ${
                          isHovered
                            ? 'bg-brand-700 shadow-md shadow-brand-500/20'
                            : 'bg-brand-600'
                        }`}
                        style={{ height: `${netHeightPct}%` }}
                      />
                    </div>

                    {/* Month Label */}
                    <span
                      className={`text-[10px] mt-2 font-medium truncate ${
                        isHovered ? 'text-brand-700 font-bold' : 'text-gray-500'
                      }`}
                    >
                      {trend.label ? trend.label.split(' ')[0] : trend.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Values calculated from live MongoDB payslip records</span>
          <span className="font-mono text-gray-600">Peak: ₹{Number(maxTrendSalary).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};
