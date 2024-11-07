const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Login route
router.post('/login', authController.login);

// Register route
router.post('/register', authController.register);

// Logout route
router.post('/logout', authController.logout);

// Verify route
router.get('/verify', authController.verify);

module.exports = router;