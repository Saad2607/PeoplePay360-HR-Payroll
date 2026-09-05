const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const WorkingSchedule = require('../models/WorkingSchedule');

/**
 * Helper to extract target employee ID from request & user role
 */
const resolveEmployeeId = (user, bodyEmployeeId) => {
  if (user.role === 'Employee') {
    const empId = user.employee?._id || user.employee;
    if (!empId) {
      const error = new Error('No employee profile is linked to your user account.');
      error.statusCode = 400;
      throw error;
    }
    return empId;
  }
  return bodyEmployeeId || user.employee?._id || user.employee;
};

/**
 * Check-in an employee
 */
const checkIn = async ({ user, employeeId, checkInTime, notes }) => {
  const targetEmployeeId = resolveEmployeeId(user, employeeId);
  if (!targetEmployeeId) {
    const error = new Error('Employee ID is required for check-in.');
    error.statusCode = 400;
    throw error;
  }

  const employee = await Employee.findById(targetEmployeeId).populate('workingSchedule');
  if (!employee) {
    const error = new Error('Employee not found.');
    error.statusCode = 404;
    throw error;
  }

  if (employee.status !== 'Active') {
    const error = new Error(`Cannot check in. Employee status is currently '${employee.status}'.`);
    error.statusCode = 400;
    throw error;
  }

  // Check if employee already has an active session without checkout
  const activeSession = await Attendance.findOne({
    employee: targetEmployeeId,
    checkOut: null
  });

  if (activeSession) {
    const error = new Error(
      `Employee already has an active check-in session from ${new Date(activeSession.checkIn).toLocaleTimeString()}. Please check out before checking in again.`
    );
    error.statusCode = 400;
    throw error;
  }

  const inTime = checkInTime ? new Date(checkInTime) : new Date();
  const attendanceDate = new Date(Date.UTC(inTime.getUTCFullYear(), inTime.getUTCMonth(), inTime.getUTCDate()));

  // Determine status based on schedule (Late vs Present)
  let status = 'Present';
  if (employee.workingSchedule && employee.workingSchedule.startTime) {
    const [schedHour, schedMin] = employee.workingSchedule.startTime.split(':').map(Number);
    const schedMinutes = schedHour * 60 + schedMin;
    const graceMinutes = 15;

    const inUtcMinutes = inTime.getUTCHours() * 60 + inTime.getUTCMinutes();
    const inLocalMinutes = inTime.getHours() * 60 + inTime.getMinutes();

    const isIsoUtc = typeof checkInTime === 'string' && checkInTime.endsWith('Z');
    const inMinutes = isIsoUtc ? inUtcMinutes : inLocalMinutes;

    if (inMinutes > schedMinutes + graceMinutes) {
      status = 'Late';
    }
  }

  const attendance = await Attendance.create({
    employee: targetEmployeeId,
    date: attendanceDate,
    checkIn: inTime,
    status,
    notes: notes || ''
  });

  return Attendance.findById(attendance._id)
    .populate('employee', 'name email employeeId department jobPosition')
    .populate({
      path: 'employee',
      populate: { path: 'workingSchedule' }
    });
};

/**
 * Check-out an employee and automatically compute worked hours & overtime
 */
