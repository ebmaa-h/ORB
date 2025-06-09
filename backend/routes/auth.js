const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Login route
router.post('/login', authController.login);

// Google auth
router.get('/auth/google', authController.googleAuth);
router.get('/auth/google/callback', authController.googleCallback);

// User Register route
// router.post('/register', authController.register);

// Logout route
router.post('/logout', authController.logout);

// Verify route
router.get('/verify', authController.verifySession);

// Client Register routes
// router.post('/register/client', authController.clientRegister);

module.exports = router;