const express = require('express');
const noteController = require('../controllers/noteController.js');
const router = express.Router();

// Consolidated GET route
router.get('/:targetTable/:targetId', noteController.getNotes);

// Consolidated POST route
router.post('/:targetTable/:targetId', noteController.addNote);

module.exports = router;