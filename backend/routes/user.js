const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

// Get user data route
router.get('/getUserData', userController.getUserData);



module.exports = router;