const express = require('express');
const router = express.Router();
const jobPositionController = require('../controllers/jobPositionController');
const { authenticate, authorize } = require('../middleware/auth');
const { HR_MANAGERS, ADMIN_ONLY } = require('../config/roles');

router.use(authenticate);

router.get('/', jobPositionController.getJobPositions);
router.get('/:id', jobPositionController.getJobPositionById);
router.post('/', authorize(...HR_MANAGERS), jobPositionController.createJobPosition);
router.put('/:id', authorize(...HR_MANAGERS), jobPositionController.updateJobPosition);
router.delete('/:id', authorize(...ADMIN_ONLY), jobPositionController.deleteJobPosition);

module.exports = router;
