const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', approvalController.list);
router.get('/:id', approvalController.getOne);
router.post('/:id/respond', approvalController.respond);

module.exports = router;
