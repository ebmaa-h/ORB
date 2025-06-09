const User = require('../models/userModel');

const userController = {
  getUserData: async (req, res) => {
    console.log("Getting user info...");
    const token = req.cookies['authToken'];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = await verifyToken(token);
      const { email } = decoded;

      if (!email) {
        return res.status(401).json({ message: 'Invalid token payload' });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        console.log(`User not found: ${email}`);
        return res.status(404).json({ message: 'User not found' });
      }

    } catch (err) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  },
};

module.exports = userController;
