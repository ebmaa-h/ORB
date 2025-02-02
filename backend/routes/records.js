const express = require('express');
const recordController = require('../controllers/recordController.js');
const router = express.Router();

router.get('/', recordController.getRecords); // Get all persons
router.get('/:id', recordController.getRecord); // Get a person by id

module.exports = router;