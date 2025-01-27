const express = require('express');
const accController = require('../controllers/accController');
const router = express.Router();

// /accounts/ prefefix
router.get('/', accController.getAccounts); // Get all accounts
router.get('/:id', accController.getAccount); // Get one account by ID
router.get('/clients/:clientId', accController.getAccountsByClient); // Get accounts by client ID

module.exports = router;