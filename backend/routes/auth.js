const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Login route
router.post('/login', authController.login);

// Register routes
router.post('/register-user', authController.registerUser);
router.post('/register-doctor', authController.registerDoctor);

// Logout route
router.post('/logout', authController.logout);

// Verify route
router.get('/verify', authController.verify);

module.exports = router;