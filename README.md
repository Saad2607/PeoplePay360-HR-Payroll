# PeoplePay360 — HR & Payroll Management System

A production-grade, modular HR and Payroll Management System built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

This repository contains the backend architecture, relational database models, authentication & 5-role RBAC, core HR modules, and shared services foundation.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Authentication & RBAC](#authentication--rbac)
  - [Roles & Permissions Matrix](#roles--permissions-matrix)
  - [Demo User Accounts](#demo-user-accounts)
- [API Integration Contract](#api-integration-contract)
  - [Standard Response Envelope](#standard-response-envelope)
  - [Authentication Endpoints](#1-authentication-endpoints-apiauth)
  - [Employee Endpoints](#2-employee-endpoints-apiemployees)
  - [Department Endpoints](#3-department-endpoints-apidepartments)
  - [Job Position Endpoints](#4-job-position-endpoints-apijob-positions)
  - [Contract Endpoints](#5-contract-endpoints-apicontracts)
  - [Working Schedule Endpoints](#6-working-schedule-endpoints-apischedules)
  - [System Health Check](#7-system-health-check-apihealth)
- [Developer Guide for Krish (Payroll & Attendance)](#developer-guide-for-krish-payroll--attendance)
  - [Using Shared Services](#using-shared-services)
  - [Period-Specific Applicable Contract Engine](#period-specific-applicable-contract-engine)
- [Developer Guide for Jay & Abhishek (Frontend)](#developer-guide-for-jay--abhishek-frontend)
  - [Axios Configuration](#axios-configuration)
  - [Error Handling Pattern](#error-handling-pattern)

---

## System Architecture

```
PeoplePay360 HR & Payroll/
├── README.md                         # Complete API Contract & Developer Documentation
├── .gitignore                        # Standard Git ignore rules
└── server/
    ├── config/
    │   ├── db.js                     # MongoDB lifecycle manager (reconnects, graceful shutdown)
    │   ├── env.js                    # Strict environment validator
    │   └── roles.js                  # 5-role RBAC permission constants & helper functions
    ├── controllers/
    │   ├── authController.js         # User registration, login, profile, logout
    │   ├── contractController.js     # Contract CRUD, active retrieval, applicable contract lookup
    │   ├── departmentController.js   # Department CRUD with real-time employee counts
    │   ├── employeeController.js     # Scoped and paginated employee queries, mutations
    │   ├── jobPositionController.js  # Department-scoped position management
    │   └── scheduleController.js     # Working schedule CRUD & employee/contract assignments
    ├── middleware/
    │   ├── auth.js                   # JWT verification & RBAC authorization middleware
    │   ├── errorHandler.js           # Centralized error handler (Mongoose, JWT, 400/404/409/500)
    │   └── validate.js               # Express-validator error handler
    ├── models/
    │   ├── Contract.js               # Contract schema, salary structure, grossSalary virtual
    │   ├── Department.js             # Department schema with manager and employee virtuals
    │   ├── Employee.js               # Employee schema with hierarchy & extensible virtuals
    │   ├── JobPosition.js            # JobPosition schema linked to Department
    │   ├── User.js                   # User auth model with bcrypt hashing & role permissions
    │   ├── WorkingSchedule.js        # Working schedule with auto-calculated weekly hours
    │   └── index.js                  # Centralized model aggregator
    ├── routes/
    │   ├── authRoutes.js             # /api/auth
    │   ├── contractRoutes.js         # /api/contracts
    │   ├── departmentRoutes.js       # /api/departments
    │   ├── employeeRoutes.js         # /api/employees
    │   ├── jobPositionRoutes.js      # /api/job-positions
    │   ├── scheduleRoutes.js         # /api/schedules
    │   └── index.js                  # Root router & /api/health endpoint
    ├── seed/
    │   └── seed.js                   # Database seeder with realistic organizational datasets
    ├── services/
    │   ├── authService.js            # Auth business logic
    │   ├── contractService.js        # Contract lifecycle, overlap detection & applicable contract engine
    │   ├── departmentService.js      # Department business logic
    │   ├── employeeService.js        # Employee querying, filtering, and mutations
    │   ├── scheduleService.js        # Schedule CRUD and assignment logic
    │   ├── sharedService.js          # Shared helper library (lookups, date/role/pagination checks)
    │   └── index.js                  # Services aggregator for team-wide reuse
    ├── test/
    │   └── test-runner.js            # Comprehensive integration and demonstration test suite
    ├── utils/
    │   ├── apiResponse.js            # Standard response formatters
    │   ├── jwt.js                    # JWT signing and verification
    │   ├── logger.js                 # Structured console logger
    │   └── scheduleCalculator.js     # Deterministic working hours calculator
    ├── validators/
    │   ├── authValidator.js          # Auth input validation
    │   ├── contractValidator.js      # Contract and payroll period validation
    │   ├── departmentValidator.js    # Department validation
    │   ├── employeeValidator.js      # Employee validation with circular manager checks
    │   ├── jobPositionValidator.js   # Job position validation
    │   └── scheduleValidator.js      # Schedule format and assignment validation
    ├── .env                          # Local environment variables
    ├── .env.example                  # Environment configuration template
    ├── app.js                        # Express application instance & middleware chain
    ├── package.json                  # Dependencies, test scripts, and dev tools
    └── server.js                     # HTTP server bootstrapper & lifecycle management
```

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

### Setup & Installation
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Seed the database with representative demo data
npm run seed

# Run the backend test suite
npm test

# Start development server with auto-reload (nodemon)
npm run dev
```

Server will run on: `http://localhost:5000`  
Allowed frontend origin: `http://localhost:5173` (Vite)

---

## Environment Variables

Configured in `server/.env`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for Express server |
| `NODE_ENV` | `development` | Environment (`development` \| `production`) |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/peoplepay360` | MongoDB connection URI |
| `JWT_SECRET` | `peoplepay360_super_secret_jwt_key_for_hackathon_2026` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | `7d` | Token validity duration |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin for React frontend |

---

## Authentication & RBAC

### Roles & Permissions Matrix

| Role | Employee Management | Contract Management | Schedule Management | Attendance & Leaves | Payruns & Payslips | Salary Structures & Rules |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Employee** | View Own Details Only | View Own Contract Only | View Own Schedule Only | View Own / Submit Requests | ❌ No Access | ❌ No Access |
| **HR Manager** | Full CRUD | Full CRUD | Full CRUD & Assignments | Full Management | ❌ No Access | ❌ No Access |
| **HR Payroll User** | Full CRUD | Full CRUD | Full CRUD & Assignments | Full Management | Create, Read, Update | 👁️ Read-Only |
| **HR Payroll Manager**| Full CRUD | Full CRUD | Full CRUD & Assignments | Full Management | Full Management | Full CRUD |
| **Admin** | Full Access | Full Access | Full Access | Full Access | Full Access | Full Access |

### Demo User Accounts

All seed user accounts use password: **`Password123!`**

| Persona | Role | Email |
| :--- | :--- | :--- |
| **System Admin** | `Admin` | `admin@peoplepay360.com` |
| **HR Manager (Priya)** | `HR Manager` | `hrmanager@peoplepay360.com` |
| **HR Payroll User (Krish)**| `HR Payroll User` | `payrolluser@peoplepay360.com` |
| **HR Payroll Manager (Vikram)**| `HR Payroll Manager` | `payrollmanager@peoplepay360.com` |
| **Standard Employee (Rohan)** | `Employee` | `employee@peoplepay360.com` |
| **Lead Developer (Jay)** | `Employee` | `jay@peoplepay360.com` |
| **Frontend Engineer (Abhishek)**| `Employee` | `abhishek@peoplepay360.com` |

---

## API Integration Contract

### Standard Response Envelope

#### Successful Response:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### Error Response:
```json
{
  "success": false,
  "message": "Validation Error: Invalid input parameters",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" }
  ]
}
```

---

### 1. Authentication Endpoints (`/api/auth`)

#### `POST /api/auth/register`
* **Access:** Public / HR / Admin
* **Body:**
```json
{
  "name": "Alex Carter",
  "email": "alex.carter@peoplepay360.com",
  "password": "Password123!",
  "role": "Employee",
  "employee": "67cad4715fbc7463f8216123"
}
```
* **Response:** `201 Created` with created user object and JWT token.

#### `POST /api/auth/login`
* **Access:** Public
* **Body:**
```json
{
  "email": "hrmanager@peoplepay360.com",
  "password": "Password123!"
}
```
* **Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "67cad4715fbc7463f8216120",
      "name": "Priya Nair",
      "email": "hrmanager@peoplepay360.com",
      "role": "HR Manager",
      "employee": { ... }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### `GET /api/auth/me`
* **Access:** Authenticated (`Bearer <token>`)
* **Response:** `200 OK` with populated employee record, contracts, and schedule.

---

### 2. Employee Endpoints (`/api/employees`)

#### `GET /api/employees`
* **Access:** Authenticated
  * *Note:* Standard `Employee` role automatically receives only their own record. `HR Manager`, `HR Payroll User`, `HR Payroll Manager`, and `Admin` receive all matching records.
* **Query Parameters:**
  * `search`: text query matching name, email, or employeeId
  * `department`: ObjectId
  * `jobPosition`: ObjectId
  * `status`: `Active` | `On Leave` | `Terminated` | `Probation`
  * `employeeType`: `Full-Time` | `Part-Time` | `Contract` | `Intern`
  * `page`: integer (default `1`)
  * `limit`: integer (default `20`)
  * `sortBy`: string (default `name`)
  * `sortOrder`: `asc` | `desc`
* **Response:** `200 OK` with paginated list.

#### `GET /api/employees/:id`
* **Access:** Employee (Self) or HR Managers / Admin
* **Response:** `200 OK` with populated department, jobPosition, manager, workingSchedule, activeContract, and virtual lists (`contracts`, `directReports`, `attendances`, `timeOffRequests`).

#### `POST /api/employees`
* **Access:** HR Managers, Admin
* **Body:**
```json
{
  "employeeId": "EMP010",
  "name": "Kavita Rao",
  "email": "kavita.rao@peoplepay360.com",
  "phone": "+1 (555) 234-9988",
  "department": "67cad4715fbc7463f8216101",
  "jobPosition": "67cad4715fbc7463f8216105",
  "workingSchedule": "67cad4715fbc7463f8216110",
  "manager": "67cad4715fbc7463f8216102",
  "employeeType": "Full-Time",
  "joiningDate": "2024-03-01",
  "status": "Active"
}
```
* **Response:** `201 Created`

#### `PUT /api/employees/:id`
* **Access:** HR Managers, Admin
* **Body:** Partial employee fields to update.
* **Response:** `200 OK`

#### `DELETE /api/employees/:id`
* **Access:** Admin only
* **Behavior:** Performs soft-delete by setting status to `Terminated` and unsetting `activeContract` to ensure audit integrity.
* **Response:** `200 OK`

---

### 3. Department Endpoints (`/api/departments`)

#### `GET /api/departments`
* **Access:** Authenticated
* **Response:** `200 OK` with real-time `employeeCount` on each department.

#### `GET /api/departments/:id`
* **Access:** Authenticated
* **Response:** `200 OK` with manager, job positions, active employee list, and total employee count.

#### `POST /api/departments`
* **Access:** HR Managers, Admin
* **Body:**
```json
{
  "name": "Quality Assurance",
  "code": "QA",
  "description": "Software quality assurance and automated testing",
  "manager": "67cad4715fbc7463f8216102"
}
```
* **Response:** `201 Created`

#### `PUT /api/departments/:id`
* **Access:** HR Managers, Admin
* **Response:** `200 OK`

#### `DELETE /api/departments/:id`
* **Access:** Admin only
* **Validation:** Rejects with `400 Bad Request` if active employees are currently assigned to the department.

---

### 4. Job Position Endpoints (`/api/job-positions`)

#### `GET /api/job-positions`
* **Access:** Authenticated
* **Query Parameters:** `?department=<departmentId>`
* **Response:** `200 OK` with list of positions and `employeeCount` per position.

#### `POST /api/job-positions`
* **Access:** HR Managers, Admin
* **Body:**
```json
{
  "name": "Automation Test Lead",
  "department": "67cad4715fbc7463f8216101",
  "description": "Designs and orchestrates CI/CD automated test suites"
}
```
* **Response:** `201 Created`

#### `PUT /api/job-positions/:id`
* **Access:** HR Managers, Admin
* **Response:** `200 OK`

#### `DELETE /api/job-positions/:id`
* **Access:** Admin only
* **Validation:** Rejects if active employees currently hold this position.

---

### 5. Contract Endpoints (`/api/contracts`)

#### `GET /api/contracts`
* **Access:** HR Managers, Admin
* **Query Parameters:** `status`, `department`, `employee`, `page`, `limit`
* **Response:** `200 OK`

#### `GET /api/contracts/active/:employeeId`
* **Access:** Authenticated
* **Response:** `200 OK` with currently active contract.

#### `GET /api/contracts/employee/:employeeId`
* **Access:** Authenticated
* **Response:** `200 OK` with complete contract history (historical expired contracts + active contracts).

#### `POST /api/contracts/applicable`
* **CRITICAL BUSINESS RULE FOR PAYROLL:**
  Retrieves the contract in effect during the designated payroll period. Does not default to the latest contract.
* **Access:** HR Managers, HR Payroll User, HR Payroll Manager, Admin
* **Body:**
```json
{
  "employeeId": "67cad4715fbc7463f8216125",
  "payrollPeriod": {
    "startDate": "2024-03-01",
    "endDate": "2024-03-31"
  }
}
```
* **Response:** `200 OK`
```json
{
  "success": true,
  "message": "Applicable contract for period retrieved successfully",
  "data": {
    "_id": "67cad4715fbc7463f8216135",
    "contractNumber": "CTR-2024-001",
    "employee": "67cad4715fbc7463f8216125",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.999Z",
    "wage": 85000,
    "wageType": "Annual",
    "salaryStructure": {
      "basic": 65000,
      "allowances": { "houseRent": 10000, "transport": 5000, "medical": 5000, "other": 0 },
      "deductions": { "tax": 14000, "providentFund": 5000, "insurance": 2500, "other": 0 }
    },
    "grossSalary": 85000,
    "status": "Active"
  }
}
```

#### `POST /api/contracts`
* **Access:** HR Managers, Admin
* **Body:**
```json
{
  "contractNumber": "CTR-2025-010",
  "employee": "67cad4715fbc7463f8216125",
  "startDate": "2025-01-01",
  "endDate": null,
  "wage": 92000,
  "wageType": "Annual",
  "salaryStructure": {
    "basic": 70000,
    "allowances": { "houseRent": 12000, "transport": 5000, "medical": 5000, "other": 0 },
    "deductions": { "tax": 16000, "providentFund": 6000, "insurance": 3000, "other": 0 }
  },
  "department": "67cad4715fbc7463f8216101",
  "jobPosition": "67cad4715fbc7463f8216105",
  "workingSchedule": "67cad4715fbc7463f8216110",
  "status": "Active",
  "notes": "Annual revision contract"
}
```
* **Validation & Overlap Prevention:**
  If an existing active contract overlaps with this date interval, rejects with `409 Conflict` and reports the conflicting contract number.
* **Response:** `201 Created`

#### `PUT /api/contracts/:id`
* **Access:** HR Managers, Admin
* **Response:** `200 OK`

#### `DELETE /api/contracts/:id`
* **Access:** Admin only
* **Response:** `200 OK`

---

### 6. Working Schedule Endpoints (`/api/schedules`)

#### `GET /api/schedules`
* **Access:** Authenticated
* **Response:** `200 OK` with list of schedules and counts of assigned employees and contracts.

#### `POST /api/schedules`
* **Access:** HR Managers, Admin
* **Body:**
```json
{
  "name": "Standard Tech 40h",
  "type": "Standard",
  "weeklyWorkingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "startTime": "09:00",
  "endTime": "18:00",
  "breakDuration": 60
}
```
* **Automatic Calculation:** Weekly hours are strictly computed:
  $$\text{Hours} = (\text{18:00} - \text{09:00} - \text{60m}) \times 5 = 8 \times 5 = 40.00\text{ hours}$$
  Manual entry cannot override this value.
* **Response:** `201 Created`

#### `PATCH /api/schedules/assign-employee`
* **Access:** HR Managers, Admin
* **Body:**
```json
{
  "employeeId": "67cad4715fbc7463f8216125",
  "scheduleId": "67cad4715fbc7463f8216110"
}
```
* **Response:** `200 OK` with updated employee.

#### `PATCH /api/schedules/assign-contract`
* **Access:** HR Managers, Admin
* **Body:**
```json
{
  "contractId": "67cad4715fbc7463f8216135",
  "scheduleId": "67cad4715fbc7463f8216110"
}
```
* **Response:** `200 OK` with updated contract.

---

### 7. System Health Check (`/api/health`)

#### `GET /api/health`
* **Access:** Public
* **Response:** `200 OK`
```json
{
  "success": true,
  "message": "PeoplePay360 API is healthy and running",
  "data": {
    "status": "UP",
    "uptime": "342s",
    "timestamp": "2026-09-05T11:00:00.000Z",
    "service": "PeoplePay360 HR & Payroll Core API",
    "version": "1.0.0"
  }
}
```

---

## Developer Guide for Krish (Payroll & Attendance)

### Using Shared Services

All models and business services are consolidated into central entry points:

```javascript
// 1. Models Import
const {
  User,
  Employee,
  Department,
  JobPosition,
  Contract,
  WorkingSchedule
} = require('../models');

// 2. Services Import
const {
  employeeService,
  contractService,
  scheduleService,
  sharedService
} = require('../services');
```

### Period-Specific Applicable Contract Engine

When executing payruns or generating historical payslips:

```javascript
const { lookupApplicableContract } = require('../services/sharedService');

// Define payroll period
const payrollPeriod = {
  startDate: new Date('2024-03-01'),
  endDate: new Date('2024-03-31')
};

// Retrieve exact contract effective during March 2024
const contract = await lookupApplicableContract(employeeId, payrollPeriod);

// Access salary structure components
const { basic, allowances, deductions } = contract.salaryStructure;
const baseWage = contract.wage;
```

### Extending Attendance & Leaves
In `Employee.js`, virtual hooks are ready:
* `employee.attendances` $\rightarrow$ linked to model `'Attendance'`
* `employee.timeOffRequests` $\rightarrow$ linked to model `'TimeOff'`
* `employee.allocations` $\rightarrow$ linked to model `'LeaveAllocation'`

---

## Developer Guide for Jay & Abhishek (Frontend)

### Axios Configuration

Set up an Axios client with the Bearer token interceptor:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('peoplepay360_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Error Handling Pattern

The API returns consistent error envelopes:

```javascript
try {
  const response = await api.post('/employees', employeeData);
  console.log('Created:', response.data.data);
} catch (error) {
  if (error.response) {
    const { message, errors } = error.response.data;
    console.error('API Error:', message);
    if (errors) {
      // Array of field validation errors: [{ field: 'email', message: '...' }]
      errors.forEach((err) => toast.error(`${err.field}: ${err.message}`));
    } else {
      toast.error(message);
    }
  }
}
```