const checkOut = async ({ user, employeeId, checkOutTime, notes }) => {
  const targetEmployeeId = resolveEmployeeId(user, employeeId);
  if (!targetEmployeeId) {
    const error = new Error('Employee ID is required for check-out.');
    error.statusCode = 400;
    throw error;
  }

  const activeSession = await Attendance.findOne({
    employee: targetEmployeeId,
    checkOut: null
  }).sort({ checkIn: -1 });

  if (!activeSession) {
    const error = new Error('No active check-in session found for this employee to check out.');
    error.statusCode = 400;
    throw error;
  }

  const outTime = checkOutTime ? new Date(checkOutTime) : new Date();
  if (outTime.getTime() <= new Date(activeSession.checkIn).getTime()) {
    const error = new Error('Check-out timestamp must be after check-in timestamp.');
    error.statusCode = 400;
    throw error;
  }

  // Calculate worked hours (rounded to 2 decimals)
  const diffMs = outTime.getTime() - new Date(activeSession.checkIn).getTime();
  const workedHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

  // Calculate overtime based on employee's working schedule
  const employee = await Employee.findById(targetEmployeeId).populate('workingSchedule');
  let overtimeHours = 0;
  let standardDailyHours = 8; // fallback default

  if (employee?.workingSchedule) {
    const schedule = employee.workingSchedule;
    const workingDaysCount = schedule.weeklyWorkingDays?.length || 5;
    standardDailyHours = Math.round(((schedule.calculatedWeeklyHours || 40) / workingDaysCount) * 10) / 10;
  }

  if (workedHours > standardDailyHours) {
    overtimeHours = Math.round((workedHours - standardDailyHours) * 100) / 100;
  }

  // If worked less than half standard day, flag as Half-Day unless already marked Late
  let status = activeSession.status;
  if (workedHours < standardDailyHours / 2 && status === 'Present') {
    status = 'Half-Day';
  }

  activeSession.checkOut = outTime;
  activeSession.workedHours = workedHours;
  activeSession.overtimeHours = overtimeHours;
  activeSession.status = status;
  if (notes) {
    activeSession.notes = activeSession.notes ? `${activeSession.notes}; ${notes}` : notes;
  }

  await activeSession.save();

  return Attendance.findById(activeSession._id)
    .populate('employee', 'name email employeeId department jobPosition')
    .populate({
      path: 'employee',
      populate: { path: 'workingSchedule' }
    });
};

/**
 * Manual attendance correction for authorized HR/Admin users.
 * Recalculates worked hours and overtime mathematically.
 * Logs full audit trail with original values and reason.
 */
const manualCorrection = async (attendanceId, { checkIn, checkOut, status, reason }, modifierUser) => {
  const attendance = await Attendance.findById(attendanceId).populate({
    path: 'employee',
    populate: { path: 'workingSchedule' }
  });

  if (!attendance) {
    const error = new Error('Attendance record not found.');
    error.statusCode = 404;
    throw error;
  }

  // Preserve original snapshot for audit trail
  const originalValues = {
    checkIn: attendance.checkIn,
    checkOut: attendance.checkOut,
    workedHours: attendance.workedHours,
    status: attendance.status
  };

  const newCheckIn = checkIn ? new Date(checkIn) : attendance.checkIn;
  const newCheckOut = checkOut !== undefined ? (checkOut ? new Date(checkOut) : null) : attendance.checkOut;

  if (newCheckIn && newCheckOut && newCheckOut.getTime() <= newCheckIn.getTime()) {
    const error = new Error('Check-out time must be strictly after check-in time.');
    error.statusCode = 400;
    throw error;
  }

  attendance.checkIn = newCheckIn;
  attendance.checkOut = newCheckOut;

  // Calculate worked hours and overtime mathematically
  if (newCheckIn && newCheckOut) {
    const diffMs = newCheckOut.getTime() - newCheckIn.getTime();
    attendance.workedHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    let standardDailyHours = 8;
    if (attendance.employee?.workingSchedule) {
      const schedule = attendance.employee.workingSchedule;
      const daysCount = schedule.weeklyWorkingDays?.length || 5;
      standardDailyHours = Math.round(((schedule.calculatedWeeklyHours || 40) / daysCount) * 10) / 10;
    }

    if (attendance.workedHours > standardDailyHours) {
      attendance.overtimeHours = Math.round((attendance.workedHours - standardDailyHours) * 100) / 100;
    } else {
      attendance.overtimeHours = 0;
    }
  } else {
    attendance.workedHours = 0;
    attendance.overtimeHours = 0;
  }

  if (status) {
    attendance.status = status;
  }

  attendance.isManuallyCorrected = true;
  attendance.correction = {
    correctedBy: modifierUser._id,
    correctedAt: new Date(),
    reason,
    originalValues
  };

  await attendance.save();

  return Attendance.findById(attendance._id)
    .populate('employee', 'name email employeeId department jobPosition')
    .populate('correction.correctedBy', 'name email role');
};

