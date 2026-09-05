import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { contractApi } from '../../api/contractApi';
import { attendanceApi } from '../../api/attendanceApi';
import { timeOffRequestApi } from '../../api/timeOffRequestApi';
import { allocationApi } from '../../api/allocationApi';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { AttendanceList } from '../attendance/AttendanceList';
import { TimeOffRequestList } from '../timeoff/TimeOffRequestList';
import { AllocationList } from '../timeoff/AllocationList';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  Briefcase,
  Clock,
  FileText,
  ArrowLeft,
  Edit2,
  AlertCircle,
  Plus,
  ShieldAlert,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const EmployeeDetails = ({ employeeId, onBack, onEdit, onCreateContractForEmployee }) => {
  const { canManageHR } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'contracts' | 'attendance' | 'timeoff' | 'allocations'

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const empRes = await employeeApi.getById(employeeId);
        const empData = empRes.data;
        setEmployee(empData);

        // Fetch related records in parallel for accurate Smart Button counts & tabs
        try {
          const [ctrRes, attRes, toRes, alcRes] = await Promise.all([
            contractApi.getByEmployee(employeeId).catch(() => ({ data: [] })),
            attendanceApi.getAll({ employee: employeeId, limit: 100 }).catch(() => ({ data: [] })),
            timeOffRequestApi.getAll({ employee: employeeId, limit: 100 }).catch(() => ({ data: [] })),
            allocationApi.getAll({ employee: employeeId, limit: 100 }).catch(() => ({ data: [] })),
          ]);

          const extractArr = (res) => {
            if (Array.isArray(res?.data)) return res.data;
            if (Array.isArray(res?.data?.data)) return res.data.data;
            if (Array.isArray(res)) return res;
            return [];
          };

          const cList = extractArr(ctrRes);
          const aList = extractArr(attRes);
          const tList = extractArr(toRes);
          const alList = extractArr(alcRes);

          setContracts(cList);
          setAttendances(aList.length > 0 ? aList : (empData.attendances || []));
          setTimeOffRequests(tList.length > 0 ? tList : (empData.timeOffRequests || []));
          setAllocations(alList.length > 0 ? alList : (empData.allocations || []));
        } catch (subErr) {
          console.error('Error loading related employee smart button records:', subErr);
        }
      } catch (err) {
        setError(err.message || 'Failed to load employee details');
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) fetchDetails();
  }, [employeeId]);

  if (loading) return <LoadingSpinner fullScreen label="Loading employee profile and contract data..." />;

  if (error || !employee) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">{error || 'Employee not found'}</h3>
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </button>
      </div>
    );
  }

  const dept = typeof employee.department === 'object' ? employee.department : { name: employee.department };
  const position = typeof employee.jobPosition === 'object' ? employee.jobPosition : { name: employee.jobPosition };
  const manager = typeof employee.manager === 'object' ? employee.manager : null;
  const schedule = typeof employee.workingSchedule === 'object' ? employee.workingSchedule : null;
  const activeContract = typeof employee.activeContract === 'object' ? employee.activeContract : null;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
            {employee.name ? employee.name.charAt(0).toUpperCase() : 'E'}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
              <Badge status={employee.status}>{employee.status}</Badge>
            </div>
            <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
              <span className="font-mono bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-semibold">
                {employee.employeeId}
              </span>
              <span>•</span>
              <span>{position?.name || 'Position Unassigned'}</span>
              <span>•</span>
              <span>{dept?.name || 'Department Unassigned'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {canManageHR && (
            <>
              <button
                onClick={() => onCreateContractForEmployee(employee)}
                className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Contract
              </button>

              <button
                onClick={() => onEdit(employee)}
                className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Edit2 className="w-4 h-4 mr-1.5" /> Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      {/* Odoo-style Smart Buttons Grid (PDF Requirement B2) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Smart Button 1: Contracts */}
        <button
          onClick={() => setActiveTab('contracts')}
          className={`p-4 rounded-2xl border transition text-left flex items-center justify-between group shadow-xs ${
            activeTab === 'contracts'
              ? 'bg-brand-50/80 border-brand-300 ring-2 ring-brand-500/20'
              : 'bg-white border-gray-200 hover:border-brand-300 hover:bg-gray-50/80'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Contracts</div>
              <div className="text-xl font-extrabold text-gray-900">{contracts.length}</div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {activeContract ? 'Active' : 'None'}
          </span>
        </button>

        {/* Smart Button 2: Attendance */}
        <button
          onClick={() => setActiveTab('attendance')}
          className={`p-4 rounded-2xl border transition text-left flex items-center justify-between group shadow-xs ${
            activeTab === 'attendance'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-gray-200 hover:border-amber-300 hover:bg-gray-50/80'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Attendance</div>
              <div className="text-xl font-extrabold text-gray-900">{attendances.length}</div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            Logs
          </span>
        </button>

        {/* Smart Button 3: Time Off */}
        <button
          onClick={() => setActiveTab('timeoff')}
          className={`p-4 rounded-2xl border transition text-left flex items-center justify-between group shadow-xs ${
            activeTab === 'timeoff'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50/80'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Time Off</div>
              <div className="text-xl font-extrabold text-gray-900">{timeOffRequests.length}</div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
            Requests
          </span>
        </button>

        {/* Smart Button 4: Allocations */}
        <button
          onClick={() => setActiveTab('allocations')}
          className={`p-4 rounded-2xl border transition text-left flex items-center justify-between group shadow-xs ${
            activeTab === 'allocations'
              ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-500/20'
              : 'bg-white border-gray-200 hover:border-teal-300 hover:bg-gray-50/80'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Allocations</div>
              <div className="text-xl font-extrabold text-gray-900">{allocations.length}</div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
            Balances
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-4 sm:px-6 rounded-xl border overflow-x-auto">
        <nav className="flex space-x-4 sm:space-x-8 text-sm font-medium whitespace-nowrap min-w-max">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview & Contract
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`py-4 border-b-2 transition flex items-center ${
              activeTab === 'contracts'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Contract History ({contracts.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-4 border-b-2 transition flex items-center ${
              activeTab === 'attendance'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Attendance Logs ({attendances.length})
          </button>
          <button
            onClick={() => setActiveTab('timeoff')}
            className={`py-4 border-b-2 transition flex items-center ${
              activeTab === 'timeoff'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Time Off Requests ({timeOffRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`py-4 border-b-2 transition flex items-center ${
              activeTab === 'allocations'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Leave Allocations ({allocations.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity & Basic Info */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center border-b border-gray-100 pb-3">
              <User className="w-5 h-5 text-brand-600 mr-2" /> Identity Information
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Full Name</span>
                <span className="font-semibold text-gray-900">{employee.name}</span>
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Email</span>
                <span className="text-gray-700 flex items-center mt-0.5">
                  <Mail className="w-4 h-4 text-gray-400 mr-1.5" />
                  {employee.email}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Phone</span>
                <span className="text-gray-700 flex items-center mt-0.5">
                  <Phone className="w-4 h-4 text-gray-400 mr-1.5" />
                  {employee.phone || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Employee Type</span>
                <div className="mt-1">
                  <Badge status={employee.employeeType}>{employee.employeeType}</Badge>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Joining Date</span>
                <span className="text-gray-700 flex items-center mt-0.5">
                  <Calendar className="w-4 h-4 text-gray-400 mr-1.5" />
                  {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Org & Schedule */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center border-b border-gray-100 pb-3">
              <Building2 className="w-5 h-5 text-brand-600 mr-2" /> Organization & Schedule
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Department</span>
                <span className="font-semibold text-gray-900">{dept?.name || 'N/A'}</span>
                {dept?.code && <span className="ml-2 text-xs font-mono text-gray-400">({dept.code})</span>}
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Job Position</span>
                <span className="font-semibold text-gray-900">{position?.name || 'N/A'}</span>
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Manager</span>
                {manager ? (
                  <div className="font-semibold text-gray-900 flex items-center mt-0.5">
                    <User className="w-4 h-4 text-gray-400 mr-1.5" />
                    {manager.name} ({manager.employeeId})
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No manager (Top level)</span>
                )}
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">Working Schedule</span>
                {schedule ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mt-1 space-y-1">
                    <div className="font-semibold text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 text-brand-600 mr-1.5" />
                      {schedule.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {schedule.startTime} - {schedule.endTime} ({schedule.weeklyHours || 40} hrs/week)
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No schedule assigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Active Contract */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 text-brand-600 mr-2" /> Active Contract
              </h3>
              {activeContract && <Badge status={activeContract.status}>{activeContract.status}</Badge>}
            </div>

            {activeContract ? (
              <div className="space-y-4 text-sm">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <div className="text-xs text-emerald-700 font-semibold uppercase">Contract Number</div>
                  <div className="text-lg font-bold font-mono text-emerald-900">
                    {activeContract.contractNumber}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-gray-400 uppercase font-semibold block">Wage</span>
                    <span className="font-bold text-gray-900 text-base">
                      ₹{activeContract.wage ? activeContract.wage.toLocaleString('en-IN') : 0}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">/{activeContract.wageType || 'Annual'}</span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 uppercase font-semibold block">Basic Salary</span>
                    <span className="font-semibold text-gray-800">
                      ₹{activeContract.salaryStructure?.basic?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                </div>

                {/* Allowances & Deductions Summary */}
                {activeContract.salaryStructure && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div className="font-semibold text-gray-700">Salary Breakdown</div>
                    <div className="flex justify-between text-gray-600">
                      <span>House Rent Allowance:</span>
                      <span className="font-mono">₹{(activeContract.salaryStructure.allowances?.houseRent || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Transport Allowance:</span>
                      <span className="font-mono">₹{(activeContract.salaryStructure.allowances?.transport || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Income Tax Deduction:</span>
                      <span className="font-mono text-rose-600">
                        -₹{(activeContract.salaryStructure.deductions?.tax || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  <div>
                    Start Date: {activeContract.startDate ? new Date(activeContract.startDate).toLocaleDateString() : 'N/A'}
                  </div>
                  <div>
                    End Date: {activeContract.endDate ? new Date(activeContract.endDate).toLocaleDateString() : 'Indefinite / Permanent'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No Active Contract</p>
                <p className="text-xs text-gray-500 mt-1">This employee does not currently have an active contract.</p>
                {canManageHR && (
                  <button
                    onClick={() => onCreateContractForEmployee(employee)}
                    className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Create Contract Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Contract History */}
      {activeTab === 'contracts' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Contract History ({contracts.length})</h3>
            {canManageHR && (
              <button
                onClick={() => onCreateContractForEmployee(employee)}
                className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition"
              >
                <Plus className="w-4 h-4 mr-1" /> New Contract
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {contracts.map((ctr) => {
              const isActive = activeContract?._id === ctr._id || ctr.status === 'Active';
              return (
                <div key={ctr._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-gray-900">{ctr.contractNumber}</span>
                      <Badge status={ctr.status}>{ctr.status}</Badge>
                      {isActive && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Active Contract
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Period: {new Date(ctr.startDate).toLocaleDateString()} —{' '}
                      {ctr.endDate ? new Date(ctr.endDate).toLocaleDateString() : 'Present'}
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    <div>
                      <span className="text-xs text-gray-400 block">Wage</span>
                      <span className="font-bold text-gray-900">₹{ctr.wage?.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-gray-500">/{ctr.wageType || 'Annual'}</span>
                    </div>

                    <div>
                      <span className="text-xs text-gray-400 block">Basic Salary</span>
                      <span className="font-semibold text-gray-700">
                        ₹{ctr.salaryStructure?.basic?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {contracts.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">No contract records found.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Attendance Logs */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 text-brand-600 mr-2" /> Employee Attendance Logs ({attendances.length})
            </h3>
            <AttendanceList
              attendanceRecords={attendances.length > 0 ? attendances : (employee.attendances || [])}
              onManualCorrection={() => {}}
            />
            {attendances.length === 0 && (!employee.attendances || employee.attendances.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No attendance logs recorded for this employee.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Time Off Requests */}
      {activeTab === 'timeoff' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 text-brand-600 mr-2" /> Leave Requests History ({timeOffRequests.length})
            </h3>
            <TimeOffRequestList
              requests={timeOffRequests.length > 0 ? timeOffRequests : (employee.timeOffRequests || [])}
              onApprove={() => {}}
              onRefuse={() => {}}
              onCancel={() => {}}
            />
            {timeOffRequests.length === 0 && (!employee.timeOffRequests || employee.timeOffRequests.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No leave requests submitted for this employee.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Leave Allocations */}
      {activeTab === 'allocations' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 text-brand-600 mr-2" /> Leave Allocations ({allocations.length})
            </h3>
            <AllocationList
              allocations={allocations.length > 0 ? allocations : (employee.allocations || [])}
              balances={[]}
            />
            {allocations.length === 0 && (!employee.allocations || employee.allocations.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No leave allocations assigned to this employee.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
