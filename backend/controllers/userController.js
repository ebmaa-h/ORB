const User = require('../models/userModel.js');

const userController = {
  listUsers: async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    try {
      const users = await User.listUsers(includeInactive);
      res.status(200).json(users);
    } catch (err) {
      console.error('❌ Error in getAllUsers:', err);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  },

  viewUser: async (req, res) => {
    const { id } = req.params;
    try {
      const user = await User.getUser(id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json(user);
    } catch (err) {
      console.error('❌ Error in getUserById:', err);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  },

  createUser: async (req, res) => {
    const userData = req.body;
    try {
      const newUser = await User.createUser(userData);
      res.status(201).json(newUser);
    } catch (err) {
      console.error('❌ Error in createUser:', err);
      res.status(500).json({ message: 'Failed to create user' });
    }
  },

  updateUser: async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const updated = await User.updateUser(id, updates);
      if (!updated) return res.status(404).json({ message: 'User not found or not updated' });
      res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
      console.error('❌ Error in updateUser:', err);
      res.status(500).json({ message: 'Failed to update user' });
    }
  },

  deactivateUser: async (req, res) => {
    const { id } = req.params;
    try {
      const deactivated = await User.deactivate(id); // Sets `active = false`
      if (!deactivated) return res.status(404).json({ message: 'User not found or already inactive' });
      res.status(200).json({ message: 'User deactivated successfully' });
    } catch (err) {
      console.error('❌ Error in deactivateUser:', err);
      res.status(500).json({ message: 'Failed to deactivate user' });
    }
  },

  reactivateUser: async (req, res) => {
    const { id } = req.params;
    try {
      const reactivated = await User.reactivate(id);
      if (!reactivated) return res.status(404).json({ message: 'User not found or already active' });
      res.status(200).json({ message: 'User reactivated successfully' });
    } catch (err) {
      console.error('❌ Error in reactivateUser:', err);
      res.status(500).json({ message: 'Failed to reactivate user' });
    }
  },
};

module.exports = userController;
