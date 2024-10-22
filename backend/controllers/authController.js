const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const authController = {
  login: (req, res) => {
    const { email, password } = req.body;
  
    User.findByEmail(email, (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Internal server error' });
      }
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Compare passwords
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ message: 'Internal server error' });
        }
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
  
        // APPLY JWT
  
        // Remove password from user object
        const { password, ...userWithoutPassword } = user;
  
        res.status(200).json({ user: userWithoutPassword });
      });
    });
  },

  register: (req, res) => {
    const { email, password, first_name, last_name } = req.body;
  
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: 'Error hashing password' });
      }
  
      User.createUser(email, hashedPassword, first_name, last_name, (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error creating user' });
        }
        res.status(201).json({ message: 'User registered', userId: result.insertId });
      });
    });
  }
};

module.exports = authController;