/**
 * Query attendance records with role-based restriction, filters, and pagination
 */
const getAttendanceRecords = async (queryParams, user) => {
  const {
    employee,
    department,
    status,
    startDate,
    endDate,
    missingCheckout,
    isManuallyCorrected,
    page = 1,
    limit = 10
  } = queryParams;

  const filter = {};

  // Role restriction: Employees can only view their own attendance
  if (user.role === 'Employee') {
    const empId = user.employee?._id || user.employee;
    filter.employee = empId;
  } else if (employee) {
    filter.employee = employee;
  }

  // Filter by department if requested
  if (department && user.role !== 'Employee') {
    const employeesInDept = await Employee.find({ department }).select('_id');
    const empIds = employeesInDept.map((e) => e._id);
    filter.employee = { $in: empIds };
  }

  if (status) {
    filter.status = status;
  }

  if (isManuallyCorrected !== undefined) {
    filter.isManuallyCorrected = isManuallyCorrected === 'true' || isManuallyCorrected === true;
  }

  // Missing check-out detection filter
  if (missingCheckout === 'true' || missingCheckout === true) {
    filter.checkOut = null;
  }

  // Date range filter
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Attendance.countDocuments(filter);

  const attendance = await Attendance.find(filter)
    .populate({
      path: 'employee',
      select: 'name email employeeId department jobPosition',
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'jobPosition', select: 'name' },
        { path: 'workingSchedule', select: 'name startTime endTime calculatedWeeklyHours' }
      ]
    })
    .populate('correction.correctedBy', 'name email role')
    .sort({ date: -1, checkIn: -1 })
    .skip(skip)
    .limit(Number(limit));

  return { attendance, total, page: Number(page), limit: Number(limit) };
};

/**
 * Get single attendance record by ID
 */
const getAttendanceById = async (id, user) => {
  const attendance = await Attendance.findById(id)
    .populate({
      path: 'employee',
      select: 'name email employeeId department jobPosition',
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'jobPosition', select: 'name' },
        { path: 'workingSchedule', select: 'name startTime endTime' }
      ]
    })
    .populate('correction.correctedBy', 'name email role');

  if (!attendance) {
    const error = new Error('Attendance record not found.');
    error.statusCode = 404;
    throw error;
  }

  // Role check: Employee can only see their own
  if (user.role === 'Employee') {
    const empId = (user.employee?._id || user.employee).toString();
    if (attendance.employee._id.toString() !== empId) {
      const error = new Error('Forbidden: You are not authorized to view another employee\'s attendance.');
      error.statusCode = 403;
      throw error;
    }
  }

  return attendance;
};

/**
 * Get attendance records for a specific employee
 */
const getEmployeeAttendanceHistory = async (employeeId, queryParams, user) => {
  // If user is Employee, ensure they only request their own history
  if (user.role === 'Employee') {
    const ownEmpId = (user.employee?._id || user.employee).toString();
    if (employeeId !== ownEmpId) {
      const error = new Error('Forbidden: You cannot view attendance history of other employees.');
      error.statusCode = 403;
      throw error;
    }
  }

  return getAttendanceRecords({ ...queryParams, employee: employeeId }, user);
};

/**
 * Detect records with missing checkouts
 */
const getMissingCheckouts = async (user) => {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const filter = {
    checkOut: null,
    checkIn: { $lt: startOfToday }
  };

  if (user.role === 'Employee') {
    filter.employee = user.employee?._id || user.employee;
  }

  return Attendance.find(filter)
    .populate('employee', 'name email employeeId department jobPosition')
    .sort({ checkIn: -1 });
};

module.exports = {
  checkIn,
  checkOut,
  manualCorrection,
  getAttendanceRecords,
  getAttendanceById,
  getEmployeeAttendanceHistory,
  getMissingCheckouts
};
