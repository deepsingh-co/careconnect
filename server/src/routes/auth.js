const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['parent', 'child', 'provider']).withMessage('Invalid role'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  authController.login
);

// Phone + WhatsApp OTP authentication (children)
router.post(
  '/otp/request',
  [body('phone').matches(/^\+?[1-9]\d{6,14}$/).withMessage('Valid phone number required (e.g. +919876543210)')],
  validate,
  authController.requestOtp
);

router.post(
  '/otp/verify',
  [
    body('phone').matches(/^\+?[1-9]\d{6,14}$/).withMessage('Valid phone number required'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('6-digit OTP required'),
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name too long'),
  ],
  validate,
  authController.verifyOtp
);

router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.patch('/profile', authenticate, authController.updateProfile);

module.exports = router;
