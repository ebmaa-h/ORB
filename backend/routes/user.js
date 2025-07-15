const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();
const { accessGuard } = require('../utils/accessGuard.js');
const { clientAccessGuard } = require('../utils/clientAccessGuard.js');

// Get all users
router.get('/', accessGuard('users'), userController.getAllUsers);

// Get single user
router.get('/:id', accessGuard('user-view'), userController.getUserById);

// Add new user
router.post('/', accessGuard('user-add'),  userController.createUser);

// Update user info
router.put('/:id', accessGuard('user-update'),  userController.updateUser);

// Deactivate user (soft delete)
router.delete('/:id', accessGuard('user-delete'),  userController.deactivateUser);

module.exports = router;