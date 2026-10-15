const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', reminderController.getReminders);
router.post('/', reminderController.createReminder);
router.patch('/:id', reminderController.updateReminder);
router.post('/events/:eventId/acknowledge', reminderController.acknowledgeReminder);
router.get('/history', reminderController.getReminderHistory);

module.exports = router;
