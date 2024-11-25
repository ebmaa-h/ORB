const express = require('express');
const accController = require('../controllers/accController');
const router = express.Router();

router.get('/', accController.getAccounts); // Get all accounts
router.get('/:id', accController.getAccount); // Get one account by ID



module.exports = router;