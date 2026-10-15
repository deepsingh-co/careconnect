const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', familyController.getMyFamily);
router.post('/invitations', familyController.createInvitation);
router.post('/invitations/accept', familyController.acceptInvitation);
router.patch('/consent', familyController.updateConsent);

module.exports = router;
