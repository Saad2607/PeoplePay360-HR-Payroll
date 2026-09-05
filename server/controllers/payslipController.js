const payrunService = require('../services/payrunService');
const pdfService = require('../services/pdfService');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/payslips
 * @desc    Get payslips (Employee sees own; HR/Admin see all)
 * @access  Private
 */
const getPayslips = async (req, res, next) => {
  try {
    const { payslips, total, page, limit } = await payrunService.getPayslips(req.query, req.user);
    return paginatedResponse(res, payslips, page, limit, total, 'Payslips retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payslips/:id
 * @desc    Get single payslip with detailed rule breakdown
 * @access  Private
 */
const getPayslipById = async (req, res, next) => {
  try {
    const payslip = await payrunService.getPayslipById(req.params.id, req.user);
    return successResponse(res, payslip, 'Payslip details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payslips/:id/pdf
 * @desc    Generate and stream high-quality printable vector PDF payslip
 * @access  Private (Employee for own payslip; HR/Admin for all)
 */
const downloadPayslipPdf = async (req, res, next) => {
  try {
    const payslip = await payrunService.getPayslipById(req.params.id, req.user);
    const pdfBuffer = await pdfService.generatePayslipPdf(payslip);

    const filename = `payslip-${payslip.payslipNumber || payslip._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayslips,
  getPayslipById,
  downloadPayslipPdf
};

