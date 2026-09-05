const express = require('express');
const router = express.Router();
const jobPositionController = require('../controllers/jobPositionController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', jobPositionController.getJobPositions);
router.get('/:id', jobPositionController.getJobPositionById);
router.post('/', authorize('Admin', 'HR'), jobPositionController.createJobPosition);

module.exports = router;
