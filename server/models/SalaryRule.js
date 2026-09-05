const mongoose = require('mongoose');

const salaryRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Salary rule name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Salary rule code is required (e.g. BASIC, HRA, GROSS)'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [30, 'Code cannot exceed 30 characters'],
      match: [/^[A-Z0-9_]+$/, 'Code must contain only uppercase letters, numbers, and underscores']
    },
    category: {
      type: String,
      enum: {
        values: ['Basic', 'Allowances', 'Gross', 'Deductions', 'Net'],
        message: '{VALUE} is not a valid category. Allowed: Basic, Allowances, Gross, Deductions, Net'
      },
      required: [true, 'Salary rule category is required']
    },
    sequence: {
      type: Number,
      required: [true, 'Execution sequence number is required'],
      min: [1, 'Sequence must be at least 1'],
      default: 10,
      index: true
    },
    computationType: {
      type: String,
      enum: {
        values: ['Fixed amount', 'Percentage', 'Formula'],
        message: '{VALUE} is not a valid computation type. Allowed: Fixed amount, Percentage, Formula'
      },
      required: [true, 'Computation type is required']
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Amount cannot be negative']
    },
    percentageBase: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'BASIC' // code of the rule to compute percentage against
    },
    formula: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

salaryRuleSchema.index({ sequence: 1, category: 1 });

const SalaryRule = mongoose.model('SalaryRule', salaryRuleSchema);

module.exports = SalaryRule;
