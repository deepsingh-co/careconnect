const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { authenticate, authorize } = require('../middleware/auth');

// WhatsApp web simulator (demo) — parents only
router.post('/whatsapp', authenticate, authorize('parent'), webhookController.simulate);

module.exports = router;
