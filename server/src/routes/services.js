const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Service categories
router.get('/categories', serviceController.getServiceCategories);

// Providers
router.get('/providers', serviceController.getProviders);

// Service bookings
router.post('/bookings', serviceController.createBooking);
router.get('/bookings', serviceController.getBookings);
router.get('/bookings/:id', serviceController.getBookingById);
router.patch('/bookings/:id/status', serviceController.updateBookingStatus);
router.post('/bookings/:id/cancel', serviceController.cancelBooking);

// Rides
router.get('/rides/quotes', serviceController.getRideQuotes);
router.post('/rides', serviceController.createRide);
router.get('/rides', serviceController.getRides);
router.patch('/rides/:id/cancel', serviceController.cancelRide);

// Food
router.get('/menu', serviceController.getMenu);
router.post('/orders', serviceController.createOrder);
router.get('/orders', serviceController.getOrders);
router.patch('/orders/:id/cancel', serviceController.cancelOrder);

module.exports = router;
