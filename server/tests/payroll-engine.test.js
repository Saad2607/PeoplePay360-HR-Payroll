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
    console.log('\n--- [3/3] Verifying Rule Sequencing in Salary Structure ---');
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

    console.log('\n======================================================');
    console.log(' ALL SALARY RULE SEQUENCING TESTS PASSED! 🎉');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ SEQUENCING TEST RUNNER ERROR:', err);
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
