const express = require('express');
const authController = require('../controllers/accController');
const router = express.Router();

// Get accounts
router.get('/get', authController.getAccounts);

module.exports = router;