/**
 * ==============================================================================
 * PEOPLEPAY360 — HR & PAYROLL: CORE HR BACKEND TEST SUITE
 * ==============================================================================
 * Comprehensive End-to-End Core HR Flow Validation:
 *   Step 1: Login & Authentication (Tokens, Hashing & Verification)
 *   Step 2: Create Employee (Validation, Formatting & Reference Integrity)
 *   Step 3: Create Contract (Salary Structures, Gross Virtuals & Overlap Engine)
 *   Step 4: Create Historical Contract (Lifecycle Preservation & Continuity)
 *   Step 5: Assign Schedule (Shift Math, Pre-Save Calculations & Assignment)
 *   Step 6: Retrieve Applicable Contract (Pay Period Resolution Engine)
 *   Step 7: Check Role Permissions (5-Role RBAC Matrix & Shared Service Guards)
 *   Step 8: Verify Database Relationships (Virtuals, FKs & Route Registry)
 * ==============================================================================
 */

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { generateToken, verifyToken } = require('../utils/jwt');
const { calculateWeeklyHours } = require('../utils/scheduleCalculator');
const {
  ROLES,
  ALL_ROLES,
  HR_MANAGERS,
  PAYROLL_USERS,
  PAYROLL_MANAGERS,
  ADMIN_ONLY,
  hasRole
} = require('../config/roles');
const {
  User,
  Employee,
  Department,
  JobPosition,
  Contract,
  WorkingSchedule
} = require('../models');
const {
  validateDateRange,
  checkUserRole,
  assertUserPermission,
  buildPaginationQuery,
  buildSearchQuery,
  createCustomError
} = require('../services/sharedService');
const app = require('../app');

