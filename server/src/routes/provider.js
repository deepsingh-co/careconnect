const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('provider', 'admin'));

router.get('/profile', providerController.getMyProfile);
router.patch('/profile', providerController.updateMyProfile);
router.get('/jobs', providerController.getMyJobs);
router.post('/jobs/:id/accept', providerController.acceptJob);
router.post('/jobs/:id/reject', providerController.rejectJob);
router.patch('/jobs/:id/status', providerController.updateJobStatus);

module.exports = router;
