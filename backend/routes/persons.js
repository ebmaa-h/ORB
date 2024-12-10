const express = require('express');
const personController = require('../controllers/personController.js');
const router = express.Router();

router.get('/', personController.getPersons); // Get all persons
router.get('/:personId', personController.getPerson); // Get a person by id

module.exports = router;