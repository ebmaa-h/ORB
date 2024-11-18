const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

// Login route
router.get('/getUserData', userController.getUserData);


module.exports = router;