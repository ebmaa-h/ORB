const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();
const { accessGuard } = require('../utils/accessGuard.js');

// Get all users
router.get('/', accessGuard('users'), userController.listUsers);

// Get single user
router.get('/:id', accessGuard('user-view'), userController.viewUser);

// Create new user
router.post('/', accessGuard('user-create'),  userController.createUser);

// Update user info
router.put('/:id', accessGuard('user-update'),  userController.updateUser);

// Deactivate user (soft delete)
router.delete('/:id', accessGuard('user-delete'),  userController.deactivateUser);

// Reactivate user (soft undelete)
router.patch('/:id/reactivate', accessGuard('user-reactivate'), userController.reactivateUser);

module.exports = router;