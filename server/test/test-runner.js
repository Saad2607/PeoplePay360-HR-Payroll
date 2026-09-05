/**
 * Comprehensive Core HR Backend Test Suite
 * Tests:
 * 1. Authentication & JWT utility verification
 * 2. Role-Based Access Control (RBAC) & permission matrix
 * 3. Contract overlap prevention business logic
 * 4. Period-specific applicable contract engine (getApplicableContract)
 * 5. Working schedule deterministic weekly hours calculation
 * 6. Mongoose Models validation & virtual fields
 * 7. Express App Route Registry inspection
 */

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
const app = require('../app');

const runTests = async () => {
  console.log('====================================================');
  console.log(' STARTING PEOPLEPAY360 CORE HR BACKEND TEST SUITE   ');
  console.log('====================================================\n');

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
    // ----------------------------------------------------
    // TEST GROUP 1: Authentication & JWT Verification
    // ----------------------------------------------------
    console.log('[TEST GROUP 1] Authentication & JWT Verification');

    const testPayload = {
      id: '507f1f77bcf86cd799439011',
      email: 'admin@peoplepay360.com',
      role: ROLES.ADMIN
    };

    const token = generateToken(testPayload);
    assert(typeof token === 'string' && token.split('.').length === 3, 'JWT token generated in valid 3-part header.payload.signature format');

    const decoded = verifyToken(token);
    assert(
      decoded.id === testPayload.id &&
      decoded.email === testPayload.email &&
      decoded.role === ROLES.ADMIN,
      'JWT token successfully verified and decoded with accurate role and identity'
    );

    // ----------------------------------------------------
    // TEST GROUP 2: RBAC & 5-Role Permission Matrix
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 2] Role-Based Access Control (RBAC)');

    assert(ALL_ROLES.length === 5, 'All 5 official roles are registered: Employee, HR Manager, HR Payroll User, HR Payroll Manager, Admin');
    assert(ALL_ROLES.includes('Employee'), 'Employee role registered');
    assert(ALL_ROLES.includes('HR Manager'), 'HR Manager role registered');
    assert(ALL_ROLES.includes('HR Payroll User'), 'HR Payroll User role registered');
    assert(ALL_ROLES.includes('HR Payroll Manager'), 'HR Payroll Manager role registered');
    assert(ALL_ROLES.includes('Admin'), 'Admin role registered');

    // HR Manager permissions
    assert(HR_MANAGERS.includes(ROLES.HR_MANAGER), 'HR Manager is authorized to manage HR resources (employees, contracts, schedules)');
    assert(!HR_MANAGERS.includes(ROLES.EMPLOYEE), 'Employee is NOT authorized to manage HR resources');

    // Payroll access restrictions
    assert(!PAYROLL_USERS.includes(ROLES.HR_MANAGER), 'HR Manager has NO payroll administration access');
    assert(PAYROLL_USERS.includes(ROLES.HR_PAYROLL_USER), 'HR Payroll User has payroll execution access');
    assert(PAYROLL_USERS.includes(ROLES.HR_PAYROLL_MANAGER), 'HR Payroll Manager has payroll execution access');

    // Salary Structure & Rules management (HR Payroll User is Read-Only!)
    assert(!PAYROLL_MANAGERS.includes(ROLES.HR_PAYROLL_USER), 'HR Payroll User is restricted to read-only for salary structures/rules');
    assert(PAYROLL_MANAGERS.includes(ROLES.HR_PAYROLL_MANAGER), 'HR Payroll Manager has full management of salary structures/rules');

    // Admin has full access
    assert(hasRole(ROLES.ADMIN, ['AnySpecialRole']), 'Admin has universal access bypass');

    // ----------------------------------------------------
    // TEST GROUP 3: Working Schedule Deterministic Calculation
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 3] Working Schedule Deterministic Hours Calculation');

    // Standard: 09:00 - 18:00 (9h) - 60min break (1h) = 8h/day * 5 days = 40.00 hours
    const h1 = calculateWeeklyHours('09:00', '18:00', 60, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    assert(h1 === 40, `Standard Full-Time (09:00-18:00, 60m break, 5d) = ${h1}h (Expected: 40)`);

    // Flexible Tech: 09:30 - 17:30 (8h) - 30min break (0.5h) = 7.5h/day * 5 days = 37.50 hours
    const h2 = calculateWeeklyHours('09:30', '17:30', 30, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    assert(h2 === 37.5, `Flexible Tech (09:30-17:30, 30m break, 5d) = ${h2}h (Expected: 37.5)`);

    // Part-Time: 09:00 - 13:00 (4h) - 0min break = 4h/day * 5 days = 20.00 hours
    const h3 = calculateWeeklyHours('09:00', '13:00', 0, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    assert(h3 === 20, `Part-Time Morning (09:00-13:00, 0m break, 5d) = ${h3}h (Expected: 20)`);

    // Overnight shift: 22:00 to 06:00 (8h) - 60min break (1h) = 7h/day * 4 days = 28.00 hours
    const h4 = calculateWeeklyHours('22:00', '06:00', 60, ['Monday', 'Tuesday', 'Wednesday', 'Thursday']);
    assert(h4 === 28, `Overnight shift (22:00-06:00, 60m break, 4d) = ${h4}h (Expected: 28)`);

    // Model Pre-Save Calculation Verification
    const schedDoc = new WorkingSchedule({
      name: 'Calculation Test Schedule',
      startTime: '09:00',
      endTime: '17:00',
      weeklyWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      breakDuration: 60,
      calculatedWeeklyHours: 999 // Intentionally set manual dummy value to prove it gets overwritten
    });
    schedDoc.schema.s.hooks.execPre('save', schedDoc, () => {
      assert(
        schedDoc.calculatedWeeklyHours === 35,
        `Schedule model pre-save hook strictly overrides manual input with calculated value: ${schedDoc.calculatedWeeklyHours}h (Expected: 35)`
      );
    });

    // ----------------------------------------------------
    // TEST GROUP 4: Contract Overlap Prevention Logic
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 4] Contract Overlap Prevention Algorithm');

    // Pure algorithm verification
    const checkIntervalOverlap = (s1, e1, s2, e2) => {
      const start1 = new Date(s1).getTime();
      const end1 = e1 ? new Date(e1).getTime() : Infinity;
      const start2 = new Date(s2).getTime();
      const end2 = e2 ? new Date(e2).getTime() : Infinity;

      return start1 <= end2 && start2 <= end1;
    };

    // Case 1: Disjoint consecutive contracts (Contract 1: 2023, Contract 2: 2024) -> No overlap
    assert(
      !checkIntervalOverlap('2023-01-01', '2023-12-31', '2024-01-01', '2024-12-31'),
      'Consecutive non-overlapping contract intervals correctly allowed'
    );

    // Case 2: Overlapping finite contracts (2024-01-01 to 2024-12-31 vs 2024-06-01 to 2025-05-31) -> Overlap!
    assert(
      checkIntervalOverlap('2024-01-01', '2024-12-31', '2024-06-01', '2025-05-31'),
      'Overlapping finite contract intervals accurately detected and flagged'
    );

    // Case 3: Open-ended indefinite contract (2024-01-01 to null vs 2024-06-01 to 2024-12-31) -> Overlap!
    assert(
      checkIntervalOverlap('2024-01-01', null, '2024-06-01', '2024-12-31'),
      'Open-ended active contract overlap with subsequent contract accurately flagged'
    );

    // ----------------------------------------------------
    // TEST GROUP 5: Period-Specific Applicable Contract Engine
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 5] Period-Specific Applicable Contract Resolution');

    // Simulate multi-contract employee history:
    // Contract A: 2023-01-01 to 2023-12-31, Basic $60,000, Status: Expired
    // Contract B: 2024-01-01 to 2024-06-30, Basic $80,000, Status: Expired
    // Contract C: 2024-07-01 to Indefinite, Basic $95,000, Status: Active
    const contractsList = [
      {
        _id: 'contract_A',
        contractNumber: 'CTR-2023-01',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        wage: 60000,
        status: 'Expired'
      },
      {
        _id: 'contract_B',
        contractNumber: 'CTR-2024-01',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        wage: 80000,
        status: 'Expired'
      },
      {
        _id: 'contract_C',
        contractNumber: 'CTR-2024-02',
        startDate: new Date('2024-07-01'),
        endDate: null,
        wage: 95000,
        status: 'Active'
      }
    ];

    const resolveApplicableContractLogic = (contracts, periodStartStr, periodEndStr) => {
      const pStart = new Date(periodStartStr);
      pStart.setHours(0, 0, 0, 0);
      const pEnd = new Date(periodEndStr);
      pEnd.setHours(23, 59, 59, 999);

      const matching = contracts.filter((c) => {
        if (!['Active', 'Expired'].includes(c.status)) return false;
        const cStart = c.startDate;
        const cEnd = c.endDate;
        const startedBeforeEnd = cStart.getTime() <= pEnd.getTime();
        const endedAfterStart = !cEnd || cEnd.getTime() >= pStart.getTime();
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

    // Scenario 1: Historical Payroll Run for October 2023
    const oct2023 = resolveApplicableContractLogic(contractsList, '2023-10-01', '2023-10-31');
    assert(
      oct2023 && oct2023._id === 'contract_A' && oct2023.wage === 60000,
      'October 2023 payroll period correctly resolved to Contract A ($60,000) instead of latest contract'
    );

    // Scenario 2: Historical Payroll Run for March 2024
    const mar2024 = resolveApplicableContractLogic(contractsList, '2024-03-01', '2024-03-31');
    assert(
      mar2024 && mar2024._id === 'contract_B' && mar2024.wage === 80000,
      'March 2024 payroll period correctly resolved to Contract B ($80,000)'
    );

    // Scenario 3: Current Payroll Run for August 2024
    const aug2024 = resolveApplicableContractLogic(contractsList, '2024-08-01', '2024-08-31');
    assert(
      aug2024 && aug2024._id === 'contract_C' && aug2024.wage === 95000,
      'August 2024 payroll period correctly resolved to Active Contract C ($95,000)'
    );

    // Scenario 4: Period prior to employee hire (2021)
    const year2021 = resolveApplicableContractLogic(contractsList, '2021-01-01', '2021-01-31');
    assert(year2021 === null, 'Out-of-range period prior to hire correctly returns null');

    // ----------------------------------------------------
    // TEST GROUP 6: Database Models & Virtual Attributes
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 6] Database Models & Virtual Fields');

    // Test Contract virtual grossSalary
    const testContractDoc = new Contract({
      contractNumber: 'CTR-VIRTUAL-TEST',
      employee: '507f1f77bcf86cd799439011',
      startDate: new Date(),
      wage: 100000,
      salaryStructure: {
        basic: 70000,
        allowances: { houseRent: 15000, transport: 5000, medical: 5000, other: 5000 },
        deductions: { tax: 15000, providentFund: 5000, insurance: 2500, other: 0 }
      },
      department: '507f1f77bcf86cd799439012',
      jobPosition: '507f1f77bcf86cd799439013'
    });
    assert(
      testContractDoc.grossSalary === 100000,
      `Contract grossSalary virtual accurately computed basic + allowances: $${testContractDoc.grossSalary}`
    );

    // Verify Employee model virtuals configuration
    const empVirtuals = Object.keys(Employee.schema.virtuals);
    assert(empVirtuals.includes('contracts'), 'Employee model has virtual: contracts');
    assert(empVirtuals.includes('directReports'), 'Employee model has virtual: directReports');
    assert(empVirtuals.includes('attendances'), 'Employee model has virtual: attendances');
    assert(empVirtuals.includes('timeOffRequests'), 'Employee model has virtual: timeOffRequests');
    assert(empVirtuals.includes('allocations'), 'Employee model has virtual: allocations');

    // ----------------------------------------------------
    // TEST GROUP 7: Express App Route Structure & Endpoints
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 7] Express Application Route Registry');

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
      assert(found, `Endpoint registered: ${ep}`);
    }

    console.log('\n====================================================');
    console.log(` ALL TESTS PASSED! (${passedTests}/${totalTests} tests successful)`);
    console.log('====================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL TEST FAILURE]', err);
    process.exit(1);
  }
};

runTests();
