const express = require('express');
const router = express.Router();
const payslipController = require('../controllers/payslipController');
const { authenticate } = require('../middleware/auth');

// All payslip routes require authentication
router.use(authenticate);

router.get('/', payslipController.getPayslips);
router.get('/:id/pdf', payslipController.downloadPayslipPdf);
router.get('/:id', payslipController.getPayslipById);

module.exports = router;
