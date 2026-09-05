const mongoose = require('mongoose');
const config = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const {
  User,
  Employee,
  Department,
  JobPosition,
  Contract,
  WorkingSchedule
} = require('../models');

const seedDatabase = async () => {
  try {
    console.log('========================================================');
    console.log(' Starting PeoplePay360 Database Seeding...');
    console.log('========================================================');

    await connectDB();

    // 1. Clear existing collections
    console.log('[1/7] Cleaning existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Department.deleteMany({}),
      JobPosition.deleteMany({}),
      Contract.deleteMany({}),
      WorkingSchedule.deleteMany({})
    ]);
    console.log('      Existing collections cleared.');

    // 2. Seed Working Schedules
    console.log('[2/7] Seeding working schedules...');
    const schedules = await WorkingSchedule.create([
      {
        name: 'Standard 40h Workweek',
        type: 'Standard',
        weeklyWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '09:00',
        endTime: '18:00',
        breakDuration: 60,
        calculatedWeeklyHours: 40
      },
      {
        name: 'Flexible Tech 37.5h',
        type: 'Flexible',
        weeklyWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '09:30',
        endTime: '17:30',
        breakDuration: 30,
        calculatedWeeklyHours: 37.5
      },
      {
        name: 'Part-Time Morning Shift',
        type: 'Part-Time',
        weeklyWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '09:00',
        endTime: '13:00',
        breakDuration: 0,
        calculatedWeeklyHours: 20
      },
      {
        name: 'Weekend Operations Shift',
        type: 'Shift',
        weeklyWorkingDays: ['Saturday', 'Sunday'],
        startTime: '08:00',
        endTime: '16:00',
        breakDuration: 60,
        calculatedWeeklyHours: 14
      }
    ]);
    const [standardSchedule, flexSchedule, partTimeSchedule] = schedules;
    console.log(`      Created ${schedules.length} working schedules.`);

    // 3. Seed Departments (without managers initially)
    console.log('[3/7] Seeding departments...');
    const departments = await Department.create([
      {
        name: 'Engineering',
        code: 'ENG',
        description: 'Software development, infrastructure, and technical architecture'
      },
      {
        name: 'Human Resources',
        code: 'HR',
        description: 'Talent management, payroll, compliance, and employee operations'
      },
      {
        name: 'Finance & Accounting',
        code: 'FIN',
        description: 'Financial reporting, budgets, taxes, and fiscal audit'
      },
      {
        name: 'Sales & Marketing',
        code: 'MKT',
        description: 'Product marketing, business development, and enterprise sales'
      }
    ]);
    const [engDept, hrDept, finDept, mktDept] = departments;
    console.log(`      Created ${departments.length} departments.`);

    // 4. Seed Job Positions
    console.log('[4/7] Seeding job positions...');
    const positions = await JobPosition.create([
      // Engineering
      {
        name: 'VP of Engineering',
        department: engDept._id,
        description: 'Leads engineering teams and technical strategy'
      },
      {
        name: 'Lead Full Stack Engineer',
        department: engDept._id,
        description: 'Architects and builds core full stack applications'
      },
      {
        name: 'Senior Backend Engineer',
        department: engDept._id,
        description: 'Develops distributed backend APIs and payroll engines'
      },
      {
        name: 'Frontend Engineer',
        department: engDept._id,
        description: 'Builds responsive, accessible React user interfaces'
      },
      {
        name: 'Junior Software Engineer',
        department: engDept._id,
        description: 'Supports feature implementations and bug resolutions'
      },
      // HR
      {
        name: 'HR Director',
        department: hrDept._id,
        description: 'Directs organization-wide HR strategies and policies'
      },
      {
        name: 'Payroll & Benefits Specialist',
        department: hrDept._id,
        description: 'Manages employee contracts, compensations, and pay runs'
      },
      // Finance
      {
        name: 'Chief Financial Officer',
        department: finDept._id,
        description: 'Oversees overall financial health, tax compliance, and strategy'
      },
      {
        name: 'Senior Accountant',
        department: finDept._id,
        description: 'Handles ledger reconciliation and payroll disbursement approvals'
      }
    ]);

    const posMap = {};
    positions.forEach((p) => {
      posMap[p.name] = p._id;
    });
    console.log(`      Created ${positions.length} job positions.`);

    // 5. Seed Employees with Management Hierarchy
    console.log('[5/7] Seeding employees...');

    // 5a. Executive / Department Heads first
    const rajesh = await Employee.create({
      employeeId: 'EMP001',
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@peoplepay360.com',
      phone: '+1 (555) 234-5671',
      department: engDept._id,
      jobPosition: posMap['VP of Engineering'],
      manager: null,
      employeeType: 'Full-Time',
      joiningDate: new Date('2022-01-15'),
      status: 'Active',
      workingSchedule: standardSchedule._id
    });

    const priya = await Employee.create({
      employeeId: 'EMP002',
      name: 'Priya Nair',
      email: 'priya.nair@peoplepay360.com',
      phone: '+1 (555) 234-5672',
      department: hrDept._id,
      jobPosition: posMap['HR Director'],
      manager: null,
      employeeType: 'Full-Time',
      joiningDate: new Date('2022-03-01'),
      status: 'Active',
      workingSchedule: standardSchedule._id
    });

    const vikram = await Employee.create({
      employeeId: 'EMP003',
      name: 'Vikram Malhotra',
      email: 'vikram.malhotra@peoplepay360.com',
      phone: '+1 (555) 234-5673',
      department: finDept._id,
      jobPosition: posMap['Chief Financial Officer'],
      manager: null,
      employeeType: 'Full-Time',
      joiningDate: new Date('2021-11-10'),
      status: 'Active',
      workingSchedule: standardSchedule._id
    });

    // Update departments with actual managers
    await Department.findByIdAndUpdate(engDept._id, { manager: rajesh._id });
    await Department.findByIdAndUpdate(hrDept._id, { manager: priya._id });
    await Department.findByIdAndUpdate(finDept._id, { manager: vikram._id });

    // 5b. Mid-level and Team Members
    const jay = await Employee.create({
      employeeId: 'EMP004',
      name: 'Jay Patel',
      email: 'jay.patel@peoplepay360.com',
      phone: '+1 (555) 234-5674',
      department: engDept._id,
      jobPosition: posMap['Lead Full Stack Engineer'],
      manager: rajesh._id,
      employeeType: 'Full-Time',
      joiningDate: new Date('2023-02-01'),
      status: 'Active',
      workingSchedule: flexSchedule._id
    });

    const abhishek = await Employee.create({
      employeeId: 'EMP005',
      name: 'Abhishek Gupta',
      email: 'abhishek.gupta@peoplepay360.com',
      phone: '+1 (555) 234-5675',
      department: engDept._id,
      jobPosition: posMap['Frontend Engineer'],
      manager: jay._id,
      employeeType: 'Full-Time',
      joiningDate: new Date('2023-06-15'),
      status: 'Active',
      workingSchedule: flexSchedule._id
    });

    const krish = await Employee.create({
      employeeId: 'EMP006',
      name: 'Krish Verma',
      email: 'krish.verma@peoplepay360.com',
      phone: '+1 (555) 234-5676',
      department: hrDept._id,
      jobPosition: posMap['Payroll & Benefits Specialist'],
      manager: priya._id,
      employeeType: 'Full-Time',
      joiningDate: new Date('2023-04-10'),
      status: 'Active',
      workingSchedule: standardSchedule._id
    });

    const ananya = await Employee.create({
      employeeId: 'EMP007',
      name: 'Ananya Rao',
      email: 'ananya.rao@peoplepay360.com',
      phone: '+1 (555) 234-5677',
      department: finDept._id,
      jobPosition: posMap['Senior Accountant'],
      manager: vikram._id,
      employeeType: 'Full-Time',
      joiningDate: new Date('2023-08-01'),
      status: 'Active',
      workingSchedule: standardSchedule._id
    });

    const rohan = await Employee.create({
      employeeId: 'EMP008',
      name: 'Rohan Mehta',
      email: 'rohan.mehta@peoplepay360.com',
      phone: '+1 (555) 234-5678',
      department: engDept._id,
      jobPosition: posMap['Junior Software Engineer'],
      manager: jay._id,
      employeeType: 'Part-Time',
      joiningDate: new Date('2024-01-10'),
      status: 'Active',
      workingSchedule: partTimeSchedule._id
    });

    console.log('      Created 8 employees with hierarchical manager relationships.');

    // 6. Seed Contracts (Active + Historical expired contracts)
    console.log('[6/7] Seeding current and historical contracts...');
    const contracts = await Contract.create([
      // Rajesh - Historical Contract (2022-2023)
      {
        contractNumber: 'CTR-2022-001',
        employee: rajesh._id,
        startDate: new Date('2022-01-15'),
        endDate: new Date('2023-12-31'),
        wage: 130000,
        wageType: 'Annual',
        salaryStructure: {
          basic: 90000,
          allowances: { houseRent: 20000, transport: 10000, medical: 10000, other: 0 },
          deductions: { tax: 22000, providentFund: 8000, insurance: 3000, other: 0 }
        },
        department: engDept._id,
        jobPosition: posMap['VP of Engineering'],
        status: 'Expired',
        notes: 'Initial executive employment agreement'
      },
      // Rajesh - Current Active Contract (2024 onwards)
      {
        contractNumber: 'CTR-2024-001',
        employee: rajesh._id,
        startDate: new Date('2024-01-01'),
        endDate: null,
        wage: 155000,
        wageType: 'Annual',
        salaryStructure: {
          basic: 110000,
          allowances: { houseRent: 25000, transport: 10000, medical: 10000, other: 0 },
          deductions: { tax: 28000, providentFund: 10000, insurance: 4000, other: 0 }
        },
        department: engDept._id,
        jobPosition: posMap['VP of Engineering'],
        status: 'Active',
        notes: 'Annual executive performance revision'
      },

      // Priya Nair - Active Contract
      {
        contractNumber: 'CTR-2022-002',
        employee: priya._id,
        startDate: new Date('2022-03-01'),
        endDate: null,
        wage: 110000,
        wageType: 'Annual',
        salaryStructure: {
          basic: 80000,
          allowances: { houseRent: 15000, transport: 8000, medical: 7000, other: 0 },
          deductions: { tax: 18000, providentFund: 7000, insurance: 3000, other: 0 }
        },
        department: hrDept._id,
        jobPosition: posMap['HR Director'],
        status: 'Active',
        notes: 'HR Director standard employment agreement'
      },

      // Jay Patel - Historical Contract (2023)
      {
        contractNumber: 'CTR-2023-004',
        employee: jay._id,
        startDate: new Date('2023-02-01'),
        endDate: new Date('2024-01-31'),
        wage: 85000,
        wageType: 'Annual',
        salaryStructure: {
          basic: 65000,
          allowances: { houseRent: 10000, transport: 5000, medical: 5000, other: 0 },
          deductions: { tax: 14000, providentFund: 5000, insurance: 2500, other: 0 }
        },
        department: engDept._id,
        jobPosition: posMap['Lead Full Stack Engineer'],
        status: 'Expired',
        notes: 'Initial hire contract'
      },
      // Jay Patel - Active Contract
      {
        contractNumber: 'CTR-2024-004',
        employee: jay._id,
        startDate: new Date('2024-02-01'),
        endDate: null,
        wage: 102000,
        wageType: 'Annual',
        salaryStructure: {
          basic: 78000,
          allowances: { houseRent: 12000, transport: 6000, medical: 6000, other: 0 },
          deductions: { tax: 17000, providentFund: 6500, insurance: 3000, other: 0 }
        },
        department: engDept._id,
        jobPosition: posMap['Lead Full Stack Engineer'],
        status: 'Active',
        notes: 'Merit promotion and wage revision'
      },

      // Abhishek Gupta - Active Contract
      {
        contractNumber: 'CTR-2023-005',
        employee: abhishek._id,
        startDate: new Date('2023-06-15'),
        endDate: null,
        wage: 82000,
        wageType: 'Annual',
        salaryStructure: {
          basic: 62000,
          allowances: { houseRent: 10000, transport: 5000, medical: 5000, other: 0 },
          deductions: { tax: 13000, providentFund: 5000, insurance: 2500, other: 0 }
        },
        department: engDept._id,
        jobPosition: posMap['Frontend Engineer'],
        status: 'Active',
        notes: 'Frontend UI specialist contract'
      },

      // Krish Verma - Active Contract
      {
        contractNumber: 'CTR-2023-006',
        employee: krish._id,
        startDate: new Date('2023-04-10'),
        endDate: null,
        wage: 86000,
        wageType: 'Annual',
        salaryStructure: {
          basic: 66000,
          allowances: { houseRent: 10000, transport: 5000, medical: 5000, other: 0 },
          deductions: { tax: 14000, providentFund: 5500, insurance: 2500, other: 0 }
        },
        department: hrDept._id,
        jobPosition: posMap['Payroll & Benefits Specialist'],
        status: 'Active',
        notes: 'Payroll and backend compensation engineer contract'
      },

      // Ananya Rao - Active Contract
      {
        contractNumber: 'CTR-2023-007',
        employee: ananya._id,
        startDate: new Date('2023-08-01'),
        endDate: null,
        wage: 74000,
        wageType: 'Annual',
        salaryStructure: {
          basic: 56000,
          allowances: { houseRent: 9000, transport: 4500, medical: 4500, other: 0 },
          deductions: { tax: 11000, providentFund: 4500, insurance: 2000, other: 0 }
        },
        department: finDept._id,
        jobPosition: posMap['Senior Accountant'],
        status: 'Active',
        notes: 'Finance accounting agreement'
      },

      // Rohan Mehta - Active Part-Time Contract
      {
        contractNumber: 'CTR-2024-008',
        employee: rohan._id,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2025-01-09'),
        wage: 32000,
        wageType: 'Annual',
        salaryStructure: {
          basic: 28000,
          allowances: { houseRent: 2000, transport: 1000, medical: 1000, other: 0 },
          deductions: { tax: 3500, providentFund: 1500, insurance: 1000, other: 0 }
        },
        department: engDept._id,
        jobPosition: posMap['Junior Software Engineer'],
        status: 'Active',
        notes: 'Part-time graduate contract'
      }
    ]);

    // Update active contracts on employees
    for (const contract of contracts) {
      if (contract.status === 'Active') {
        await Employee.findByIdAndUpdate(contract.employee, {
          activeContract: contract._id
        });
      }
    }
    console.log(`      Created ${contracts.length} contracts (including historical and active).`);

    // 7. Seed Users for Auth & Role-Based Testing
    console.log('[7/7] Seeding authentication users...');
    const users = await User.create([
      {
        name: 'System Administrator',
        email: 'admin@peoplepay360.com',
        password: 'Password123!',
        role: 'Admin',
        employee: priya._id,
        isActive: true
      },
      {
        name: 'Priya Nair (HR Manager)',
        email: 'hrmanager@peoplepay360.com',
        password: 'Password123!',
        role: 'HR Manager',
        employee: priya._id,
        isActive: true
      },
      {
        name: 'Krish Verma (HR Payroll User)',
        email: 'payrolluser@peoplepay360.com',
        password: 'Password123!',
        role: 'HR Payroll User',
        employee: krish._id,
        isActive: true
      },
      {
        name: 'Vikram Malhotra (HR Payroll Manager)',
        email: 'payrollmanager@peoplepay360.com',
        password: 'Password123!',
        role: 'HR Payroll Manager',
        employee: vikram._id,
        isActive: true
      },
      {
        name: 'Jay Patel (Full Stack Lead)',
        email: 'jay@peoplepay360.com',
        password: 'Password123!',
        role: 'Employee',
        employee: jay._id,
        isActive: true
      },
      {
        name: 'Abhishek Gupta (Frontend)',
        email: 'abhishek@peoplepay360.com',
        password: 'Password123!',
        role: 'Employee',
        employee: abhishek._id,
        isActive: true
      },
      {
        name: 'Rohan Mehta (Standard Employee)',
        email: 'employee@peoplepay360.com',
        password: 'Password123!',
        role: 'Employee',
        employee: rohan._id,
        isActive: true
      }
    ]);

    // Link user records back to employees
    for (const user of users) {
      if (user.employee) {
        await Employee.findByIdAndUpdate(user.employee, { user: user._id });
      }
    }

    console.log(`      Created ${users.length} authenticated users.`);

    console.log('========================================================');
    console.log(' Database Seeding Finished Successfully!');
    console.log('========================================================');
    console.log('\nDEMO CREDENTIALS (Password for ALL accounts: Password123!):');
    console.log('--------------------------------------------------------');
    console.log('1. Admin:              admin@peoplepay360.com');
    console.log('2. HR Manager:         hrmanager@peoplepay360.com');
    console.log('3. HR Payroll User:    payrolluser@peoplepay360.com');
    console.log('4. HR Payroll Manager: payrollmanager@peoplepay360.com');
    console.log('5. Employee:           employee@peoplepay360.com');
    console.log('--------------------------------------------------------\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n[Error] Database seeding failed:', error);
    await disconnectDB();
    process.exit(1);
  }
};

seedDatabase();
