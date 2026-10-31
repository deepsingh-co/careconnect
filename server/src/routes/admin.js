const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/users', adminController.getUsers);
router.patch('/users/:id/toggle', adminController.toggleUserActive);
router.get('/providers/pending', adminController.getPendingProviders);
router.get('/providers', adminController.getAllProviders);
router.patch('/providers/:id/review', adminController.reviewProvider);
router.get('/stats', adminController.getStats);
router.get('/bookings', adminController.getBookings);
router.patch('/bookings/:id/assign', adminController.assignBooking);
router.get('/rides', adminController.getRides);
router.get('/orders', adminController.getOrders);
router.get('/integrations', adminController.getIntegrationStatus);
router.get('/whatsapp/channel', adminController.getWhatsappChannel);
router.post('/whatsapp/channel/restart', adminController.restartWhatsappChannel);
router.post('/whatsapp/channel/send', adminController.sendWhatsappTest);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
