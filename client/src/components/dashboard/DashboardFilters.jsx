import React, { useState, useEffect } from 'react';
import { Filter, Calendar, Building2, UserCheck, RefreshCw, RotateCcw } from 'lucide-react';
import { departmentApi } from '../../api/departmentApi';

/**
 * DashboardFilters - Real-time filtering controls for Period, Department, and Employee Type
 *
 * @param {Object} props
 * @param {Object} props.filters - Active filters { period, department, employeeType }
 * @param {Function} props.onFilterChange - Callback when a filter is changed
 * @param {Function} props.onRefresh - Callback to refresh live data
 * @param {boolean} [props.loading=false] - Loading indicator
 */
export const DashboardFilters = ({
  filters = { period: 'all', department: '', employeeType: '' },
  onFilterChange,
  onRefresh,
  loading = false,
}) => {
  const [departments, setDepartments] = useState([]);

  // Fetch real department list from database
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await departmentApi.getAll();
        setDepartments(res.data || []);
      } catch (err) {
        console.error('Failed to load departments for dashboard filter', err);
      }
    };
    fetchDepartments();
  }, []);

  const handlePeriodSelect = (e) => {
    onFilterChange({ ...filters, period: e.target.value });
  };

  const handleDepartmentSelect = (e) => {
    onFilterChange({ ...filters, department: e.target.value });
  };

  const handleEmployeeTypeSelect = (e) => {
    onFilterChange({ ...filters, employeeType: e.target.value });
  };

  const handleReset = () => {
    onFilterChange({ period: 'all', department: '', employeeType: '' });
  };

  const hasActiveFilters =
    filters.period !== 'all' || Boolean(filters.department) || Boolean(filters.employeeType);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">
              Dashboard Metrics Filter
            </h3>
            <p className="text-[11px] text-gray-400">
              Query backend database dynamically by timeframe, department, and employment terms
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Period Selector */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
            Time Period
          </label>
          <select
            value={filters.period}
            onChange={handlePeriodSelect}
            disabled={loading}
            className="w-full text-xs font-medium bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          >
            <option value="all">All Available Cycles</option>
            <option value="current-month">Current Month</option>
            <option value="last-month">Previous Month</option>
            <option value="last-3-months">Last 3 Months</option>
            <option value="year-to-date">Year to Date (YTD)</option>
          </select>
        </div>

        {/* 2. Department Selector */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center">
            <Building2 className="w-3.5 h-3.5 mr-1 text-gray-400" />
            Department
          </label>
          <select
            value={filters.department}
            onChange={handleDepartmentSelect}
            disabled={loading}
            className="w-full text-xs font-medium bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code || 'DEP'})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Employee Type Selector */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-gray-400" />
            Employee Type
          </label>
          <select
            value={filters.employeeType}
            onChange={handleEmployeeTypeSelect}
            disabled={loading}
            className="w-full text-xs font-medium bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          >
            <option value="">All Types (Full-Time, Part-Time, etc.)</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
          </select>
        </div>
      </div>
    </div>
  );
};
