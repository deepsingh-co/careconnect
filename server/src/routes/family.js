const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', familyController.getMyFamily);
router.post('/invitations', familyController.createInvitation);
router.post('/invitations/accept', familyController.acceptInvitation);
router.post('/otp/request', familyController.requestParentOtp);
router.post('/otp/verify', familyController.verifyParentOtp);
router.patch('/consent', familyController.updateConsent);

module.exports = router;
