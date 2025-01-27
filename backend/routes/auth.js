const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Login route
router.post('/login', authController.login);

// User Register route
router.post('/register', authController.register);

// Logout route
router.post('/logout', authController.logout);

// Verify route
router.get('/verify', authController.verify);

// Client Register routes
router.post('/register/client', authController.clientRegister);

module.exports = router;