const express = require('express');
const accController = require('../controllers/accController');
const router = express.Router();

// /accounts/ prefefix
router.get('/', accController.getAccounts); // Get all accounts
router.get('/partial/:accountId', accController.getPartialAccount); // Get one account by ID, partial data
router.get('/:accountId', accController.getAccount); // Get one account by ID, all data

router.get('/clients/:clientId', accController.getAccountsByClient); // Get accounts by client ID

//  New

module.exports = router;