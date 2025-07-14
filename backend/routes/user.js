const express = require('express');
const userController = require('../../frontend/src/trash/userController');
const router = express.Router();

// Get user data route
router.get('/data', userController.getUserData);

module.exports = router;