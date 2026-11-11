/**
 * Public delivery-partner handoff endpoints.
 *
 * The handoff token is the credential (32 random bytes, stored only as a
 * SHA-256 hash), so these routes are intentionally unauthenticated. They are
 * rate-limited and the OTP itself is locked after repeated wrong guesses.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const deliveryController = require('../controllers/deliveryController');

const router = express.Router();

const limiter = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    // The API test suite performs several verification scenarios from one IP.
    skip: () => config.env === 'test',
  });

router.get('/handoff/:token', limiter(120), deliveryController.getHandoff);
router.post('/handoff/:token/verify', limiter(30), deliveryController.verifyOtp);

module.exports = router;
