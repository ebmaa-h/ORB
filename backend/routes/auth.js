const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Google auth
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Auth user / get data
router.get('/me', authController.getMe);

// Logout route
router.post('/logout', authController.logout);

module.exports = router;