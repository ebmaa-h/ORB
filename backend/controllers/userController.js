const User = require('../models/userModel.js');

const userController = {
  // GET /users
  getAllUsers: async (req, res) => {
    try {
      const users = await User.getAll();
      res.status(200).json(users);
    } catch (err) {
      console.error('❌ Error in getAllUsers:', err);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  },

  // GET /users/:id
  getUserById: async (req, res) => {
    const { id } = req.params;
    try {
      const user = await User.getById(id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json(user);
    } catch (err) {
      console.error('❌ Error in getUserById:', err);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  },

  // POST /users
  createUser: async (req, res) => {
    const userData = req.body;
    try {
      const newUser = await User.create(userData);
      res.status(201).json(newUser);
    } catch (err) {
      console.error('❌ Error in createUser:', err);
      res.status(500).json({ message: 'Failed to create user' });
    }
  },

  // PUT /users/:id
  updateUser: async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const updated = await User.update(id, updates);
      if (!updated) return res.status(404).json({ message: 'User not found or not updated' });
      res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
      console.error('❌ Error in updateUser:', err);
      res.status(500).json({ message: 'Failed to update user' });
    }
  },

  // DELETE /users/:id
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
  }
};

module.exports = userController;
