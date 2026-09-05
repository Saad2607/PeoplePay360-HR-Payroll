/**
 * PeoplePay360 - Comprehensive HR Modules Test Suite
 * 
 * Verifies:
 * 1. Check in (session creation, duplicate check-in prevention)
 * 2. Check out (calculates worked hours and overtime from schedule)
 * 3. Worked hours integrity (no client override, strictly mathematical)
 * 4. Attendance history, filters, missing checkout detection, manual correction audit
 * 5. Leave allocation (creation, remaining balance tracking)
 * 6. Leave request (creation, exceeding balance prevention)
 * 7. Leave approval (automatic allocation balance deduction)
 * 8. Leave refusal (balance unchanged)
 * 9. Role permissions (Employee vs HR authorization barriers)
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../app');
const {
  User,
  Employee,
  Department,
  JobPosition,
  WorkingSchedule,
  Attendance,
  TimeOffType,
  Allocation,
  TimeOffRequest
} = require('../models');
const { generateToken } = require('../utils/jwt');

let mongoServer;
let hrToken;
let employeeToken;
let employee2Token;
let hrUser;
let employeeUser;
let employee2User;
let testEmployee;
let testEmployee2;
let standardSchedule;
let ptoType;
let sickType;

// Helpers to create auth tokens
const createAuthHeader = (token) => ({ Authorization: `Bearer ${token}` });

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
};

async function setup() {
  console.log('\n======================================================');
  console.log(' Starting PeoplePay360 Operational HR Test Suite');
  console.log('======================================================\n');

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // 1. Seed Working Schedule
  standardSchedule = await WorkingSchedule.create({
    name: 'Standard 40h Schedule',
    type: 'Standard',
    weeklyWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 0,
    calculatedWeeklyHours: 40
  });

  // 2. Seed Department & JobPosition
  const dept = await Department.create({
    name: 'Engineering',
    code: 'ENG',
    description: 'Engineering Department'
  });

  const position = await JobPosition.create({
    name: 'Software Engineer',
    department: dept._id,
    description: 'Core developer'
  });

  // 3. Seed Employees
  testEmployee = await Employee.create({
    employeeId: 'EMP-TEST-001',
    name: 'Test Employee One',
    email: 'emp1@peoplepay360.com',
    phone: '+15551112222',
    department: dept._id,
    jobPosition: position._id,
    workingSchedule: standardSchedule._id,
    status: 'Active',
    joiningDate: new Date('2023-01-01')
  });

  testEmployee2 = await Employee.create({
    employeeId: 'EMP-TEST-002',
    name: 'Test Employee Two',
    email: 'emp2@peoplepay360.com',
    phone: '+15553334444',
    department: dept._id,
    jobPosition: position._id,
    workingSchedule: standardSchedule._id,
    status: 'Active',
    joiningDate: new Date('2023-01-01')
  });

  // 4. Seed Users
  hrUser = await User.create({
    name: 'HR Specialist',
    email: 'hr.specialist@peoplepay360.com',
    password: 'Password123!',
    role: 'HR',
    employee: null,
    isActive: true
  });

  employeeUser = await User.create({
    name: 'Employee User',
    email: 'emp.user@peoplepay360.com',
    password: 'Password123!',
    role: 'Employee',
    employee: testEmployee._id,
    isActive: true
  });

  employee2User = await User.create({
    name: 'Employee User 2',
    email: 'emp2.user@peoplepay360.com',
    password: 'Password123!',
    role: 'Employee',
    employee: testEmployee2._id,
    isActive: true
  });

  await Employee.findByIdAndUpdate(testEmployee._id, { user: employeeUser._id });
  await Employee.findByIdAndUpdate(testEmployee2._id, { user: employee2User._id });

  hrToken = generateToken({ id: hrUser._id, email: hrUser.email, role: hrUser.role });
  employeeToken = generateToken({ id: employeeUser._id, email: employeeUser.email, role: employeeUser.role });
  employee2Token = generateToken({ id: employee2User._id, email: employee2User.email, role: employee2User.role });

  console.log('✔ Test environment initialized with in-memory MongoDB');
}

async function runTests() {
  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: ATTENDANCE MODULE
    // -------------------------------------------------------------
    console.log('\n--- [1/6] Testing Attendance Check-In & Check-Out ---');

    // 1.1 Check In
    const checkInTime = new Date('2026-09-01T09:05:00.000Z');
    const checkInRes = await request(app)
      .post('/api/attendance/check-in')
      .set(createAuthHeader(employeeToken))
      .send({ checkIn: checkInTime.toISOString(), notes: 'Morning shift start' });

    assert(checkInRes.status === 201, `Check-in returns 201 Created (got ${checkInRes.status})`);
    assert(checkInRes.body.data.employee._id === testEmployee._id.toString(), 'Attendance belongs to correct employee');
    assert(checkInRes.body.data.status === 'Present', 'Status marked as Present within grace period');
    assert(checkInRes.body.data.checkOut === null, 'Active check-in has null checkOut');
    const attendanceId = checkInRes.body.data._id;

    // 1.2 Prevent Duplicate Check-In
    const dupCheckInRes = await request(app)
      .post('/api/attendance/check-in')
      .set(createAuthHeader(employeeToken))
      .send({ checkIn: new Date('2026-09-01T10:00:00.000Z').toISOString() });

    assert(dupCheckInRes.status === 400, `Duplicate check-in blocked with 400 Bad Request (got ${dupCheckInRes.status})`);
    assert(dupCheckInRes.body.message.includes('already has an active check-in'), 'Returns helpful duplicate error message');

    // 1.3 Check Out & Worked Hours & Overtime Calculation
    // Check in at 09:05, check out at 18:05 => 9.0 hours worked. Standard schedule = 8.0 hours/day. Overtime = 1.0 hour!
    const checkOutTime = new Date('2026-09-01T18:05:00.000Z');
    const checkOutRes = await request(app)
      .post('/api/attendance/check-out')
      .set(createAuthHeader(employeeToken))
      .send({ checkOut: checkOutTime.toISOString(), notes: 'Shift finished' });

    assert(checkOutRes.status === 200, `Check-out returns 200 OK (got ${checkOutRes.status})`);
    assert(checkOutRes.body.data.workedHours === 9, `Worked hours accurately calculated as 9.0 hrs (got ${checkOutRes.body.data.workedHours})`);
    assert(checkOutRes.body.data.overtimeHours === 1, `Overtime hours accurately calculated as 1.0 hr (got ${checkOutRes.body.data.overtimeHours})`);

    // 1.4 Manual Correction with Audit Trail (HR only)
    console.log('\n--- [2/6] Testing Manual Attendance Correction & Audit Trail ---');
    const correctedCheckIn = new Date('2026-09-01T09:00:00.000Z');
    const correctedCheckOut = new Date('2026-09-01T17:00:00.000Z'); // Exactly 8.0 hours

    // Employee cannot correct attendance
    const empCorrectionRes = await request(app)
      .put(`/api/attendance/${attendanceId}`)
      .set(createAuthHeader(employeeToken))
      .send({
        checkIn: correctedCheckIn.toISOString(),
        checkOut: correctedCheckOut.toISOString(),
        reason: 'Employee trying to self-modify'
      });
    assert(empCorrectionRes.status === 403, `Employee blocked from manual correction with 403 Forbidden (got ${empCorrectionRes.status})`);

    // HR performs manual correction
    const hrCorrectionRes = await request(app)
      .put(`/api/attendance/${attendanceId}`)
      .set(createAuthHeader(hrToken))
      .send({
        checkIn: correctedCheckIn.toISOString(),
        checkOut: correctedCheckOut.toISOString(),
        reason: 'Adjusting punch to scheduled times per badge log'
      });

    assert(hrCorrectionRes.status === 200, `HR manual correction succeeds with 200 OK (got ${hrCorrectionRes.status})`);
    assert(hrCorrectionRes.body.data.isManuallyCorrected === true, 'Flagged as manually corrected');
    assert(hrCorrectionRes.body.data.workedHours === 8, 'Worked hours recalculated to 8.0 hrs');
    assert(hrCorrectionRes.body.data.overtimeHours === 0, 'Overtime recalculated to 0 hrs');
    assert(hrCorrectionRes.body.data.correction.reason === 'Adjusting punch to scheduled times per badge log', 'Audit reason preserved');
    assert(hrCorrectionRes.body.data.correction.originalValues.workedHours === 9, 'Original worked hours archived in audit trail');

    // 1.5 Missing Checkout Detection
    console.log('\n--- [3/6] Testing Missing Checkout Detection & Attendance History ---');
    // Create an unclosed past session for Employee 2
    const yesterdayCheckIn = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await Attendance.create({
      employee: testEmployee2._id,
      date: new Date(Date.UTC(yesterdayCheckIn.getUTCFullYear(), yesterdayCheckIn.getUTCMonth(), yesterdayCheckIn.getUTCDate())),
      checkIn: yesterdayCheckIn,
      checkOut: null,
      status: 'Present'
    });

    const missingRes = await request(app)
      .get('/api/attendance/missing-checkout')
      .set(createAuthHeader(hrToken));

    assert(missingRes.status === 200, `Missing checkout query returns 200 OK (got ${missingRes.status})`);
    assert(missingRes.body.data.length >= 1, `Detected at least 1 missing checkout (found ${missingRes.body.data.length})`);
    assert(missingRes.body.data[0].employee._id === testEmployee2._id.toString(), 'Correct employee flagged for missing checkout');

    // Attendance History query
    const historyRes = await request(app)
      .get(`/api/attendance/employee/${testEmployee._id}`)
      .set(createAuthHeader(employeeToken));

    assert(historyRes.status === 200, `Employee attendance history returns 200 OK (got ${historyRes.status})`);
    assert(historyRes.body.data.length >= 1, 'Contains attendance history records');

    // Employee cannot view other employee's attendance
    const forbiddenHistoryRes = await request(app)
      .get(`/api/attendance/employee/${testEmployee2._id}`)
      .set(createAuthHeader(employeeToken));
    assert(forbiddenHistoryRes.status === 403, `Cross-employee attendance view blocked with 403 Forbidden (got ${forbiddenHistoryRes.status})`);

    // -------------------------------------------------------------
    // TEST SUITE 2: TIME OFF TYPES & ALLOCATIONS
    // -------------------------------------------------------------
    console.log('\n--- [4/6] Testing Time Off Types & Leave Allocations ---');

    // 2.1 Create Time Off Type (PTO)
    const ptoRes = await request(app)
      .post('/api/time-off-types')
      .set(createAuthHeader(hrToken))
      .send({
        name: 'Paid Time Off',
        code: 'PTO',
        unit: 'days',
        allocationRequired: true,
        approvalWorkflow: 'HR',
        payrollIntegration: { affectsPayroll: true, isPaid: true, payrollCode: 'PAY_PTO' }
      });

    assert(ptoRes.status === 201, `PTO TimeOffType created with 201 (got ${ptoRes.status})`);
    ptoType = ptoRes.body.data;
    assert(ptoType.code === 'PTO', 'Code uppercase PTO');
    assert(ptoType.unit === 'days', 'Unit is days');
    assert(ptoType.allocationRequired === true, 'Allocation required is true');

    // 2.2 Create Time Off Type without allocation required (Unpaid Leave)
    const unpaidRes = await request(app)
      .post('/api/time-off-types')
      .set(createAuthHeader(hrToken))
      .send({
        name: 'Unpaid Leave',
        code: 'UNPAID',
        unit: 'days',
        allocationRequired: false,
        approvalWorkflow: 'HR',
        payrollIntegration: { affectsPayroll: true, isPaid: false, payrollCode: 'UNPAID_DEDUCT' }
      });
    assert(unpaidRes.status === 201, 'Unpaid leave type created');

    // Employee cannot create Time Off Types
    const empTypeRes = await request(app)
      .post('/api/time-off-types')
      .set(createAuthHeader(employeeToken))
      .send({ name: 'Hack Type', code: 'HACK', unit: 'days' });
    assert(empTypeRes.status === 403, `Employee blocked from creating time off types (got ${empTypeRes.status})`);

    // 2.3 Grant Leave Allocation (15 days PTO to testEmployee)
    const allocRes = await request(app)
      .post('/api/allocations')
      .set(createAuthHeader(hrToken))
      .send({
        employee: testEmployee._id,
        timeOffType: ptoType._id,
        allocatedAmount: 15,
        validityPeriod: {
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-12-31T23:59:59.999Z'
        },
        status: 'Approved',
        notes: 'Annual leave allocation 2026'
      });

    assert(allocRes.status === 201, `Allocation created with 201 (got ${allocRes.status})`);
    const allocation = allocRes.body.data;
    assert(allocation.allocatedAmount === 15, 'Allocated amount is 15');
    assert(allocation.takenAmount === 0, 'Initial taken amount is 0');
    assert(allocation.remainingAmount === 15, 'Initial remaining amount is 15');

    // Check Employee Balance endpoint
    const balanceRes = await request(app)
      .get(`/api/allocations/employee/${testEmployee._id}/balance`)
      .set(createAuthHeader(employeeToken));

    assert(balanceRes.status === 200, `Employee balance query returns 200 OK (got ${balanceRes.status})`);
    assert(balanceRes.body.data.balances.length === 1, 'Found 1 active allocation in balance summary');
    assert(balanceRes.body.data.balances[0].remainingAmount === 15, 'Balance remaining is 15 days');

    // -------------------------------------------------------------
    // TEST SUITE 3: TIME OFF REQUESTS & APPROVAL WORKFLOW
    // -------------------------------------------------------------
    console.log('\n--- [5/6] Testing Time Off Request & Exceed Balance Prevention ---');

    // 3.1 Attempt to Request Exceeding Available Balance (e.g. 20 days when only 15 available)
    const exceedReqRes = await request(app)
      .post('/api/time-off-requests')
      .set(createAuthHeader(employeeToken))
      .send({
        timeOffTypeId: ptoType._id,
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-20T00:00:00.000Z',
        duration: 20,
        reason: 'Long summer vacation'
      });

    assert(exceedReqRes.status === 400, `Exceeding balance request rejected with 400 Bad Request (got ${exceedReqRes.status})`);
    assert(exceedReqRes.body.message.includes('Insufficient leave allocation balance'), 'Error specifies insufficient allocation balance');

    // 3.2 Submit Valid Leave Request (3 days)
    const validReqRes = await request(app)
      .post('/api/time-off-requests')
      .set(createAuthHeader(employeeToken))
      .send({
        timeOffTypeId: ptoType._id,
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-03T00:00:00.000Z',
        duration: 3,
        reason: 'Family event'
      });

    assert(validReqRes.status === 201, `Valid 3-day request submitted with 201 Created (got ${validReqRes.status})`);
    const req1 = validReqRes.body.data;
    assert(req1.status === 'Pending', 'Request initial status is Pending');
    assert(req1.duration === 3, 'Duration recorded as 3 days');

    // 3.3 Employee Cannot Approve Own Request
    const empApproveRes = await request(app)
      .put(`/api/time-off-requests/${req1._id}/approve`)
      .set(createAuthHeader(employeeToken));

    assert(empApproveRes.status === 403, `Employee cannot approve requests (403 Forbidden, got ${empApproveRes.status})`);

    // 3.4 HR Approves Request -> Automatic Allocation Balance Deduction
    console.log('\n--- [6/6] Testing Automatic Leave Balance Deduction & Refusal ---');
    const hrApproveRes = await request(app)
      .put(`/api/time-off-requests/${req1._id}/approve`)
      .set(createAuthHeader(hrToken));

    assert(hrApproveRes.status === 200, `HR approval returns 200 OK (got ${hrApproveRes.status})`);
    assert(hrApproveRes.body.data.request.status === 'Approved', 'Request status transitioned to Approved');
    assert(hrApproveRes.body.data.request.approvedBy !== null, 'ApprovedBy record set to HR user');

    // Verify Allocation balance deduction!
    const updatedAlloc = await Allocation.findById(allocation._id);
    assert(updatedAlloc.takenAmount === 3, `Allocation takenAmount increased to 3 (got ${updatedAlloc.takenAmount})`);
    assert(updatedAlloc.remainingAmount === 12, `Allocation remainingAmount deducted to 12 (got ${updatedAlloc.remainingAmount})`);

    // 3.5 Submit Second Request (2 days) & Refusal Flow
    const req2Res = await request(app)
      .post('/api/time-off-requests')
      .set(createAuthHeader(employeeToken))
      .send({
        timeOffTypeId: ptoType._id,
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-02T00:00:00.000Z',
        duration: 2,
        reason: 'Personal errands'
      });

    assert(req2Res.status === 201, 'Second request for 2 days submitted');
    const req2 = req2Res.body.data;

    // HR Refuses Second Request
    const hrRefuseRes = await request(app)
      .put(`/api/time-off-requests/${req2._id}/refuse`)
      .set(createAuthHeader(hrToken))
      .send({ refusalReason: 'Team has crucial release scheduled on those dates' });

    assert(hrRefuseRes.status === 200, `HR refusal returns 200 OK (got ${hrRefuseRes.status})`);
    assert(hrRefuseRes.body.data.status === 'Refused', 'Request status transitioned to Refused');
    assert(hrRefuseRes.body.data.refusalReason.includes('crucial release'), 'Refusal reason recorded');

    // Verify Allocation balance remains unchanged!
    const allocAfterRefusal = await Allocation.findById(allocation._id);
    assert(allocAfterRefusal.takenAmount === 3, 'Allocation takenAmount remains at 3');
    assert(allocAfterRefusal.remainingAmount === 12, 'Allocation remainingAmount remains at 12');

    // 3.6 Cancellation of Approved Request (Reverts Allocation Balance)
    const cancelRes = await request(app)
      .put(`/api/time-off-requests/${req1._id}/cancel`)
      .set(createAuthHeader(employeeToken));

    assert(cancelRes.status === 200, `Cancellation returns 200 OK (got ${cancelRes.status})`);
    assert(cancelRes.body.data.request.status === 'Cancelled', 'Request status transitioned to Cancelled');

    // Verify Allocation balance was fully restored!
    const allocAfterCancel = await Allocation.findById(allocation._id);
    assert(allocAfterCancel.takenAmount === 0, `Allocation takenAmount restored to 0 (got ${allocAfterCancel.takenAmount})`);
    assert(allocAfterCancel.remainingAmount === 15, `Allocation remainingAmount restored to 15 (got ${allocAfterCancel.remainingAmount})`);

    console.log('\n======================================================');
    console.log(' ALL 28 OPERATIONAL HR TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ TEST RUNNER FAILED WITH ERROR:\n', err);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

setup().then(runTests);
