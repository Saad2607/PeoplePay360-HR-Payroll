import React from 'react';
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  UserX,
  Zap,
  Edit3,
  Percent,
  ArrowRight,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * AttendanceTimeOffOverview - Consolidated operational attendance & time off metrics
 *
 * @param {Object} props
 * @param {Object} props.attendance - Attendance breakdown dataset
 * @param {Object} props.timeOff - Time off & leave balance dataset
 * @param {boolean} [props.loading=false] - Loading indicator
 */
export const AttendanceTimeOffOverview = ({
  attendance = {},
  timeOff = {},
  loading = false,
}) => {
  const {
    present = 0,
    late = 0,
    absent = 0,
    halfDay = 0,
    overtimeHours = 0,
    missingCheckouts = 0,
    manualEdits = 0,
    attendanceCoverage = 100,
    totalLogs = 0,
  } = attendance;

  const {
    approvedDays = 0,
    pendingRequests = 0,
    refusedRequests = 0,
    totalAllocatedDays = 0,
    totalTakenDays = 0,
    remainingLeaveDays = 0,
  } = timeOff;

  const leaveUtilizationRate =
    totalAllocatedDays > 0
      ? Math.round((totalTakenDays / totalAllocatedDays) * 100)
      : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-pulse h-64 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-pulse h-64 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Attendance Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  Attendance Operations
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Shift logging, punctuality, and checkout compliance
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {attendanceCoverage}% Coverage
              </span>
            </div>
          </div>

          {/* 7 Required Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {/* Present */}
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
                <span>Present</span>
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black text-emerald-900 mt-1">
                {present}
              </div>
              <span className="text-[10px] text-emerald-600">On-time clock-in</span>
            </div>

            {/* Late */}
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
                <span>Late</span>
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black text-amber-900 mt-1">
                {late}
              </div>
              <span className="text-[10px] text-amber-600">Tardy arrivals</span>
            </div>

            {/* Absent */}
            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
                <span>Absent</span>
                <UserX className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black text-rose-900 mt-1">
                {absent}
              </div>
              <span className="text-[10px] text-rose-600">Unexcused missed</span>
            </div>

            {/* Overtime */}
            <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-purple-700 text-xs font-semibold">
                <span>Overtime</span>
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black text-purple-900 mt-1">
                {overtimeHours} <span className="text-xs font-normal">hrs</span>
              </div>
              <span className="text-[10px] text-purple-600">Extra logged time</span>
            </div>

            {/* Missing Checkouts */}
            <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-orange-700 text-xs font-semibold">
                <span>Missing Checkouts</span>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black text-orange-900 mt-1">
                {missingCheckouts}
              </div>
              <span className="text-[10px] text-orange-600">Unclosed shifts</span>
            </div>

            {/* Manual Edits */}
            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
                <span>Manual Edits</span>
                <Edit3 className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black text-blue-900 mt-1">
                {manualEdits}
              </div>
              <span className="text-[10px] text-blue-600">Admin corrections</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {totalLogs} total shift logs registered
          </span>
          <Link
            to="/attendance"
            className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
          >
            <span>Open Attendance Module</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>

      {/* 2. Time Off Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  Time Off & Leaves
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Quota balances, approved leaves, and pending approvals
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
                {remainingLeaveDays} Days Remaining
              </span>
            </div>
          </div>

          {/* Time Off Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {/* Approved Days */}
            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 block">
                  Approved Days
                </span>
                <div className="text-2xl font-black text-emerald-950 mt-0.5">
                  {approvedDays} <span className="text-xs font-medium text-emerald-700">Days</span>
                </div>
                <span className="text-[11px] text-emerald-600">Settled and deducted</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
            </div>

            {/* Pending Requests */}
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-800 block">
                  Pending Requests
                </span>
                <div className="text-2xl font-black text-amber-950 mt-0.5">
                  {pendingRequests} <span className="text-xs font-medium text-amber-700">Requests</span>
                </div>
                <span className="text-[11px] text-amber-600">Awaiting supervisor action</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Leave Quota Utilization Progress Track */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span>Organizational Leave Pool Utilization</span>
              <span className="font-mono text-brand-700">{leaveUtilizationRate}% Utilized</span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-brand-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(leaveUtilizationRate, 4))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
              <span>Used: <strong className="text-gray-800">{totalTakenDays} Days</strong></span>
              <span>Total Pool: <strong className="text-gray-800">{totalAllocatedDays} Days</strong></span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {refusedRequests} refused/cancelled applications
          </span>
          <Link
            to="/timeoff"
            className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
          >
            <span>Review Leave Requests</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
