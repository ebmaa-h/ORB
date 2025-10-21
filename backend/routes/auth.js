const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// google auth -> google login -> serialize session
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// auth user / get data -> deserialize session -> get data
router.get('/me', authController.getMe);

// logout route
router.post('/logout', authController.logout);

module.exports = router;