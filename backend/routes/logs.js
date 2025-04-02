const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController.js');

// // Consolidated GET route
// router.get('/:targetTable/:targetId', logController.getLogs);

// // Consolidated POST route
// router.post('/:targetTable/:targetId', logController.addLog);

module.exports = router;