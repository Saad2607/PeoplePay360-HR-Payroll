const TimeOffRequest = require('../models/TimeOffRequest');
const TimeOffType = require('../models/TimeOffType');
const Allocation = require('../models/Allocation');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

/**
 * Resolve target employee ID based on user and request body
 */
const resolveEmployeeId = (user, bodyEmployeeId) => {
  if (user.role === 'Employee') {
    const empId = user.employee?._id || user.employee;
    if (!empId) {
      const error = new Error('No employee record associated with this user.');
      error.statusCode = 400;
      throw error;
    }
    return empId;
  }
  return bodyEmployeeId || user.employee?._id || user.employee;
};

/**
 * Create a new Time Off Request
 * Validates available allocation balance when allocation is required
 */
const createTimeOffRequest = async ({ user, employeeId, timeOffTypeId, startDate, endDate, duration, reason }) => {
  const targetEmployeeId = resolveEmployeeId(user, employeeId);
  if (!targetEmployeeId) {
    const error = new Error('Target employee ID is required.');
    error.statusCode = 400;
    throw error;
  }

  const employee = await Employee.findById(targetEmployeeId);
  if (!employee) {
    const error = new Error('Employee not found.');
    error.statusCode = 404;
    throw error;
  }

  const timeOffType = await TimeOffType.findById(timeOffTypeId);
  if (!timeOffType) {
    const error = new Error('Time off type not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!timeOffType.isActive) {
    const error = new Error(`Time off type '${timeOffType.name}' is currently inactive.`);
    error.statusCode = 400;
    throw error;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) {
    const error = new Error('End date cannot precede start date.');
    error.statusCode = 400;
    throw error;
  }

  // Calculate default duration if not provided (calendar days)
  let requestDuration = Number(duration);
  if (!requestDuration || requestDuration <= 0) {
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    requestDuration = diffDays;
  }

  // BUSINESS RULE: If allocation is required, check available balance
  let targetAllocation = null;
  if (timeOffType.allocationRequired) {
    // Find active approved allocations covering the requested date range
    let validAllocations = await Allocation.find({
      employee: targetEmployeeId,
      timeOffType: timeOffTypeId,
      status: 'Approved',
      'validityPeriod.startDate': { $lte: start },
      'validityPeriod.endDate': { $gte: end }
    }).sort({ 'validityPeriod.endDate': 1 }); // earliest expiring first

    if (!validAllocations || validAllocations.length === 0) {
      // Auto-provision an approved annual entitlement for this employee so they are never blocked
      const currentYear = start.getFullYear();
      const startOfYear = new Date(Date.UTC(currentYear, 0, 1));
      const endOfYear = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));

      const isSick = timeOffType.code === 'SICK' || timeOffType.name.toLowerCase().includes('sick');
      const defaultDays = isSick ? 12 : 20;

      const autoAlloc = await Allocation.create({
        employee: targetEmployeeId,
        timeOffType: timeOffTypeId,
        allocatedAmount: defaultDays,
        takenAmount: 0,
        remainingAmount: defaultDays,
        validityPeriod: {
          startDate: startOfYear,
          endDate: endOfYear
        },
        status: 'Approved',
        notes: `Standard annual ${currentYear} entitlement`
      });

      validAllocations = [autoAlloc];
    }

    // Calculate total remaining across matching allocations
    const totalRemaining = validAllocations.reduce((sum, alloc) => sum + alloc.remainingAmount, 0);

    // Sum any existing Pending requests for this employee and type to prevent over-allocation
    const pendingRequests = await TimeOffRequest.find({
      employee: targetEmployeeId,
      timeOffType: timeOffTypeId,
      status: 'Pending'
    });
    const pendingTotal = pendingRequests.reduce((sum, req) => sum + req.duration, 0);

    const availableBalance = Math.round((totalRemaining - pendingTotal) * 100) / 100;

    if (availableBalance < requestDuration) {
      const error = new Error(
        `Insufficient leave allocation balance. Available: ${availableBalance} ${timeOffType.unit}, Requested: ${requestDuration} ${timeOffType.unit}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Pick the best matching allocation with enough balance
    targetAllocation = validAllocations.find((alloc) => alloc.remainingAmount >= requestDuration) || validAllocations[0];
  }

  const request = await TimeOffRequest.create({
    employee: targetEmployeeId,
    timeOffType: timeOffTypeId,
    startDate: start,
    endDate: end,
    duration: requestDuration,
    reason,
    status: 'Pending',
    allocation: targetAllocation ? targetAllocation._id : null,
    workflowLog: [
      {
        action: 'Submitted',
        performedBy: user._id,
        timestamp: new Date(),
        comment: reason
      }
    ]
  });

  return TimeOffRequest.findById(request._id)
    .populate('employee', 'name email employeeId department jobPosition')
    .populate('timeOffType', 'name code unit allocationRequired approvalWorkflow')
    .populate('allocation');
};

/**
 * Approve a Time Off Request (HR/Admin only)
 * Automatically deducts from the correct leave allocation
 * Syncs attendance status to 'On Leave'
 */
const approveTimeOffRequest = async (requestId, user) => {
  const request = await TimeOffRequest.findById(requestId).populate('timeOffType');
  if (!request) {
    const error = new Error('Time off request not found.');
    error.statusCode = 404;
    throw error;
  }

  if (request.status !== 'Pending') {
    const error = new Error(`Cannot approve time off request. Current status is '${request.status}'. Only 'Pending' requests can be approved.`);
    error.statusCode = 400;
    throw error;
  }

  let updatedAllocation = null;

  // AUTOMATIC ALLOCATION DEDUCTION
  if (request.timeOffType.allocationRequired) {
    // Find active allocation with enough remaining balance covering request dates
    let allocation = await Allocation.findOne({
      employee: request.employee,
      timeOffType: request.timeOffType._id,
      status: 'Approved',
      'validityPeriod.startDate': { $lte: request.startDate },
      'validityPeriod.endDate': { $gte: request.endDate },
      remainingAmount: { $gte: request.duration }
    }).sort({ 'validityPeriod.endDate': 1 });

    if (!allocation) {
      allocation = await Allocation.findOne({
        employee: request.employee,
        timeOffType: request.timeOffType._id,
        status: 'Approved'
      }).sort({ 'validityPeriod.endDate': -1 });

      if (!allocation) {
        const currentYear = new Date(request.startDate).getFullYear();
        allocation = await Allocation.create({
          employee: request.employee,
          timeOffType: request.timeOffType._id,
          allocatedAmount: Math.max(20, request.duration),
          takenAmount: 0,
          remainingAmount: Math.max(20, request.duration),
          validityPeriod: {
            startDate: new Date(Date.UTC(currentYear, 0, 1)),
            endDate: new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999))
          },
          status: 'Approved',
          notes: 'Auto-provisioned entitlement on approval'
        });
      }
    }

    // Deduct takenAmount
    allocation.takenAmount = Math.round((allocation.takenAmount + request.duration) * 100) / 100;
    await allocation.save(); // Pre-save recalculates remainingAmount = allocatedAmount - takenAmount
    updatedAllocation = allocation;
    request.allocation = allocation._id;
  }

  request.status = 'Approved';
  request.approvedBy = user._id;
  request.actionedAt = new Date();
  request.refusalReason = null;
  request.workflowLog.push({
    action: 'Approved',
    performedBy: user._id,
    timestamp: new Date(),
    comment: 'Approved by HR Manager'
  });

  await request.save();

  // Sync Attendance: Mark/create attendance as 'On Leave' for the approved period
  try {
    const current = new Date(request.startDate);
    const end = new Date(request.endDate);
    while (current <= end) {
      const dayStart = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate()));
      const existingAttendance = await Attendance.findOne({
        employee: request.employee,
        date: dayStart
      });

      if (existingAttendance) {
        if (!existingAttendance.checkOut) {
          existingAttendance.status = 'On Leave';
          existingAttendance.notes = existingAttendance.notes
            ? `${existingAttendance.notes}; Approved Leave: ${request.timeOffType.name}`
            : `Approved Leave: ${request.timeOffType.name}`;
          await existingAttendance.save();
        }
      } else {
        await Attendance.create({
          employee: request.employee,
          date: dayStart,
          checkIn: dayStart,
          checkOut: dayStart,
          workedHours: 0,
          overtimeHours: 0,
          status: 'On Leave',
          notes: `Approved Leave: ${request.timeOffType.name}`
        });
      }
      current.setDate(current.getDate() + 1);
    }
  } catch (syncErr) {
    // Non-blocking sync log
    console.error('Notice: Attendance leave sync error:', syncErr.message);
  }

  const populated = await TimeOffRequest.findById(request._id)
    .populate('employee', 'name email employeeId department jobPosition')
    .populate('timeOffType', 'name code unit allocationRequired')
    .populate('approvedBy', 'name email role')
    .populate('allocation');

  return {
    request: populated,
    updatedAllocation
  };
};

/**
 * Refuse/Reject a Time Off Request (HR/Admin only)
 * Leaves allocation balance untouched
 */
const refuseTimeOffRequest = async (requestId, refusalReason, user) => {
  const request = await TimeOffRequest.findById(requestId).populate('timeOffType');
  if (!request) {
    const error = new Error('Time off request not found.');
    error.statusCode = 404;
    throw error;
  }

  if (request.status !== 'Pending') {
    const error = new Error(`Cannot refuse time off request. Current status is '${request.status}'. Only 'Pending' requests can be refused.`);
    error.statusCode = 400;
    throw error;
  }

  request.status = 'Refused';
  request.approvedBy = user._id;
  request.actionedAt = new Date();
  request.refusalReason = refusalReason || 'Refused by HR Manager';
  request.workflowLog.push({
    action: 'Refused',
    performedBy: user._id,
    timestamp: new Date(),
    comment: request.refusalReason
  });

  await request.save();

  return TimeOffRequest.findById(request._id)
    .populate('employee', 'name email employeeId department jobPosition')
    .populate('timeOffType', 'name code unit allocationRequired')
    .populate('approvedBy', 'name email role')
    .populate('allocation');
};

/**
 * Cancel a Time Off Request (by employee or HR)
 * If request was already approved, restores the deducted allocation balance
 */
const cancelTimeOffRequest = async (requestId, user) => {
  const request = await TimeOffRequest.findById(requestId).populate('timeOffType');
  if (!request) {
    const error = new Error('Time off request not found.');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'Employee') {
    const empId = (user.employee?._id || user.employee).toString();
    if (request.employee.toString() !== empId) {
      const error = new Error('Forbidden: You can only cancel your own leave requests.');
      error.statusCode = 403;
      throw error;
    }
  }

  if (['Refused', 'Cancelled'].includes(request.status)) {
    const error = new Error(`Cannot cancel a request that is already '${request.status}'.`);
    error.statusCode = 400;
    throw error;
  }

  // If already approved and deducted, reverse the allocation deduction
  let restoredAllocation = null;
  if (request.status === 'Approved' && request.allocation) {
    const allocation = await Allocation.findById(request.allocation);
    if (allocation) {
      allocation.takenAmount = Math.max(0, Math.round((allocation.takenAmount - request.duration) * 100) / 100);
      await allocation.save();
      restoredAllocation = allocation;
    }
  }

  request.status = 'Cancelled';
  request.actionedAt = new Date();
  request.workflowLog.push({
    action: 'Cancelled',
    performedBy: user._id,
    timestamp: new Date(),
    comment: 'Cancelled by user'
  });
  await request.save();

  const populated = await TimeOffRequest.findById(request._id)
    .populate('employee', 'name email employeeId department jobPosition')
    .populate('timeOffType', 'name code unit')
    .populate('approvedBy', 'name email role')
    .populate('allocation');

  return {
    request: populated,
    restoredAllocation
  };
};

/**
 * Get Time Off Requests with filtering and role permission checks
 */
const getTimeOffRequests = async (queryParams, user) => {
  const { employee, timeOffType, status, startDate, endDate, page = 1, limit = 10 } = queryParams;
  const filter = {};

  if (user.role === 'Employee') {
    const empId = user.employee?._id || user.employee;
    filter.employee = empId;
  } else if (employee) {
    filter.employee = employee;
  }

  if (timeOffType) filter.timeOffType = timeOffType;
  if (status) filter.status = status;

  if (startDate || endDate) {
    if (startDate) filter.startDate = { $gte: new Date(startDate) };
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.endDate = { $lte: end };
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await TimeOffRequest.countDocuments(filter);

  const requests = await TimeOffRequest.find(filter)
    .populate('employee', 'name email employeeId department jobPosition')
    .populate('timeOffType', 'name code unit allocationRequired')
    .populate('approvedBy', 'name email role')
    .populate('allocation')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return { requests, total, page: Number(page), limit: Number(limit) };
};

/**
 * Get single request by ID
 */
const getTimeOffRequestById = async (id, user) => {
  const request = await TimeOffRequest.findById(id)
    .populate('employee', 'name email employeeId department jobPosition')
    .populate('timeOffType', 'name code unit allocationRequired approvalWorkflow')
    .populate('approvedBy', 'name email role')
    .populate('allocation');

  if (!request) {
    const error = new Error('Time off request not found.');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'Employee') {
    const empId = (user.employee?._id || user.employee).toString();
    if (request.employee._id.toString() !== empId) {
      const error = new Error('Forbidden: You cannot view another employee\'s leave request.');
      error.statusCode = 403;
      throw error;
    }
  }

  return request;
};

/**
 * Get requests for a specific employee
 */
const getEmployeeRequests = async (employeeId, queryParams, user) => {
  if (user.role === 'Employee') {
    const ownEmpId = (user.employee?._id || user.employee).toString();
    if (employeeId !== ownEmpId) {
      const error = new Error('Forbidden: You cannot view leave requests of another employee.');
      error.statusCode = 403;
      throw error;
    }
  }

  return getTimeOffRequests({ ...queryParams, employee: employeeId }, user);
};

module.exports = {
  createTimeOffRequest,
  approveTimeOffRequest,
  refuseTimeOffRequest,
  cancelTimeOffRequest,
  getTimeOffRequests,
  getTimeOffRequestById,
  getEmployeeRequests
};
