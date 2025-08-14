const express = require('express');
const recordController = require('../controllers/recordController.js');
const router = express.Router();
const { accessGuard } = require('../utils/accessGuard.js');

// Get all records
router.get('/', accessGuard('records'), recordController.listRecords);

// Get single record
router.get('/:id', accessGuard('records'), recordController.viewRecord);

module.exports = router;