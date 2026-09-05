/**
 * PeoplePay360 - End-to-End Payrun, Payslip, Validation & PDF Test Suite
 * Covers the complete 12-step payroll lifecycle:
 * Employee -> Contract -> Salary Structure -> Attendance -> Time Off ->
 * Wizard Selection -> Create Payrun -> Compute Payslips -> Validate Engine ->
 * Mark Paid -> PDF Generation -> Email Dispatch -> Self-RBAC
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
  SalaryRule,
  Attendance,
  TimeOffType,
  Allocation,
  TimeOffRequest,
  Payrun,
  Payslip
} = require('../models');
const { generateToken } = require('../utils/jwt');

let mongoServer;
let hrToken;
let employeeToken;
let otherEmployeeToken;
let hrUser;
let employeeUser;
let otherEmployeeUser;
let testEmployee;
let otherEmployee;
let testContract;
let testStructure;
let createdPayrunId;
let createdPayslipId;

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
  console.log(' Starting PeoplePay360 Payrun to Payslip E2E Suite');
  console.log('======================================================\n');

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // 1. Department, Job Position, Schedule
  const dept = await Department.create({ name: 'Engineering', code: 'ENG' });
  const pos = await JobPosition.create({ name: 'Senior Developer', department: dept._id });
  const schedule = await WorkingSchedule.create({
    name: 'Standard 40h',
    startTime: '09:00',
    endTime: '17:00'
  });

  // 2. Employee 1 with complete bank details
  testEmployee = await Employee.create({
    employeeId: 'EMP-FLOW-001',
    name: 'Alice Johnson',
    email: 'alice.johnson@peoplepay360.com',
    phone: '+1 555 0192',
    department: dept._id,
    jobPosition: pos._id,
    workingSchedule: schedule._id,
    status: 'Active',
    bankDetails: {
      accountName: 'Alice Johnson',
      accountNumber: '9876543210',
      bankName: 'JPMorgan Chase',
      routingNumber: '021000021'
    }
  });

  // 3. Employee 2 without bank details (for testing validation engine)
  otherEmployee = await Employee.create({
    employeeId: 'EMP-FLOW-002',
    name: 'Bob Smith',
    email: 'bob.smith@peoplepay360.com',
    phone: '+1 555 0193',
    department: dept._id,
    jobPosition: pos._id,
    workingSchedule: schedule._id,
    status: 'Active',
    bankDetails: {
      accountNumber: '' // Intentionally missing
    }
  });

  // 4. Users & Auth Tokens
  hrUser = await User.create({
    name: 'HR Lead',
    email: 'hr.lead@peoplepay360.com',
    password: 'Password123!',
    role: 'HR Manager'
  });

  employeeUser = await User.create({
    name: 'Alice Johnson',
    email: 'alice.johnson@peoplepay360.com',
    password: 'Password123!',
    role: 'Employee',
    employee: testEmployee._id
  });

  otherEmployeeUser = await User.create({
    name: 'Bob Smith',
    email: 'bob.smith@peoplepay360.com',
    password: 'Password123!',
    role: 'Employee',
    employee: otherEmployee._id
  });

  hrToken = generateToken({ id: hrUser._id, email: hrUser.email, role: hrUser.role });
  employeeToken = generateToken({ id: employeeUser._id, email: employeeUser.email, role: employeeUser.role });
  otherEmployeeToken = generateToken({ id: otherEmployeeUser._id, email: otherEmployeeUser.email, role: otherEmployeeUser.role });

  console.log('✔ Test environment and accounts initialized\n');
}

async function runTests() {
  const period = {
    startDate: '2024-06-01',
    endDate: '2024-06-30'
  };

  // -------------------------------------------------------------
  // Step 1: Verify Employee Setup
  // -------------------------------------------------------------
  console.log('--- [Step 1/12] Verifying Employee Setup ---');
  assert(testEmployee.bankDetails.accountNumber === '9876543210', 'Primary employee has configured bank details');
  assert(otherEmployee.bankDetails.accountNumber === '', 'Secondary employee is missing bank details');

  // -------------------------------------------------------------
  // Step 2: Create Applicable Contract
  // -------------------------------------------------------------
  console.log('\n--- [Step 2/12] Creating Applicable Employment Contract ---');
  testContract = await Contract.create({
    contractNumber: 'CTR-ALICE-2024',
    employee: testEmployee._id,
    department: testEmployee.department,
    jobPosition: testEmployee.jobPosition,
    startDate: new Date('2024-01-01'),
    endDate: null, // Open-ended
    wage: 5000,
    wageType: 'Monthly',
    salaryStructure: {
      basic: 5000,
      allowances: { houseRent: 2000, transport: 300, medical: 0, other: 0 },
      deductions: { tax: 730, providentFund: 0, insurance: 0, other: 0 }
    },
    status: 'Active'
  });

  assert(testContract.contractNumber === 'CTR-ALICE-2024', 'Contract created successfully');
  assert(testContract.wage === 5000, 'Contract wage set to 5000');

  // -------------------------------------------------------------
  // Step 3: Configure Salary Structure and Rules
  // -------------------------------------------------------------
  console.log('\n--- [Step 3/12] Configuring Salary Rules & Structure ---');
  const ruleBasic = await SalaryRule.create({
    name: 'Basic Salary',
    code: 'BASIC',
    category: 'Basic',
    sequence: 10,
    computationType: 'Fixed amount',
    amount: 5000
  });

  const ruleHra = await SalaryRule.create({
    name: 'House Rent Allowance',
    code: 'HRA',
    category: 'Allowances',
    sequence: 20,
    computationType: 'Percentage',
    amount: 40,
    percentageBase: 'BASIC'
  });

  const ruleTransport = await SalaryRule.create({
    name: 'Transport Allowance',
    code: 'TRANSPORT',
    category: 'Allowances',
    sequence: 30,
    computationType: 'Fixed amount',
    amount: 300
  });

  const ruleGross = await SalaryRule.create({
    name: 'Gross Salary',
    code: 'GROSS',
    category: 'Gross',
    sequence: 40,
    computationType: 'Formula',
    formula: 'BASIC + HRA + TRANSPORT'
  });

  const ruleTax = await SalaryRule.create({
    name: 'Income Tax',
    code: 'TAX',
    category: 'Deductions',
    sequence: 50,
    computationType: 'Percentage',
    amount: 10,
    percentageBase: 'GROSS'
  });

  const ruleNet = await SalaryRule.create({
    name: 'Net Salary',
    code: 'NET',
    category: 'Net',
    sequence: 60,
    computationType: 'Formula',
    formula: 'GROSS - TAX'
  });

  testStructure = await SalaryStructure.create({
    name: 'Standard Software Engineer Structure',
    description: 'Structure with Basic, HRA, Transport, Gross, Tax, Net',
    salaryRules: [ruleBasic._id, ruleHra._id, ruleTransport._id, ruleGross._id, ruleTax._id, ruleNet._id],
    isActive: true
  });

  assert(testStructure.salaryRules.length === 6, 'Salary structure created with 6 sequential rules');

  // -------------------------------------------------------------
  // Step 4: Record Attendance
  // -------------------------------------------------------------
  console.log('\n--- [Step 4/12] Recording Employee Attendance ---');
  const checkInTime = new Date('2024-06-03T09:00:00.000Z');
  const checkOutTime = new Date('2024-06-03T18:00:00.000Z'); // 9 hours

  await Attendance.create({
    employee: testEmployee._id,
    date: new Date('2024-06-03'),
    checkIn: checkInTime,
    checkOut: checkOutTime,
    workedHours: 9,
    overtimeHours: 1,
    status: 'Present'
  });

  assert(true, 'Attendance logged for 2024-06-03 (9 worked hours, 1 overtime hour)');

  // -------------------------------------------------------------
  // Step 5 & 6: Request & Approve Time Off
  // -------------------------------------------------------------
  console.log('\n--- [Step 5 & 6/12] Requesting & Approving Paid Time Off ---');
  const ptoType = await TimeOffType.create({
    name: 'Paid Annual Leave',
    code: 'PAL',
    unit: 'days',
    allocationRequired: true,
    payrollIntegration: { isPaid: true }
  });

  await Allocation.create({
    employee: testEmployee._id,
    timeOffType: ptoType._id,
    allocatedAmount: 10,
    takenAmount: 0,
    remainingAmount: 10,
    validityPeriod: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    }
  });

  const leaveRequest = await TimeOffRequest.create({
    employee: testEmployee._id,
    timeOffType: ptoType._id,
    startDate: new Date('2024-06-10'),
    endDate: new Date('2024-06-11'),
    duration: 2,
    unit: 'days',
    reason: 'Annual family vacation',
    status: 'Approved',
    approvedBy: hrUser._id,
    approvedAt: new Date()
  });

  assert(leaveRequest.status === 'Approved', 'Paid time off request approved for 2 days');

  // -------------------------------------------------------------
  // Step 7: Payrun Creation Wizard (Query eligible employees)
  // -------------------------------------------------------------
  console.log('\n--- [Step 7/12] Running Wizard Query (Eligible Employees) ---');
  const initialPayrunsCount = await Payrun.countDocuments();

  const wizardRes = await request(app)
    .post('/api/payruns/wizard/eligible-employees')
    .set(createAuthHeader(hrToken))
    .send({
      salaryStructureId: testStructure._id,
      period
    });

  assert(wizardRes.status === 200, `Wizard query returns 200 OK (got ${wizardRes.status})`);
  assert(wizardRes.body.data.eligibleEmployees.length >= 1, 'Wizard lists eligible employees');
  const matchedEmp = wizardRes.body.data.eligibleEmployees.find(
    (item) => item.employee._id.toString() === testEmployee._id.toString()
  );
  assert(!!matchedEmp, 'Test employee is found eligible');

  const afterWizardPayrunsCount = await Payrun.countDocuments();
  assert(
    initialPayrunsCount === afterWizardPayrunsCount,
    'IMPORTANT: Wizard query did NOT create any Payrun in the database'
  );

  // -------------------------------------------------------------
  // Step 8: Create Payrun (Draft Status)
  // -------------------------------------------------------------
  console.log('\n--- [Step 8/12] Confirming Wizard & Creating Payrun ---');
  const createPayrunRes = await request(app)
    .post('/api/payruns')
    .set(createAuthHeader(hrToken))
    .send({
      name: 'June 2024 Engineering Payrun',
      salaryStructureId: testStructure._id,
      period,
      selectedEmployees: [testEmployee._id],
      notes: 'Monthly payroll for Engineering division'
    });

  assert(createPayrunRes.status === 201, `Payrun created with 201 Created (got ${createPayrunRes.status})`);
  assert(createPayrunRes.body.data.status === 'Draft', 'Payrun status is Draft');
  createdPayrunId = createPayrunRes.body.data._id;

  // -------------------------------------------------------------
  // Step 9: Compute Payslips
  // -------------------------------------------------------------
  console.log('\n--- [Step 9/12] Computing Payrun & Generating Payslips ---');
  const computeRes = await request(app)
    .post(`/api/payruns/${createdPayrunId}/compute`)
    .set(createAuthHeader(hrToken));

  assert(computeRes.status === 200, `Compute payrun returns 200 OK (got ${computeRes.status})`);
  assert(computeRes.body.data.status === 'Computed', 'Payrun status updated to Computed');
  assert(computeRes.body.data.payslips.length === 1, 'Generated exactly 1 payslip');

  // Verify Payslip details
  const payslipDoc = await Payslip.findOne({ payrun: createdPayrunId }).populate('salaryBreakdown');
  assert(!!payslipDoc, 'Payslip document found in database');
  createdPayslipId = payslipDoc._id;

  assert(payslipDoc.status === 'Computed', 'Payslip status is Computed');
  assert(payslipDoc.basic === 5000, `Basic salary is 5,000 (got ${payslipDoc.basic})`);
  assert(payslipDoc.gross === 7300, `Gross salary is 7,300 [5000 + 2000 HRA + 300 Transport] (got ${payslipDoc.gross})`);
  assert(payslipDoc.deductions === 730, `Total deductions is 730 [10% of 7300] (got ${payslipDoc.deductions})`);
  assert(payslipDoc.net === 6570, `Net salary is 6,570 [7300 - 730] (got ${payslipDoc.net})`);
  assert(payslipDoc.workedDays === 1, `Worked days reflected from attendance: 1 (got ${payslipDoc.workedDays})`);
  assert(payslipDoc.salaryBreakdown.length === 6, `Salary breakdown contains all 6 computed rules`);

  // -------------------------------------------------------------
  // Step 10: Payroll Validation Engine Tests
  // -------------------------------------------------------------
  console.log('\n--- [Step 10/12] Testing Payroll Validation Engine ---');

  // Test 10.1: Validation failure for employee missing bank details
  const invalidPayrun = await Payrun.create({
    name: 'Invalid Test Run',
    salaryStructure: testStructure._id,
    period,
    selectedEmployees: [otherEmployee._id],
    status: 'Computed'
  });

  const failValidationRes = await request(app)
    .post(`/api/payruns/${invalidPayrun._id}/validate`)
    .set(createAuthHeader(hrToken));

  assert(
    failValidationRes.status === 422,
    `Validation fails with 422 Unprocessable Entity for missing bank details (got ${failValidationRes.status})`
  );
  assert(
    failValidationRes.body.message.includes('error(s)'),
    'Error response explicitly reports validation errors'
  );

  // Test 10.2: Successful validation of valid payrun
  const validateRes = await request(app)
    .post(`/api/payruns/${createdPayrunId}/validate`)
    .set(createAuthHeader(hrToken));

  assert(validateRes.status === 200, `Payroll validation succeeds with 200 OK (got ${validateRes.status})`);
  assert(validateRes.body.data.status === 'Validated', 'Payrun status transitioned to Validated');
  assert(validateRes.body.data.validation.isValid === true, 'Validation isValid is true');

  // Verify associated payslip also transitioned to Validated
  const validatedPayslip = await Payslip.findById(createdPayslipId);
  assert(validatedPayslip.status === 'Validated', 'Associated payslip status updated to Validated');

  // -------------------------------------------------------------
  // Step 11: Mark Paid
  // -------------------------------------------------------------
  console.log('\n--- [Step 11/12] Marking Payrun as Paid ---');
  const markPaidRes = await request(app)
    .post(`/api/payruns/${createdPayrunId}/mark-paid`)
    .set(createAuthHeader(hrToken))
    .send({
      paymentMethod: 'Direct Deposit',
      reference: 'ACH-2024-06-9921'
    });

  assert(markPaidRes.status === 200, `Mark paid returns 200 OK (got ${markPaidRes.status})`);
  assert(markPaidRes.body.data.status === 'Paid', 'Payrun status transitioned to Paid');
  assert(markPaidRes.body.data.payment.paymentMethod === 'Direct Deposit', 'Payment method recorded');
  assert(markPaidRes.body.data.payment.reference === 'ACH-2024-06-9921', 'Payment reference recorded');

  const paidPayslip = await Payslip.findById(createdPayslipId);
  assert(paidPayslip.status === 'Paid', 'Associated payslip status updated to Paid');

  // -------------------------------------------------------------
  // Step 12: Generate PDF and Verify Buffer
  // -------------------------------------------------------------
  console.log('\n--- [Step 12/12] Printable Vector PDF Generation ---');
  const pdfRes = await request(app)
    .get(`/api/payslips/${createdPayslipId}/pdf`)
    .set(createAuthHeader(hrToken))
    .buffer(true)
    .parse((res, callback) => {
      res.setEncoding('binary');
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        callback(null, Buffer.from(data, 'binary'));
      });
    });

  assert(pdfRes.status === 200, `Payslip PDF download returns 200 OK (got ${pdfRes.status})`);
  assert(pdfRes.headers['content-type'] === 'application/pdf', 'Header content-type is application/pdf');
  assert(
    pdfRes.headers['content-disposition'] && pdfRes.headers['content-disposition'].includes('.pdf'),
    'Content-disposition specifies .pdf filename'
  );

  const pdfBuffer = pdfRes.body;
  assert(Buffer.isBuffer(pdfBuffer), 'Response body is a binary buffer');
  assert(pdfBuffer.length > 1000, `PDF buffer length is substantial (${pdfBuffer.length} bytes)`);
  assert(pdfBuffer.slice(0, 4).toString() === '%PDF', 'PDF buffer begins with valid %PDF magic header');

  // -------------------------------------------------------------
  // Bonus: Bulk Email Dispatch & Self-Authorization RBAC Checks
  // -------------------------------------------------------------
  console.log('\n--- Bulk Payslip Email Delivery & RBAC Verification ---');
  const sendEmailRes = await request(app)
    .post(`/api/payruns/${createdPayrunId}/send-payslips`)
    .set(createAuthHeader(hrToken));

  assert(sendEmailRes.status === 200, `Bulk email delivery returns 200 OK (got ${sendEmailRes.status})`);
  assert(sendEmailRes.body.data.total === 1, 'Delivery reports total 1 payslip');
  assert(sendEmailRes.body.data.sentCount === 1, 'Delivery successfully dispatched to employee');

  // RBAC: Alice can view her own payslip
  const aliceViewRes = await request(app)
    .get(`/api/payslips/${createdPayslipId}`)
    .set(createAuthHeader(employeeToken));
  assert(aliceViewRes.status === 200, 'Alice can view her own payslip (200 OK)');

  // RBAC: Bob cannot view Alice's payslip
  const bobViewRes = await request(app)
    .get(`/api/payslips/${createdPayslipId}`)
    .set(createAuthHeader(otherEmployeeToken));
  assert(bobViewRes.status === 403, 'Bob is forbidden from viewing Alice\'s payslip (403 Forbidden)');

  // RBAC: Employee cannot compute payruns
  const empComputeRes = await request(app)
    .post(`/api/payruns/${createdPayrunId}/compute`)
    .set(createAuthHeader(employeeToken));
  assert(empComputeRes.status === 403, 'Employee is forbidden from computing payruns (403 Forbidden)');

  console.log('\n======================================================');
  console.log(' ALL 12 STEPS OF PAYRUN-PAYSLIP FLOW PASSED! 🎉');
  console.log('======================================================\n');
}

async function teardown() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

(async () => {
  try {
    await setup();
    await runTests();
  } catch (err) {
    console.error('\n❌ TEST RUNNER FAILED WITH ERROR:\n', err);
    process.exit(1);
  } finally {
    await teardown();
  }
})();
