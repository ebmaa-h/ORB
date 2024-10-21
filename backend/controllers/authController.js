// const User = require('../models/userModel');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

const authController = {
  login: (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
      return res.status(200).json({ message: 'Login successfu', email });
    }
    return res.status(400).json({ message: 'Email and password required' });

  // login: (req, res) => {
  //   const { email, password } = req.body; 

  //   User.findByEmail(email, (user) => {
  //     if (!user) return res.status(404).json({ message: 'User not found' });

  //     // Compare passwords
  //     const validPassword = bcrypt.compareSync(password, user.password);
  //     if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

  //     // Create JWT token
  //     const token = jwt.sign({ id: user.id, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });
  //     res.json({ token });
  //   });
  // },

  // register: (req, res) => {
  //   const { email, password } = req.body;

  //   // Hash password
  //   const hashedPassword = bcrypt.hashSync(password, 10);

  //   User.create(email, hashedPassword, (result) => {
  //     res.status(201).json({ message: 'User registered', userId: result.insertId });
  //   });
  }
};

module.exports = authController;