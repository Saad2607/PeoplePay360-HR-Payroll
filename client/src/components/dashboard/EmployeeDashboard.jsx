import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi } from '../../api/attendanceApi';
import { allocationApi } from '../../api/allocationApi';
import { timeOffRequestApi } from '../../api/timeOffRequestApi';
import { payslipApi } from '../../api/payslipApi';
import { TimeOffRequestFormModal } from '../timeoff/TimeOffRequestFormModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Toast } from '../common/Toast';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  FileText,
  IndianRupee,
  Download,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Building2,
  CalendarCheck,
  Plus
} from 'lucide-react';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const employeeId = user?.employee?._id || user?.employee;

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Attendance State
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState([]);

  // Leaves & Balances
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Payslips
  const [latestPayslip, setLatestPayslip] = useState(null);

  // Timer for clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadEmployeeData = async () => {
    setLoading(true);
    try {
      // 1. Fetch recent attendance
      if (employeeId) {
        try {
          const attRes = await attendanceApi.getEmployeeHistory(employeeId);
          const list = attRes.data || [];
          setRecentAttendance(list.slice(0, 5));

          // Check if checked in today
          const todayStr = new Date().toISOString().split('T')[0];
          const todayLog = list.find((a) => a.date && a.date.startsWith(todayStr));
          setTodayAttendance(todayLog || null);
        } catch {
          setRecentAttendance([]);
        }

        // 2. Fetch leave balances & requests
        try {
          const [balRes, reqRes] = await Promise.all([
            allocationApi.getEmployeeBalance(employeeId),
            timeOffRequestApi.getAll({ limit: 5 })
          ]);
          setLeaveBalances(balRes.data || []);
          setRecentRequests(reqRes.data || []);
        } catch {
          setLeaveBalances([]);
          setRecentRequests([]);
        }
      }

      // 3. Fetch latest payslip
      try {
        const psRes = await payslipApi.getAll({ limit: 1 });
        const list = psRes.data || [];
        setLatestPayslip(list[0] || null);
      } catch {
        setLatestPayslip(null);
      }
    } catch (err) {
      console.error('Error loading employee self-service data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);

  // Check In handler
  const handleCheckIn = async () => {
    if (!employeeId) {
      setToast({ message: 'No linked employee profile found.', type: 'error' });
      return;
    }
    setPunchLoading(true);
    try {
      const res = await attendanceApi.checkIn({ employeeId });
      setTodayAttendance(res.data);
      setToast({ message: 'Checked in successfully! Have a productive day.', type: 'success' });
      loadEmployeeData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to check in', type: 'error' });
    } finally {
      setPunchLoading(false);
    }
  };

  // Check Out handler
  const handleCheckOut = async () => {
    if (!employeeId) return;
    setPunchLoading(true);
    try {
      const res = await attendanceApi.checkOut({ employeeId });
      setTodayAttendance(res.data);
      setToast({ message: 'Checked out successfully! See you tomorrow.', type: 'success' });
      loadEmployeeData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to check out', type: 'error' });
    } finally {
      setPunchLoading(false);
    }
  };

  // Download PDF
  const handleDownloadPayslip = async (payslipId, slipNum) => {
    try {
      const blob = await payslipApi.downloadPdf(payslipId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${slipNum || payslipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setToast({ message: 'Payslip downloaded successfully', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to download payslip PDF', type: 'error' });
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading Employee Self-Service portal..." />;
  }

  const isCheckedIn = !!todayAttendance && !todayAttendance.checkOut;
  const isCompletedDay = !!todayAttendance && !!todayAttendance.checkOut;

  return (
    <div className="space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Profile & Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
              Employee Self-Service Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name}!
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              {user?.employee?.department?.name && (
                <span className="inline-flex items-center">
                  <Building2 className="w-4 h-4 mr-1 text-slate-400" />
                  {user.employee.department.name}
                </span>
              )}
              {user?.employee?.jobPosition?.name && (
                <span className="inline-flex items-center">
                  <Briefcase className="w-4 h-4 mr-1 text-slate-400" />
                  {user.employee.jobPosition.name}
                </span>
              )}
              {user?.employee?.employeeId && (
                <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-xs text-brand-200">
                  ID: {user.employee.employeeId}
                </span>
              )}
            </div>
          </div>

          {/* Real-time Clock Widget */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[200px]">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Current Time
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {currentTime.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Punch Clock Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isCheckedIn
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : isCompletedDay
                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                : 'bg-amber-50 text-amber-600 border border-amber-100'
            }`}
          >
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Today's Attendance Status
            </span>
            <div className="text-lg font-bold text-gray-900 mt-0.5 flex items-center gap-2">
              {isCheckedIn && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-emerald-700">Checked In</span>
                  <span className="text-xs text-gray-500 font-normal">
                    (since {new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                </>
              )}
              {isCompletedDay && (
                <>
                  <span className="text-blue-700">Completed Shift</span>
                  <span className="text-xs text-gray-500 font-normal">
                    ({todayAttendance.workedHours?.toFixed(2) || 8} hrs logged)
                  </span>
                </>
              )}
              {!todayAttendance && <span className="text-gray-600">Not Checked In Yet</span>}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Working Schedule: {user?.employee?.workingSchedule?.name || 'Standard 40-Hour Week (09:00 - 18:00)'}
            </p>
          </div>
        </div>

        {/* Punch Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {!isCheckedIn && !isCompletedDay && (
            <button
              onClick={handleCheckIn}
              disabled={punchLoading}
              className="flex-1 md:flex-none inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm hover:shadow transition disabled:opacity-50"
            >
              <LogIn className="w-5 h-5 mr-2" />
              {punchLoading ? 'Checking In...' : 'Check In Now'}
            </button>
          )}

          {isCheckedIn && (
            <button
              onClick={handleCheckOut}
              disabled={punchLoading}
              className="flex-1 md:flex-none inline-flex items-center justify-center px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm hover:shadow transition disabled:opacity-50"
            >
              <LogOut className="w-5 h-5 mr-2" />
              {punchLoading ? 'Checking Out...' : 'Check Out Now'}
            </button>
          )}

          {isCompletedDay && (
            <span className="inline-flex items-center px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
              Daily Shift Completed
            </span>
          )}
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <CalendarCheck className="w-5 h-5 mr-2 text-brand-600" />
            My Leave Balances
          </h2>
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Apply For Leave
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaveBalances.length > 0 ? (
            leaveBalances.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {item.timeOffType?.name || 'Leave'}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-brand-50 text-brand-700">
                    Year {item.year || new Date().getFullYear()}
                  </span>
                </div>
                <div className="my-3">
                  <div className="text-3xl font-extrabold text-gray-900">
                    {item.remainingDays || 0}
                    <span className="text-sm font-medium text-gray-400 ml-1">days left</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Allocated: {item.allocatedDays || 0} | Used: {item.usedDays || 0}
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        item.allocatedDays ? (item.usedDays / item.allocatedDays) * 100 : 0
                      )}%`
                    }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 bg-white p-6 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500 text-sm">
              Standard annual leaves are active. Contact HR if your balance card is pending allocation.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Recent Attendance & Latest Payslip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance Logs (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-indigo-600" />
            Recent Attendance History
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Check In</th>
                  <th className="py-2.5 px-3">Check Out</th>
                  <th className="py-2.5 px-3">Logged Hours</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentAttendance.length > 0 ? (
                  recentAttendance.map((rec) => (
                    <tr key={rec._id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3 font-medium text-gray-900">
                        {new Date(rec.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-mono text-xs">
                        {rec.checkIn
                          ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-mono text-xs">
                        {rec.checkOut
                          ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-700">
                        {rec.workedHours ? `${rec.workedHours.toFixed(1)} hrs` : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            rec.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rec.status === 'Late'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-gray-400 text-xs">
                      No attendance history recorded yet. Punch in above to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Payslip & Contract Quick View (1 col) */}
        <div className="space-y-6">
          {/* Latest Payslip Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <IndianRupee className="w-5 h-5 mr-1.5 text-emerald-600" />
                Latest Payslip
              </h3>
              <span className="text-xs text-gray-400 font-mono">Confidential</span>
            </div>

            {latestPayslip ? (
              <div className="space-y-4">
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                  <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider block">
                    Net Disbursed
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-800 mt-1">
                    ₹{(latestPayslip.net ?? latestPayslip.netSalary ?? 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-xs text-emerald-600 mt-1 block">
                    Period: {latestPayslip.period?.startDate ? new Date(latestPayslip.period.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Current Cycle'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Basic Salary</span>
                    <span className="font-semibold text-gray-900">
                      ₹{(latestPayslip.basic ?? latestPayslip.basicSalary ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Total Allowances</span>
                    <span className="font-semibold text-emerald-600">
                      +₹{(latestPayslip.allowances ?? latestPayslip.totalAllowances ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Total Deductions</span>
                    <span className="font-semibold text-rose-600">
                      -₹{(latestPayslip.deductions ?? latestPayslip.totalDeductions ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadPayslip(latestPayslip._id, latestPayslip.payslipNumber)}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Slip
                </button>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                No payslip issued yet for this month.
              </div>
            )}
          </div>

          {/* Active Contract Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-brand-600" />
              Contract Overview
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Contract No:</span>
                <span className="font-mono font-semibold text-gray-900">
                  {user?.employee?.activeContract?.contractNumber || 'CTR-ACTIVE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-semibold text-gray-900">
                  {user?.employee?.employeeType || 'Full-Time'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                  {user?.employee?.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Application Modal */}
      {isLeaveModalOpen && (
        <TimeOffRequestFormModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          onSuccess={() => {
            setIsLeaveModalOpen(false);
            setToast({ message: 'Leave request submitted successfully for approval', type: 'success' });
            loadEmployeeData();
          }}
        />
      )}
    </div>
  );
};