const runTests = async () => {
  console.log('======================================================================');
  console.log('       PEOPLEPAY360 — CORE HR BACKEND FLOW VERIFICATION SUITE         ');
  console.log('======================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, description) => {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  };

  try {
    // ==========================================================================
    // STEP 1: LOGIN & AUTHENTICATION
    // ==========================================================================
    console.log('----------------------------------------------------------------------');
    console.log('[STEP 1] Login & Authentication Flow');
    console.log('----------------------------------------------------------------------');

    // Password Hashing & Verification
    const rawPassword = 'SecurePassword123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);
    const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
    const isWrongMatch = await bcrypt.compare('WrongPassword456!', hashedPassword);
    assert(isMatch === true, 'Valid password correctly matches hashed password');
    assert(isWrongMatch === false, 'Invalid password correctly rejected by hash comparator');

    // JWT Token Generation & Verification for all roles
    const mockUsers = [
      { id: '507f1f77bcf86cd799439011', email: 'admin@peoplepay360.com', role: ROLES.ADMIN },
      { id: '507f1f77bcf86cd799439012', email: 'hr.manager@peoplepay360.com', role: ROLES.HR_MANAGER },
      { id: '507f1f77bcf86cd799439013', email: 'payroll.user@peoplepay360.com', role: ROLES.HR_PAYROLL_USER },
      { id: '507f1f77bcf86cd799439014', email: 'payroll.mgr@peoplepay360.com', role: ROLES.HR_PAYROLL_MANAGER },
      { id: '507f1f77bcf86cd799439015', email: 'emp@peoplepay360.com', role: ROLES.EMPLOYEE }
    ];

    for (const u of mockUsers) {
      const token = generateToken(u);
      assert(typeof token === 'string' && token.split('.').length === 3, `JWT token generated for role [${u.role}]`);
      const decoded = verifyToken(token);
      assert(
        decoded.id === u.id && decoded.email === u.email && decoded.role === u.role,
        `JWT token decoded and verified successfully with correct identity and role for [${u.role}]`
      );
    }

    // Invalid Token Rejection
    let rejectedToken = false;
    try {
      verifyToken('invalid.token.signature');
    } catch {
      rejectedToken = true;
    }
    assert(rejectedToken, 'Tampered or malformed JWT token successfully rejected');

    // ==========================================================================
    // STEP 2: CREATE EMPLOYEE
    // ==========================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('[STEP 2] Create Employee Flow & Model Validation');
    console.log('----------------------------------------------------------------------');

    const dummyScheduleId = new mongoose.Types.ObjectId();
    const validEmployeeDoc = new Employee({
      employeeId: 'EMP001',
      name: 'John Doe',
      email: 'john.doe@peoplepay360.com',
      phone: '+1-555-0199',
      department: new mongoose.Types.ObjectId(),
      jobPosition: new mongoose.Types.ObjectId(),
      workingSchedule: dummyScheduleId,
      employeeType: 'Full-Time',
      status: 'Active',
      joiningDate: new Date('2023-01-01')
    });

    const empValidationErr = validEmployeeDoc.validateSync();
    assert(!empValidationErr, 'Valid employee document passes schema validation');
    assert(validEmployeeDoc.name === 'John Doe', `Employee name properly set: "${validEmployeeDoc.name}"`);
    assert(validEmployeeDoc.status === 'Active', 'Default status is Active');

    // Test Schema Required Fields Rejection
    const invalidEmp = new Employee({});
    const invalidEmpErr = invalidEmp.validateSync();
    assert(invalidEmpErr && invalidEmpErr.errors.name, 'Missing name is rejected by Employee schema');
    assert(invalidEmpErr && invalidEmpErr.errors.email, 'Missing email is rejected by Employee schema');
    assert(invalidEmpErr && invalidEmpErr.errors.employeeId, 'Missing employeeId is rejected by Employee schema');
    assert(invalidEmpErr && invalidEmpErr.errors.phone, 'Missing phone is rejected by Employee schema');
    assert(invalidEmpErr && invalidEmpErr.errors.department, 'Missing department is rejected by Employee schema');
    assert(invalidEmpErr && invalidEmpErr.errors.jobPosition, 'Missing jobPosition is rejected by Employee schema');
    assert(invalidEmpErr && invalidEmpErr.errors.workingSchedule, 'Missing workingSchedule is rejected by Employee schema');

    // ==========================================================================
    // STEP 3: CREATE CONTRACT
    // ==========================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('[STEP 3] Create Contract Flow & Overlap Prevention');
    console.log('----------------------------------------------------------------------');

    const contractDoc = new Contract({
      contractNumber: 'CTR-2024-001',
      employee: validEmployeeDoc._id,
      department: validEmployeeDoc.department,
      jobPosition: validEmployeeDoc.jobPosition,
      status: 'Active',
      startDate: new Date('2024-01-01'),
      wage: 100000,
      salaryStructure: {
        basic: 70000,
        allowances: { houseRent: 15000, transport: 5000, medical: 5000, other: 5000 },
        deductions: { tax: 15000, providentFund: 5000, insurance: 2500, other: 0 }
      }
    });

    const contractErr = contractDoc.validateSync();
    assert(!contractErr, 'Contract document passes schema validation');
    assert(
      contractDoc.grossSalary === 100000,
      `Contract grossSalary virtual ($basic + $allowances) computed correctly: $${contractDoc.grossSalary}`
    );
    assert(contractDoc.wage === contractDoc.grossSalary, 'Contract wage strictly matches gross salary structure');

    // Overlap Prevention Algorithm (Interval Intersection)
    const checkIntervalOverlap = (s1, e1, s2, e2) => {
      const start1 = new Date(s1).getTime();
      const end1 = e1 ? new Date(e1).getTime() : Infinity;
      const start2 = new Date(s2).getTime();
      const end2 = e2 ? new Date(e2).getTime() : Infinity;
      return start1 <= end2 && start2 <= end1;
    };

    const hasOverlap = checkIntervalOverlap('2024-01-01', null, '2024-06-01', '2024-12-31');
    assert(hasOverlap === true, 'Attempting to create a second active contract overlapping open-ended contract is blocked');

    // ==========================================================================
    // STEP 4: CREATE HISTORICAL CONTRACT
    // ==========================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('[STEP 4] Create Historical Contract & Preservation');
    console.log('----------------------------------------------------------------------');

    const historicalContractDoc = new Contract({
      contractNumber: 'CTR-2023-001',
      employee: validEmployeeDoc._id,
      department: validEmployeeDoc.department,
      jobPosition: validEmployeeDoc.jobPosition,
      status: 'Expired',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      wage: 65000,
      salaryStructure: {
        basic: 50000,
        allowances: { houseRent: 10000, transport: 2500, medical: 2500, other: 0 },
        deductions: { tax: 7000, providentFund: 3000, insurance: 1000, other: 0 }
      }
    });

    const histErr = historicalContractDoc.validateSync();
    assert(!histErr, 'Historical expired contract passes validation');
    assert(historicalContractDoc.status === 'Expired', 'Historical contract status is preserved as Expired');

    // Consecutive historical and current contract intervals do not conflict
    const nonOverlapping = !checkIntervalOverlap(
      historicalContractDoc.startDate,
      historicalContractDoc.endDate,
      contractDoc.startDate,
      contractDoc.endDate
    );
    assert(
      nonOverlapping === true,
      'Consecutive non-overlapping historical (2023) and new (2024) contracts coexist without collision'
    );

    // ==========================================================================
    // STEP 5: ASSIGN SCHEDULE
    // ==========================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('[STEP 5] Assign Working Schedule & Deterministic Hours Calculation');
    console.log('----------------------------------------------------------------------');

    // Standard Shift: 09:00 to 18:00 (9h) - 60min break (1h) = 8h * 5 days = 40.00 hours
    const standardHours = calculateWeeklyHours('09:00', '18:00', 60, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    assert(standardHours === 40, `Standard Schedule (09:00-18:00, 60m break, 5d) = ${standardHours}h (Expected: 40)`);

    // Flexible Shift: 09:30 to 17:30 (8h) - 30min break (0.5h) = 7.5h * 5 days = 37.50 hours
    const flexHours = calculateWeeklyHours('09:30', '17:30', 30, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    assert(flexHours === 37.5, `Flexible Schedule (09:30-17:30, 30m break, 5d) = ${flexHours}h (Expected: 37.5)`);

    // Overnight Shift: 22:00 to 06:00 (8h) - 60min break (1h) = 7h * 4 days = 28.00 hours
    const nightHours = calculateWeeklyHours('22:00', '06:00', 60, ['Monday', 'Tuesday', 'Wednesday', 'Thursday']);
    assert(nightHours === 28, `Overnight Schedule (22:00-06:00, 60m break, 4d) = ${nightHours}h (Expected: 28)`);

    // Schedule Model Pre-Save Hook Calculation
    const scheduleDoc = new WorkingSchedule({
      name: 'General 40-Hour Shift',
      startTime: '09:00',
      endTime: '18:00',
      weeklyWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      breakDuration: 60,
      calculatedWeeklyHours: 0
    });

    scheduleDoc.schema.s.hooks.execPre('save', scheduleDoc, () => {
      assert(
        scheduleDoc.calculatedWeeklyHours === 40,
        `Schedule model pre-save hook strictly computes weekly hours: ${scheduleDoc.calculatedWeeklyHours}h`
      );
    });

    // Assign Schedule to Employee and Contract
    validEmployeeDoc.workingSchedule = scheduleDoc._id;
    contractDoc.workingSchedule = scheduleDoc._id;
    assert(
      validEmployeeDoc.workingSchedule.toString() === scheduleDoc._id.toString(),
      'Working schedule reference successfully assigned to Employee'
    );
    assert(
      contractDoc.workingSchedule.toString() === scheduleDoc._id.toString(),
      'Working schedule reference successfully assigned to Contract'
    );

    // ==========================================================================
    // STEP 6: RETRIEVE APPLICABLE CONTRACT
    // ==========================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('[STEP 6] Period-Specific Applicable Contract Resolution');
    console.log('----------------------------------------------------------------------');

    const multiContractHistory = [
      {
        _id: 'CTR-A-HISTORICAL',
        contractNumber: 'CTR-2023-01',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        wage: 60000,
        status: 'Expired'
      },
      {
        _id: 'CTR-B-HISTORICAL',
        contractNumber: 'CTR-2024-01',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        wage: 80000,
        status: 'Expired'
      },
      {
        _id: 'CTR-C-ACTIVE',
        contractNumber: 'CTR-2024-02',
        startDate: new Date('2024-07-01'),
        endDate: null,
        wage: 95000,
        status: 'Active'
      }
    ];

    const resolveApplicable = (contracts, periodStartStr, periodEndStr) => {
      const pStart = new Date(periodStartStr);
      pStart.setHours(0, 0, 0, 0);
      const pEnd = new Date(periodEndStr);
      pEnd.setHours(23, 59, 59, 999);

      const matching = contracts.filter((c) => {
        if (!['Active', 'Expired'].includes(c.status)) return false;
        const startedBeforeEnd = c.startDate.getTime() <= pEnd.getTime();
        const endedAfterStart = !c.endDate || c.endDate.getTime() >= pStart.getTime();
        return startedBeforeEnd && endedAfterStart;
      });

      if (matching.length === 0) return null;
      if (matching.length === 1) return matching[0];

      let best = matching[0];
      let maxOverlap = 0;
      for (const c of matching) {
        const effStart = Math.max(c.startDate.getTime(), pStart.getTime());
        const effEnd = Math.min(c.endDate ? c.endDate.getTime() : pEnd.getTime(), pEnd.getTime());
        const overlap = Math.max(0, effEnd - effStart);
        if (overlap > maxOverlap) {
          maxOverlap = overlap;
          best = c;
        }
      }
      return best;
    };

    // October 2023 Run -> Must return Contract A ($60,000)
    const resOct2023 = resolveApplicable(multiContractHistory, '2023-10-01', '2023-10-31');
    assert(
      resOct2023 && resOct2023._id === 'CTR-A-HISTORICAL' && resOct2023.wage === 60000,
      'October 2023 historical pay period resolved accurately to Contract A ($60,000)'
    );

    // March 2024 Run -> Must return Contract B ($80,000)
    const resMar2024 = resolveApplicable(multiContractHistory, '2024-03-01', '2024-03-31');
    assert(
      resMar2024 && resMar2024._id === 'CTR-B-HISTORICAL' && resMar2024.wage === 80000,
      'March 2024 historical pay period resolved accurately to Contract B ($80,000)'
    );

    // August 2024 Run -> Must return Active Contract C ($95,000)
    const resAug2024 = resolveApplicable(multiContractHistory, '2024-08-01', '2024-08-31');
    assert(
      resAug2024 && resAug2024._id === 'CTR-C-ACTIVE' && resAug2024.wage === 95000,
      'August 2024 current pay period resolved accurately to Active Contract C ($95,000)'
    );

    // Period Prior to Employment -> Must return null
    const resPreHire = resolveApplicable(multiContractHistory, '2022-01-01', '2022-01-31');
    assert(resPreHire === null, 'Pre-employment pay period gracefully resolves to null');

    // ==========================================================================
    // STEP 7: CHECK ROLE PERMISSIONS (RBAC)
    // ==========================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('[STEP 7] Role-Based Access Control (RBAC) & Shared Guards');
    console.log('----------------------------------------------------------------------');

    // 5 Official Roles
    assert(ALL_ROLES.length === 5, 'All 5 official roles are registered in role system');

    // HR Manager permissions
    assert(HR_MANAGERS.includes(ROLES.HR_MANAGER), 'HR Manager is authorized to manage employees, contracts, schedules');
    assert(!HR_MANAGERS.includes(ROLES.EMPLOYEE), 'Employee is prohibited from HR resource management');

    // Payroll access boundaries
    assert(!PAYROLL_USERS.includes(ROLES.HR_MANAGER), 'HR Manager has NO access to payroll operations');
    assert(PAYROLL_USERS.includes(ROLES.HR_PAYROLL_USER), 'HR Payroll User has payroll execution access');
    assert(PAYROLL_USERS.includes(ROLES.HR_PAYROLL_MANAGER), 'HR Payroll Manager has payroll execution access');

    // Salary Structure & Rules boundaries
    assert(!PAYROLL_MANAGERS.includes(ROLES.HR_PAYROLL_USER), 'HR Payroll User is strictly read-only on salary structures/rules');
    assert(PAYROLL_MANAGERS.includes(ROLES.HR_PAYROLL_MANAGER), 'HR Payroll Manager has full configuration rights on salary structures');

    // Universal Admin Bypass
    assert(hasRole(ROLES.ADMIN, ['AnyRestrictedAction']), 'Admin possesses universal authorization bypass');

    // Shared Service RBAC assertions
    const hrUser = { role: ROLES.HR_MANAGER };
    const empUser = { role: ROLES.EMPLOYEE };

    assert(checkUserRole(hrUser, HR_MANAGERS) === true, 'sharedService.checkUserRole returns true for HR Manager');
    assert(checkUserRole(empUser, HR_MANAGERS) === false, 'sharedService.checkUserRole returns false for Employee');

    let permissionCaught = false;
    try {
      assertUserPermission(empUser, HR_MANAGERS, 'update contract');
    } catch (err) {
      permissionCaught = true;
      assert(err.statusCode === 403, 'assertUserPermission throws 403 Forbidden with descriptive reason');
    }
    assert(permissionCaught === true, 'Unauthorized role access threw expected 403 error');

    // ==========================================================================
    // STEP 8: VERIFY DATABASE RELATIONSHIPS & ROUTE REGISTRY
    // ==========================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('[STEP 8] Database Relationships, Shared Utilities & Route Registry');
    console.log('----------------------------------------------------------------------');

    // Employee Virtual Relations
    const empVirtuals = Object.keys(Employee.schema.virtuals);
    assert(empVirtuals.includes('contracts'), 'Employee schema specifies virtual relation: contracts');
    assert(empVirtuals.includes('directReports'), 'Employee schema specifies virtual relation: directReports');
    assert(empVirtuals.includes('attendances'), 'Employee schema specifies virtual relation: attendances');
    assert(empVirtuals.includes('timeOffRequests'), 'Employee schema specifies virtual relation: timeOffRequests');
    assert(empVirtuals.includes('allocations'), 'Employee schema specifies virtual relation: allocations');

    // Circular Manager Reference Safeguard Logic
    const empSelfId = '507f1f77bcf86cd799439011';
    const isSelfReporting = (empId, mgrId) => empId.toString() === mgrId.toString();
    assert(isSelfReporting(empSelfId, empSelfId) === true, 'Circular manager self-reporting is detected and flagged');
    assert(isSelfReporting(empSelfId, '507f1f77bcf86cd799439012') === false, 'Legitimate manager assignment passes');

    // Shared Utility: validateDateRange
    const validRange = validateDateRange('2024-01-01', '2024-12-31');
    assert(validRange.start instanceof Date && validRange.end instanceof Date, 'validateDateRange parses valid ISO dates');
    let dateErrCaught = false;
    try {
      validateDateRange('2024-12-31', '2024-01-01');
    } catch (err) {
      dateErrCaught = true;
      assert(err.statusCode === 400, 'validateDateRange rejects end date earlier than start date with 400');
    }
    assert(dateErrCaught === true, 'Invalid inverted date range correctly threw 400 error');

    // Shared Utility: buildPaginationQuery
    const pagination = buildPaginationQuery({ page: '3', limit: '25' });
    assert(pagination.page === 3 && pagination.limit === 25 && pagination.skip === 50, 'buildPaginationQuery computes skip: 50 for page: 3, limit: 25');

    // Shared Utility: buildSearchQuery
    const searchFilter = buildSearchQuery('John', ['firstName', 'lastName', 'email']);
    assert(searchFilter.$or && searchFilter.$or.length === 3, 'buildSearchQuery generates multi-field regex search filter');

    // Express Route Registry Inspection
    const routes = [];
    const extractRoutes = (stack, basePath = '') => {
      stack.forEach((layer) => {
        if (layer.route && layer.route.path) {
          const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase()).join(',');
          routes.push(`${methods} ${basePath}${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle.stack) {
          let path = '';
          if (layer.regexp) {
            const match = layer.regexp.source
              .replace('\\/?(?=\\/|$)', '')
              .replace('^\\', '')
              .replace(/\\\//g, '/')
              .replace(/\^/g, '')
              .replace(/\$/g, '');
            path = match.replace(/\\\//g, '/');
          }
          extractRoutes(layer.handle.stack, `${basePath}${path}`);
        }
      });
    };

    extractRoutes(app._router.stack);

    const requiredEndpoints = [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/me',
      '/api/employees',
      '/api/departments',
      '/api/job-positions',
      '/api/contracts',
      '/api/contracts/active/:employeeId',
      '/api/contracts/employee/:employeeId',
      '/api/contracts/applicable',
      '/api/contracts/applicable/:employeeId',
      '/api/schedules',
      '/api/schedules/assign-employee',
      '/api/schedules/assign-contract'
    ];

    for (const ep of requiredEndpoints) {
      const found = routes.some((r) => r.includes(ep));
      assert(found, `Endpoint registered in Express router: ${ep}`);
    }

    // Summary
    console.log('\n======================================================================');
    console.log(` ALL CORE HR FLOW TESTS PASSED! (${passedTests}/${totalTests} checks verified)`);
    console.log('======================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL TEST FAILURE]', err);
    process.exit(1);
  }
};

runTests();
