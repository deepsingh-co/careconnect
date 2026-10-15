const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Meta webhook verification
router.get('/whatsapp', webhookController.verify);

// Incoming messages (raw body needed for signature verification)
router.post('/whatsapp', express.raw({ type: 'application/json' }), (req, res, next) => {
  // Attach rawBody for signature verification, then parse
  if (req.body instanceof Buffer) {
    req.rawBody = req.body.toString('utf8');
    try {
      req.body = JSON.parse(req.rawBody);
    } catch {
      req.body = {};
    }
  }
  next();
}, webhookController.receive);

module.exports = router;
