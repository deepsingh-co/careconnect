const express = require('express');
const router = express.Router();
const wellnessController = require('../controllers/wellnessController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', wellnessController.createCheckin);
router.get('/', wellnessController.getCheckins);

module.exports = router;
