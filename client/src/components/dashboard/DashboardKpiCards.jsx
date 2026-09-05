import React from 'react';
import { DollarSign, FileText, TrendingUp, Calendar, Activity } from 'lucide-react';
import { StatCard } from '../common/StatCard';

/**
 * DashboardKpiCards - Real-time primary operational & payroll KPIs
 *
 * @param {Object} props
 * @param {Object} props.kpis - KPI data computed from real backend APIs
 * @param {boolean} [props.loading=false] - Loading status
 */
export const DashboardKpiCards = ({ kpis = {}, loading = false }) => {
  const {
    totalNetPaid = 0,
    totalGrossPaid = 0,
    payslipsGenerated = 0,
    averageSalary = 0,
    approvedTimeOffDays = 0,
    attendanceHealth = 100,
  } = kpis;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
      {/* 1. Total Net Salary Paid */}
      <StatCard
        title="Total Net Salary Paid"
        value={`?${Number(totalNetPaid).toLocaleString('en-IN')}`}
        icon={DollarSign}
        color="emerald"
        loading={loading}
        description={
          totalGrossPaid > totalNetPaid
            ? `Gross: ?${Number(totalGrossPaid).toLocaleString('en-IN')}`
            : 'Total settled disbursements'
        }
        link="/payroll"
        linkLabel="View Payroll Engine"
      />

      {/* 2. Payslips Generated */}
      <StatCard
        title="Payslips Generated"
        value={Number(payslipsGenerated).toLocaleString('en-IN')}
        icon={FileText}
        color="brand"
        loading={loading}
        description="Official salary slips produced"
        link="/payroll?tab=payslips"
        linkLabel="Open Payslip Directory"
      />

      {/* 3. Average Salary */}
      <StatCard
        title="Average Salary"
        value={`?${Number(averageSalary).toLocaleString('en-IN')}`}
        icon={TrendingUp}
        color="indigo"
        loading={loading}
        description="Mean remuneration per staff"
        link="/payroll?tab=structures"
        linkLabel="Review Salary Rules"
      />

      {/* 4. Approved Time Off */}
      <StatCard
        title="Approved Time Off"
        value={`${Number(approvedTimeOffDays).toLocaleString('en-IN')} Days`}
        icon={Calendar}
        color="cyan"
        loading={loading}
        description="Approved employee leave days"
        link="/timeoff"
        linkLabel="Manage Time Off"
      />

      {/* 5. Attendance Health */}
      <StatCard
        title="Attendance Health"
        value={`${Math.round(attendanceHealth)}%`}
        icon={Activity}
        color="amber"
        loading={loading}
        trend={{
          value: attendanceHealth >= 90 ? 'Healthy' : attendanceHealth >= 75 ? 'Moderate' : 'Action Required',
          isPositive: attendanceHealth >= 80,
          label: 'On-time presence'
        }}
        description="Punctuality & presence rate"
        link="/attendance"
        linkLabel="Attendance Audit"
      />
    </div>
  );
};
