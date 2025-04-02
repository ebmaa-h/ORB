const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController.js');

// Consolidated GET route
router.get('/:targetTable/:targetId', noteController.getNotes);

// Consolidated POST route
router.post('/:targetTable/:targetId', noteController.addNote);

module.exports = router;