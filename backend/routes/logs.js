const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController.js');

// Get all table specified logs
router.get('/:targetTable/:targetId', logController.listLogs);

// Create new log
router.post('/', logController.createLog);

module.exports = router;