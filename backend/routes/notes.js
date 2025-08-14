const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController.js');

// Get all table specified notes
router.get('/:targetTable/:targetId', noteController.listLogs);

// Create new note
router.post('/:targetTable/:targetId', noteController.createNote);

module.exports = router;