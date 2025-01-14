const express = require('express');
const accController = require('../controllers/accController');
const router = express.Router();

// /accounts/ prefefix
router.get('/', accController.getAccounts); // Get all accounts
router.get('/:id', accController.getAccount); // Get one account by ID
router.get('/doctors/:doctorId', accController.getAccountsByDoctor); // Get accounts by doctor ID

module.exports = router;