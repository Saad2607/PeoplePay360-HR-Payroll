/**
 * PeoplePay360 - Payroll Engine Test Suite
 * Part 1: Salary Rule Sequencing & Computation Types Verification
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
  Contract,
  SalaryStructure,
  SalaryRule
} = require('../models');
const { generateToken } = require('../utils/jwt');
const { evaluateFormula } = require('../services/payrollService');

let mongoServer;
let hrToken;
let employeeToken;
let hrUser;
let employeeUser;
let testEmployee;

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
  console.log(' Starting Salary Rule Sequencing Tests');
  console.log('======================================================\n');

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Department & JobPosition
  const dept = await Department.create({ name: 'Finance', code: 'FIN' });
  const pos = await JobPosition.create({ name: 'Accountant', department: dept._id });
  const schedule = await WorkingSchedule.create({
    name: 'Standard 40h',
    startTime: '09:00',
    endTime: '17:00'
  });

  testEmployee = await Employee.create({
    employeeId: 'EMP-PAY-001',
    name: 'Payroll Test Employee',
    email: 'payroll.test@peoplepay360.com',
    phone: '+15559998888',
    department: dept._id,
    jobPosition: pos._id,
    workingSchedule: schedule._id,
    status: 'Active'
  });

  hrUser = await User.create({
    name: 'HR Lead',
    email: 'hr.lead@peoplepay360.com',
    password: 'Password123!',
    role: 'HR'
  });

  employeeUser = await User.create({
    name: 'Employee',
    email: 'employee@peoplepay360.com',
    password: 'Password123!',
    role: 'Employee',
    employee: testEmployee._id
  });

  hrToken = generateToken({ id: hrUser._id, email: hrUser.email, role: hrUser.role });
  employeeToken = generateToken({ id: employeeUser._id, email: employeeUser.email, role: employeeUser.role });
}

async function runSequencingTests() {
  try {
    // 1. Formula evaluator unit tests
    console.log('\n--- [1/3] Testing Mathematical Formula Evaluator ---');
    const ctx = {
      BASIC: 20000,
      HRA: 8000,
      TRANSPORT: 2000,
      GROSS: 30000,
      DEDUCTION: 1000,
      attendance: { overtimeHours: 5 },
      contract: { wage: 20000 }
    };

    assert(evaluateFormula('BASIC * 0.4', ctx) === 8000, 'BASIC * 0.4 evaluates to 8000');
    assert(evaluateFormula('BASIC + HRA + TRANSPORT', ctx) === 30000, 'BASIC + HRA + TRANSPORT evaluates to 30000');
    assert(evaluateFormula('GROSS - DEDUCTION', ctx) === 29000, 'GROSS - DEDUCTION evaluates to 29000');
    assert(evaluateFormula('contract.wage', ctx) === 20000, 'contract.wage contextual token resolves to 20000');
    assert(evaluateFormula('attendance.overtimeHours * 200', ctx) === 1000, 'overtimeHours * 200 evaluates to 1000');

    // 2. Create Salary Rules with out-of-order sequence in insertion
    console.log('\n--- [2/3] Creating Salary Rules with Explicit Sequence ---');

    // Rule 1: BASIC (sequence 10, Fixed amount)
    const basicRes = await request(app)
      .post('/api/salary-rules')
      .set(createAuthHeader(hrToken))
      .send({
        name: 'Basic Salary',
        code: 'BASIC',
        category: 'Basic',
        sequence: 10,
        computationType: 'Fixed amount',
        amount: 20000
      });
    assert(basicRes.status === 201, 'Created BASIC rule (seq 10, fixed 20000)');

    // Rule 2: HRA (sequence 20, Percentage 40% of BASIC)
    const hraRes = await request(app)
      .post('/api/salary-rules')
      .set(createAuthHeader(hrToken))
      .send({
        name: 'House Rent Allowance',
        code: 'HRA',
        category: 'Allowances',
        sequence: 20,
        computationType: 'Percentage',
        amount: 40,
        percentageBase: 'BASIC'
      });
    assert(hraRes.status === 201, 'Created HRA rule (seq 20, 40% of BASIC)');

    // Rule 3: TRANSPORT (sequence 30, Fixed amount 2000)
    const transportRes = await request(app)
      .post('/api/salary-rules')
      .set(createAuthHeader(hrToken))
      .send({
        name: 'Transport Allowance',
        code: 'TRANSPORT',
        category: 'Allowances',
        sequence: 30,
        computationType: 'Fixed amount',
        amount: 2000
      });
    assert(transportRes.status === 201, 'Created TRANSPORT rule (seq 30, fixed 2000)');

    // Rule 4: GROSS (sequence 40, Formula: BASIC + HRA + TRANSPORT)
    const grossRes = await request(app)
      .post('/api/salary-rules')
      .set(createAuthHeader(hrToken))
      .send({
        name: 'Gross Salary',
        code: 'GROSS',
        category: 'Gross',
        sequence: 40,
        computationType: 'Formula',
        formula: 'BASIC + HRA + TRANSPORT'
      });
    assert(grossRes.status === 201, 'Created GROSS rule (seq 40, formula BASIC + HRA + TRANSPORT)');

    // Rule 5: DEDUCTION (sequence 50, Fixed amount 1000)
    const dedRes = await request(app)
      .post('/api/salary-rules')
      .set(createAuthHeader(hrToken))
      .send({
        name: 'Standard Deductions',
        code: 'DEDUCTION',
        category: 'Deductions',
        sequence: 50,
        computationType: 'Fixed amount',
        amount: 1000
      });
    assert(dedRes.status === 201, 'Created DEDUCTION rule (seq 50, fixed 1000)');

    // Rule 6: NET (sequence 60, Formula: GROSS - DEDUCTION)
    const netRes = await request(app)
      .post('/api/salary-rules')
      .set(createAuthHeader(hrToken))
      .send({
        name: 'Net Salary',
        code: 'NET',
        category: 'Net',
        sequence: 60,
        computationType: 'Formula',
        formula: 'GROSS - DEDUCTION'
      });
    assert(netRes.status === 201, 'Created NET rule (seq 60, formula GROSS - DEDUCTION)');

    // 3. Create Salary Structure containing these rules
    console.log('\n--- [3/5] Verifying Rule Sequencing in Salary Structure ---');
    // Notice we deliberately pass rule IDs in REVERSE order to verify the engine sorts by sequence!
    const reverseRuleIds = [
      netRes.body.data._id,
      dedRes.body.data._id,
      grossRes.body.data._id,
      transportRes.body.data._id,
      hraRes.body.data._id,
      basicRes.body.data._id
    ];

    const structRes = await request(app)
      .post('/api/salary-structures')
      .set(createAuthHeader(hrToken))
      .send({
        name: 'Standard Regular Salary Structure',
        description: 'Standard formula-based regular salary structure',
        salaryRules: reverseRuleIds
      });

    assert(structRes.status === 201, 'Salary structure created');
    const structure = structRes.body.data;

    // Verify when structure is retrieved, rules are sorted strictly by sequence (10, 20, 30, 40, 50, 60)
    const getStructRes = await request(app)
      .get(`/api/salary-structures/${structure._id}`)
      .set(createAuthHeader(hrToken));

    assert(getStructRes.status === 200, 'Retrieved salary structure');
    const fetchedRules = getStructRes.body.data.salaryRules;
    assert(fetchedRules.length === 6, 'Contains all 6 rules');
    assert(fetchedRules[0].code === 'BASIC' && fetchedRules[0].sequence === 10, 'Rule 1 is BASIC (seq 10)');
    assert(fetchedRules[1].code === 'HRA' && fetchedRules[1].sequence === 20, 'Rule 2 is HRA (seq 20)');
    assert(fetchedRules[2].code === 'TRANSPORT' && fetchedRules[2].sequence === 30, 'Rule 3 is TRANSPORT (seq 30)');
    assert(fetchedRules[3].code === 'GROSS' && fetchedRules[3].sequence === 40, 'Rule 4 is GROSS (seq 40)');
    assert(fetchedRules[4].code === 'DEDUCTION' && fetchedRules[4].sequence === 50, 'Rule 5 is DEDUCTION (seq 50)');
    assert(fetchedRules[5].code === 'NET' && fetchedRules[5].sequence === 60, 'Rule 6 is NET (seq 60)');

    // 4. Seed Contracts (Historical 2023 vs Active 2024) to test Applicable Contract Selection
    console.log('\n--- [4/5] Testing Applicable Contract Selection by Period ---');
    const contract2023 = await Contract.create({
      contractNumber: 'CTR-HIST-2023',
      employee: testEmployee._id,
      department: testEmployee.department,
      jobPosition: testEmployee.jobPosition,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      wage: 15000,
      salaryStructure: {
        basic: 15000,
        allowances: { houseRent: 4000, transport: 1000 },
        deductions: { tax: 800 }
      },
      status: 'Expired'
    });

    const contract2024 = await Contract.create({
      contractNumber: 'CTR-ACTIVE-2024',
      employee: testEmployee._id,
      department: testEmployee.department,
      jobPosition: testEmployee.jobPosition,
      startDate: new Date('2024-01-01'),
      endDate: null,
      wage: 20000,
      salaryStructure: {
        basic: 20000,
        allowances: { houseRent: 8000, transport: 2000 },
        deductions: { tax: 1000 }
      },
      status: 'Active'
    });

    await Employee.findByIdAndUpdate(testEmployee._id, { activeContract: contract2024._id });

    // Test applicable contract for 2023 pay period
    const histApplicableRes = await request(app)
      .get(`/api/payroll/applicable-contract/${testEmployee._id}?startDate=2023-06-01&endDate=2023-06-30`)
      .set(createAuthHeader(hrToken));

    assert(histApplicableRes.status === 200, 'Applicable contract query returns 200 OK');
    assert(histApplicableRes.body.data.contractNumber === 'CTR-HIST-2023', 'Selected 2023 contract for 2023 pay period (does not just pick latest)');

    // Test applicable contract for 2024 pay period
    const activeApplicableRes = await request(app)
      .get(`/api/payroll/applicable-contract/${testEmployee._id}?startDate=2024-06-01&endDate=2024-06-30`)
      .set(createAuthHeader(hrToken));

    assert(activeApplicableRes.status === 200, 'Applicable contract query returns 200 OK');
    assert(activeApplicableRes.body.data.contractNumber === 'CTR-ACTIVE-2024', 'Selected 2024 active contract for 2024 pay period');

    // 5. Complete Payroll Computation Test (The Hackathon Specification Example)
    console.log('\n--- [5/5] Testing Complete Payroll Computation & RBAC ---');

    // Employee cannot execute payroll calculation
    const empCalcRes = await request(app)
      .post('/api/payroll/calculate-payslip')
      .set(createAuthHeader(employeeToken))
      .send({
        employeeId: testEmployee._id,
        period: { startDate: '2024-06-01', endDate: '2024-06-30' },
        salaryStructureId: structure._id
      });

    assert(empCalcRes.status === 403, `Employee blocked from payroll calculation with 403 Forbidden (got ${empCalcRes.status})`);

    // HR executes payroll calculation
    const hrCalcRes = await request(app)
      .post('/api/payroll/calculate-payslip')
      .set(createAuthHeader(hrToken))
      .send({
        employeeId: testEmployee._id,
        period: { startDate: '2024-06-01', endDate: '2024-06-30' },
        salaryStructureId: structure._id
      });

    assert(hrCalcRes.status === 200, `HR calculation succeeds with 200 OK (got ${hrCalcRes.status})`);
    const payslip = hrCalcRes.body.data;

    // Verify exact required values from prompt:
    // Basic = 20,000
    // HRA = 40% of Basic = 8,000
    // Transport = 2,000
    // Gross = Basic + HRA + Transport = 30,000
    // Deduction = 1,000
    // Net = Gross - Deduction = 29,000
    const basicItem = payslip.earnings.find((e) => e.code === 'BASIC');
    assert(basicItem && basicItem.amount === 20000, `Basic is configured at 20,000 (got ${basicItem?.amount})`);

    const hraItem = payslip.earnings.find((e) => e.code === 'HRA');
    assert(hraItem && hraItem.amount === 8000, `HRA computed at 40% of Basic = 8,000 (got ${hraItem?.amount})`);

    const transportItem = payslip.earnings.find((e) => e.code === 'TRANSPORT');
    assert(transportItem && transportItem.amount === 2000, `Transport computed at 2,000 (got ${transportItem?.amount})`);

    assert(payslip.grossSalary === 30000, `Gross salary is exactly 30,000 (got ${payslip.grossSalary})`);

    const dedItem = payslip.deductions.find((d) => d.code === 'DEDUCTION');
    assert(dedItem && dedItem.amount === 1000, `Deduction computed at 1,000 (got ${dedItem?.amount})`);
    assert(payslip.totalDeductions === 1000, `Total deductions is exactly 1,000 (got ${payslip.totalDeductions})`);

    assert(payslip.netSalary === 29000, `Net salary is exactly 29,000 (got ${payslip.netSalary})`);
    assert(payslip.contract.contractNumber === 'CTR-ACTIVE-2024', 'Payslip links to applicable contract CTR-ACTIVE-2024');
    assert(payslip.ruleBreakdown.length === 6, 'Full sequential breakdown of 6 rules returned');

    console.log('\n======================================================');
    console.log(' ALL PAYROLL ENGINE & COMPUTATION TESTS PASSED! 🎉');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ TEST RUNNER ERROR:', err);
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

setup().then(runSequencingTests);
