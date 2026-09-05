const mongoose = require('mongoose');

const allowanceSchema = new mongoose.Schema(
  {
    houseRent: { type: Number, default: 0, min: 0 },
    transport: { type: Number, default: 0, min: 0 },
    medical: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const deductionSchema = new mongoose.Schema(
  {
    tax: { type: Number, default: 0, min: 0 },
    providentFund: { type: Number, default: 0, min: 0 },
    insurance: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const salaryStructureSchema = new mongoose.Schema(
  {
    basic: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: [0, 'Basic salary cannot be negative']
    },
    allowances: {
      type: allowanceSchema,
      default: () => ({})
    },
    deductions: {
      type: deductionSchema,
      default: () => ({})
    }
  },
  { _id: false }
);

const contractSchema = new mongoose.Schema(
  {
    contractNumber: {
      type: String,
      required: [true, 'Contract number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    startDate: {
      type: Date,
      required: [true, 'Contract start date is required']
    },
    endDate: {
      type: Date,
      default: null
    },
    wage: {
      type: Number,
      required: [true, 'Wage/Total Base Compensation is required'],
      min: [0, 'Wage cannot be negative']
    },
    wageType: {
      type: String,
      enum: ['Monthly', 'Hourly', 'Annual'],
      default: 'Monthly'
    },
    salaryStructure: {
      type: salaryStructureSchema,
      required: [true, 'Salary structure is required']
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required']
    },
    jobPosition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosition',
      required: [true, 'Job position reference is required']
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Expired', 'Terminated'],
      default: 'Active'
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for fast lookups
contractSchema.index({ employee: 1, status: 1 });
contractSchema.index({ startDate: -1 });

// Virtual to calculate gross compensation (basic + all allowances)
contractSchema.virtual('grossSalary').get(function () {
  if (!this.salaryStructure) return this.wage || 0;
  const { basic = 0, allowances = {} } = this.salaryStructure;
  const totalAllowances =
    (allowances.houseRent || 0) +
    (allowances.transport || 0) +
    (allowances.medical || 0) +
    (allowances.other || 0);
  return basic + totalAllowances;
});

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;
