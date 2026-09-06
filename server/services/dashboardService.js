const mongoose = require('mongoose');
const {
  Payslip,
  Payrun,
  Employee,
  Department,
  Contract,
  Attendance,
  TimeOffRequest,
  Allocation
} = require('../models');

/**
 * Helper to resolve start & end dates from period filter string
 */
const resolveDateRange = (period) => {
  const now = new Date();
  let startDate = null;
  let endDate = null;

  if (period === 'current-month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === 'last-month') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (period === 'last-3-months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === 'year-to-date') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (period && /^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-').map(Number);
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59, 999);
  }

  return { startDate, endDate };
};

/**
 * Aggregate real-time operational dashboard metrics for PeoplePay360
 */
const getDashboardSummary = async (query = {}, currentUser = {}) => {
  const { period = 'all', department, employeeType } = query;
  const { startDate, endDate } = resolveDateRange(period);
  const now = new Date();

  // 1. Build Employee Filter & fetch target employees
  const empFilter = {};
  if (department && mongoose.Types.ObjectId.isValid(department)) {
    empFilter.department = new mongoose.Types.ObjectId(department);
  }
  if (employeeType) {
    empFilter.employeeType = employeeType;
  }

  // If currentUser is an Employee, restrict visibility to self
  if (currentUser.role === 'Employee') {
    const empId = currentUser.employee?._id || currentUser.employee;
    if (empId) {
      empFilter._id = new mongoose.Types.ObjectId(empId);
    }
  }

  const employees = await Employee.find(empFilter)
    .populate('department', 'name code')
    .select('_id name employeeId department employeeType status activeContract bankDetails')
    .lean();

  const employeeIds = employees.map((e) => e._id);

  // 2. Payslip & Payrun Filters
  const payslipFilter = { employee: { $in: employeeIds } };
  if (startDate && endDate) {
    payslipFilter['period.startDate'] = { $gte: startDate, $lte: endDate };
  }

  // Retrieve matching payslips
  const payslips = await Payslip.find(payslipFilter)
    .populate('employee', 'name employeeId department')
    .populate('payrun', 'name period status')
    .lean();

  // All payruns for operational alerts
  const payruns = await Payrun.find({}).sort({ createdAt: -1 }).lean();

  // 3. KPI Calculations
  const paidPayslips = payslips.filter((p) => p.status === 'Paid');
  const totalNetPaid = paidPayslips.reduce((sum, p) => sum + (p.net || 0), 0);
  const totalGrossPaid = paidPayslips.reduce((sum, p) => sum + (p.gross || 0), 0);
  const payslipsGenerated = payslips.length;

  let averageSalary = 0;
  if (paidPayslips.length > 0) {
    averageSalary = Math.round(totalNetPaid / paidPayslips.length);
  } else if (payslips.length > 0) {
    const totalNetComputed = payslips.reduce((sum, p) => sum + (p.net || 0), 0);
    averageSalary = Math.round(totalNetComputed / payslips.length);
  } else {
    // Fallback to active contract wages for the filtered employees
    const activeContracts = await Contract.find({
      employee: { $in: employeeIds },
      status: 'Active'
    }).select('wage').lean();
    if (activeContracts.length > 0) {
      const sumWage = activeContracts.reduce((s, c) => s + (c.wage || 0), 0);
      averageSalary = Math.round(sumWage / activeContracts.length);
    }
  }

  // 4. Attendance Aggregations
  const attFilter = { employee: { $in: employeeIds } };
  if (startDate && endDate) {
    attFilter.date = { $gte: startDate, $lte: endDate };
  }

  const attendanceRecords = await Attendance.find(attFilter).lean();
  const presentCount = attendanceRecords.filter((a) => a.status === 'Present').length;
  const lateCount = attendanceRecords.filter((a) => a.status === 'Late').length;
  const halfDayCount = attendanceRecords.filter((a) => a.status === 'Half-Day').length;
  const absentCount = attendanceRecords.filter((a) => a.status === 'Absent').length;
  const overtimeHours = attendanceRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
  const missingCheckouts = attendanceRecords.filter((a) => a.checkIn && !a.checkOut).length;
  const manualEdits = attendanceRecords.filter((a) => a.isManuallyCorrected === true).length;
  const totalAttendanceLogs = attendanceRecords.length;

  // Attendance health rate: on-time or present / total scheduled days
  let attendanceHealth = 100;
  if (totalAttendanceLogs > 0) {
    const positiveLogs = presentCount + halfDayCount * 0.5;
    attendanceHealth = Math.min(100, Math.round((positiveLogs / totalAttendanceLogs) * 100));
  }

  const attendanceCoverage = totalAttendanceLogs > 0
    ? Math.min(100, Math.round(((presentCount + lateCount + halfDayCount) / totalAttendanceLogs) * 100))
    : 100;

  // 5. Time Off Aggregations
  const timeOffFilter = { employee: { $in: employeeIds } };
  if (startDate && endDate) {
    timeOffFilter.startDate = { $gte: startDate, $lte: endDate };
  }

  const [timeOffRequests, allocations] = await Promise.all([
    TimeOffRequest.find(timeOffFilter).lean(),
    Allocation.find({ employee: { $in: employeeIds } }).lean()
  ]);

  const approvedRequests = timeOffRequests.filter((t) => t.status === 'Approved');
  const approvedTimeOffDays = approvedRequests.reduce((sum, t) => sum + (t.duration || 0), 0);
  const pendingRequestsCount = timeOffRequests.filter((t) => t.status === 'Pending').length;
  const refusedRequestsCount = timeOffRequests.filter((t) => t.status === 'Refused').length;

  const totalAllocatedDays = allocations.reduce((sum, a) => sum + (a.allocatedDays || a.totalDays || 0), 0);
  const totalTakenDays = allocations.reduce((sum, a) => sum + (a.takenDays || a.usedDays || 0), 0);
  const remainingLeaveDays = Math.max(0, totalAllocatedDays - totalTakenDays);

  // 6. Department Breakdown & Salary Cost by Department
  const allDepartments = await Department.find({}).sort({ name: 1 }).lean();
  const allActiveContracts = await Contract.find({
    status: 'Active',
    employee: { $in: employeeIds }
  }).lean();

  const contractMapByEmp = new Map();
  allActiveContracts.forEach((c) => {
    contractMapByEmp.set(String(c.employee), c);
  });

  const departmentBreakdown = allDepartments.map((dept) => {
    const deptEmployees = employees.filter(
      (e) => e.department && String(e.department._id || e.department) === String(dept._id)
    );

    const deptPayslips = payslips.filter((p) => {
      const emp = employees.find((e) => String(e._id) === String(p.employee?._id || p.employee));
      return emp && emp.department && String(emp.department._id || emp.department) === String(dept._id);
    });

    let totalExpenditure = deptPayslips.reduce((sum, p) => sum + (p.net || p.gross || 0), 0);
    // If no payslips recorded yet for this period, estimate from active contract wages
    if (totalExpenditure === 0) {
      deptEmployees.forEach((e) => {
        const ctr = contractMapByEmp.get(String(e._id));
        if (ctr) totalExpenditure += ctr.wage || 0;
      });
    }

    const activeContractsCount = deptEmployees.filter((e) => contractMapByEmp.has(String(e._id))).length;
    const avgSalaryInDept = deptEmployees.length > 0 ? Math.round(totalExpenditure / deptEmployees.length) : 0;

    return {
      departmentId: dept._id,
      name: dept.name,
      code: dept.code || dept.name.slice(0, 3).toUpperCase(),
      headcount: deptEmployees.length,
      totalSalaryExpenditure: totalExpenditure,
      activeContractsCount,
      avgSalary: avgSalaryInDept
    };
  });

  const salaryCostByDepartment = departmentBreakdown.map((d) => ({
    departmentName: d.name,
    code: d.code,
    totalSalary: d.totalSalaryExpenditure,
    employeeCount: d.headcount
  }));

  // 7. Monthly Net Salary Trends (Historical Last 6 Months)
  const monthlyTrendsMap = new Map();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Initialize last 6 months buckets
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthlyTrendsMap.set(key, {
      month: key,
      label,
      netSalary: 0,
      grossSalary: 0,
      payslipCount: 0
    });
  }

  // Populate actual payslips into trend buckets
  const allHistoricalPayslips = await Payslip.find({
    employee: { $in: employeeIds }
  }).lean();

  allHistoricalPayslips.forEach((p) => {
    const pDate = p.period?.startDate ? new Date(p.period.startDate) : new Date(p.createdAt);
    const key = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyTrendsMap.has(key)) {
      const bucket = monthlyTrendsMap.get(key);
      bucket.netSalary += (p.net || 0);
      bucket.grossSalary += (p.gross || 0);
      bucket.payslipCount += 1;
    }
  });

  const monthlyNetSalaryTrends = Array.from(monthlyTrendsMap.values());

  // 8. Operational Alerts
  // A. Payroll Status Alert
  const draftPayruns = payruns.filter((pr) => pr.status === 'Draft' || pr.status === 'Computed');
  const payrollStatusAlert = {
    status: draftPayruns.length > 0 ? 'warning' : 'healthy',
    count: draftPayruns.length,
    title: draftPayruns.length > 0
      ? `${draftPayruns.length} Payrun(s) Require Action`
      : 'All Payruns Processed',
    message: draftPayruns.length > 0
      ? `There are ${draftPayruns.length} payruns in Draft/Computed status awaiting validation or payment.`
      : 'No unverified payruns. All pay cycles are reconciled.',
    items: draftPayruns.slice(0, 3).map((pr) => ({ id: pr._id, name: pr.name, status: pr.status }))
  };

  // B. Missing Required Information Alert
  const missingContractEmployees = employees.filter((e) => !contractMapByEmp.has(String(e._id)) && e.status === 'Active');
  const missingBankEmployees = employees.filter((e) => !e.bankDetails?.accountNumber && e.status === 'Active');
  const totalMissingInfoCount = missingContractEmployees.length + missingBankEmployees.length;

  const missingInfoAlert = {
    status: totalMissingInfoCount > 0 ? 'danger' : 'healthy',
    count: totalMissingInfoCount,
    title: totalMissingInfoCount > 0 ? `${totalMissingInfoCount} Incomplete Records` : 'Employee Profiles Complete',
    message: totalMissingInfoCount > 0
      ? `${missingContractEmployees.length} active staff lack active contracts; ${missingBankEmployees.length} lack bank details.`
      : 'All active employees have verified contracts and banking coordinates.',
    missingContractCount: missingContractEmployees.length,
    missingBankCount: missingBankEmployees.length
  };

  // C. Duplicate Payslips Alert
  const duplicateMap = new Map();
  const duplicateList = [];

  payslips.forEach((p) => {
    const empId = String(p.employee?._id || p.employee);
    const periodKey = p.period?.startDate
      ? new Date(p.period.startDate).toISOString().slice(0, 7)
      : String(p.payrun?._id || p.payrun);
    const key = `${empId}_${periodKey}`;
    if (duplicateMap.has(key)) {
      duplicateList.push({
        payslipId: p._id,
        payslipNumber: p.payslipNumber,
        employeeName: p.employee?.name || 'Staff'
      });
    } else {
      duplicateMap.set(key, p._id);
    }
  });

  const duplicatePayslipsAlert = {
    status: duplicateList.length > 0 ? 'warning' : 'healthy',
    count: duplicateList.length,
    title: duplicateList.length > 0
      ? `${duplicateList.length} Duplicate Payslip(s) Detected`
      : 'Zero Duplicate Payslips',
    message: duplicateList.length > 0
      ? 'Multiple payslips exist for the same employee within the same cycle period.'
      : 'All payslip issuances are unique per employee per pay cycle.',
    items: duplicateList.slice(0, 3)
  };

  // D. Contract Attention Items Alert
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringSoonContracts = allActiveContracts.filter((c) => {
    if (!c.endDate) return false;
    const end = new Date(c.endDate);
    return end >= now && end <= thirtyDaysFromNow;
  });
  const expiredActiveContracts = allActiveContracts.filter((c) => {
    if (!c.endDate) return false;
    return new Date(c.endDate) < now;
  });
  const contractAttentionCount = expiringSoonContracts.length + expiredActiveContracts.length;

  const contractAttentionAlert = {
    status: contractAttentionCount > 0 ? 'warning' : 'healthy',
    count: contractAttentionCount,
    title: contractAttentionCount > 0
      ? `${contractAttentionCount} Contract(s) Require Review`
      : 'Contracts In Good Standing',
    message: contractAttentionCount > 0
      ? `${expiringSoonContracts.length} contract(s) expiring within 30 days; ${expiredActiveContracts.length} expired.`
      : 'All active contracts are well within their valid coverage periods.',
    expiringSoonCount: expiringSoonContracts.length,
    expiredCount: expiredActiveContracts.length
  };

  return {
    kpis: {
      totalNetPaid,
      totalGrossPaid,
      payslipsGenerated,
      averageSalary,
      approvedTimeOffDays,
      attendanceHealth
    },
    charts: {
      salaryCostByDepartment,
      monthlyNetSalaryTrends
    },
    alerts: {
      payrollStatus: payrollStatusAlert,
      missingRequiredInfo: missingInfoAlert,
      duplicatePayslips: duplicatePayslipsAlert,
      contractAttention: contractAttentionAlert
    },
    attendance: {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      halfDay: halfDayCount,
      overtimeHours,
      missingCheckouts,
      manualEdits,
      totalLogs: totalAttendanceLogs,
      attendanceHealth,
      attendanceCoverage
    },
    timeOff: {
      approvedDays: approvedTimeOffDays,
      pendingRequests: pendingRequestsCount,
      refusedRequests: refusedRequestsCount,
      totalAllocatedDays,
      totalTakenDays,
      remainingLeaveDays
    },
    departmentBreakdown,
    meta: {
      period,
      selectedDepartment: department || null,
      selectedEmployeeType: employeeType || null,
      totalFilteredEmployees: employees.length,
      generatedAt: new Date().toISOString()
    }
  };
};

module.exports = {
  getDashboardSummary
};
