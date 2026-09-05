const SalaryStructure = require('../models/SalaryStructure');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/salary-structures
 * @desc    Get all salary structures with populated rules
 * @access  Private
 */
const getSalaryStructures = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    const structures = await SalaryStructure.find(filter)
      .populate({
        path: 'salaryRules',
        options: { sort: { sequence: 1 } }
      })
      .sort({ name: 1 });

    return successResponse(res, structures, 'Salary structures retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/salary-structures/:id
 * @desc    Get salary structure by ID
 * @access  Private
 */
const getSalaryStructureById = async (req, res, next) => {
  try {
    const structure = await SalaryStructure.findById(req.params.id).populate({
      path: 'salaryRules',
      options: { sort: { sequence: 1 } }
    });

    if (!structure) {
      return errorResponse(res, 'Salary structure not found', 404);
    }

    return successResponse(res, structure, 'Salary structure retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/salary-structures
 * @desc    Create a new salary structure
 * @access  Private (Admin, HR)
 */
const createSalaryStructure = async (req, res, next) => {
  try {
    const { name, description, salaryRules, isActive } = req.body;

    const existing = await SalaryStructure.findOne({ name });
    if (existing) {
      return errorResponse(res, `A salary structure with name '${name}' already exists.`, 409);
    }

    const structure = await SalaryStructure.create({
      name,
      description: description || '',
      salaryRules: salaryRules || [],
      isActive: isActive !== undefined ? isActive : true
    });

    const populated = await SalaryStructure.findById(structure._id).populate({
      path: 'salaryRules',
      options: { sort: { sequence: 1 } }
    });

    return successResponse(res, populated, 'Salary structure created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/salary-structures/:id
 * @desc    Update salary structure
 * @access  Private (Admin, HR)
 */
const updateSalaryStructure = async (req, res, next) => {
  try {
    const structure = await SalaryStructure.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate({
      path: 'salaryRules',
      options: { sort: { sequence: 1 } }
    });

    if (!structure) {
      return errorResponse(res, 'Salary structure not found', 404);
    }

    return successResponse(res, structure, 'Salary structure updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/salary-structures/:id
 * @desc    Deactivate/Delete salary structure
 * @access  Private (Admin, HR)
 */
const deleteSalaryStructure = async (req, res, next) => {
  try {
    const structure = await SalaryStructure.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!structure) {
      return errorResponse(res, 'Salary structure not found', 404);
    }

    return successResponse(res, structure, 'Salary structure deactivated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure
};
