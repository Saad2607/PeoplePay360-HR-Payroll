const mongoose = require('mongoose');

const payrunSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Payrun name is required'],
      trim: true,
      maxlength: [150, 'Payrun name cannot exceed 150 characters']
    },
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary structure is required']
    },
    period: {
      startDate: {
        type: Date,
        required: [true, 'Payroll period start date is required']
      },
      endDate: {
        type: Date,
        required: [true, 'Payroll period end date is required']
      }
    },
    selectedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    ],
    status: {
      type: String,
      enum: {
        values: ['Draft', 'Computed', 'Validated', 'Paid'],
        message: '{VALUE} is not a valid payrun status'
      },
      default: 'Draft',
      index: true
    },
    totalGross: {
      type: Number,
      default: 0,
      min: 0
    },
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0
    },
    totalNet: {
      type: Number,
      default: 0,
      min: 0
    },
    payslips: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payslip'
      }
    ],
    validation: {
      isValid: { type: Boolean, default: true },
      validatedAt: { type: Date, default: null },
      validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      errors: [{ type: String }],
      warnings: [{ type: String }]
    },
    payment: {
      paidAt: { type: Date, default: null },
      paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      paymentMethod: {
        type: String,
        enum: ['Bank Transfer', 'Cheque', 'Direct Deposit', 'Cash'],
        default: 'Bank Transfer'
      },
      reference: { type: String, trim: true, default: '' }
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for querying runs by period and status
payrunSchema.index({ 'period.startDate': -1, 'period.endDate': -1, status: 1 });

const Payrun = mongoose.model('Payrun', payrunSchema);

module.exports = Payrun;
