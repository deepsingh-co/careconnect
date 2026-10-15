const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/alerts', emergencyController.createAlert);
router.get('/alerts', emergencyController.getAlerts);
router.patch('/alerts/:id/acknowledge', emergencyController.acknowledgeAlert);

module.exports = router;
