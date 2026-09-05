const SalaryRule = require('../models/SalaryRule');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/salary-rules
 * @desc    Get all salary rules ordered by sequence
 * @access  Private
 */
const getSalaryRules = async (req, res, next) => {
  try {
    const { category, isActive, computationType } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (computationType) filter.computationType = computationType;
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    const rules = await SalaryRule.find(filter).sort({ sequence: 1 });
    return successResponse(res, rules, 'Salary rules retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/salary-rules/:id
 * @desc    Get salary rule by ID
 * @access  Private
 */
const getSalaryRuleById = async (req, res, next) => {
  try {
    const rule = await SalaryRule.findById(req.params.id);
    if (!rule) {
      return errorResponse(res, 'Salary rule not found', 404);
    }
    return successResponse(res, rule, 'Salary rule retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/salary-rules
 * @desc    Create a new salary rule
 * @access  Private (Admin, HR)
 */
const createSalaryRule = async (req, res, next) => {
  try {
    const {
      name,
      code,
      category,
      sequence,
      computationType,
      amount,
      percentageBase,
      formula,
      description,
      isActive
    } = req.body;

    const existing = await SalaryRule.findOne({ code: code.toUpperCase() });
    if (existing) {
      return errorResponse(res, `A salary rule with code '${code.toUpperCase()}' already exists.`, 409);
    }

    const rule = await SalaryRule.create({
      name,
      code: code.toUpperCase(),
      category,
      sequence,
      computationType,
      amount: amount || 0,
      percentageBase: percentageBase ? percentageBase.toUpperCase() : 'BASIC',
      formula: formula || '',
      description: description || '',
      isActive: isActive !== undefined ? isActive : true
    });

    return successResponse(res, rule, 'Salary rule created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/salary-rules/:id
 * @desc    Update salary rule
 * @access  Private (Admin, HR)
 */
const updateSalaryRule = async (req, res, next) => {
  try {
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }
    if (req.body.percentageBase) {
      req.body.percentageBase = req.body.percentageBase.toUpperCase();
    }

    const rule = await SalaryRule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!rule) {
      return errorResponse(res, 'Salary rule not found', 404);
    }

    return successResponse(res, rule, 'Salary rule updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/salary-rules/:id
 * @desc    Deactivate/Delete salary rule
 * @access  Private (Admin, HR)
 */
const deleteSalaryRule = async (req, res, next) => {
  try {
    const rule = await SalaryRule.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!rule) {
      return errorResponse(res, 'Salary rule not found', 404);
    }

    return successResponse(res, rule, 'Salary rule deactivated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalaryRules,
  getSalaryRuleById,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule
};
