const express = require('express');
const recordController = require('../controllers/recordController.js');
const router = express.Router();
const { accessGuard } = require('../utils/accessGuard.js');

router.get('/', accessGuard('records'), recordController.getRecords); // Get all persons
router.get('/:id', accessGuard('records'), recordController.getRecord); // Get a person by id

module.exports = router;