const { verifyToken } = require('../utils/jwt');
const User = require('../models/userModel');

const userController = {
  getUserData: (req, res) => {
    console.log("Getting user info...");

    // Extract the token from cookies (assuming you're storing the token in an HttpOnly cookie)
    const token = req.cookies['authToken'];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Use the verifyToken function to validate and decode the token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Extract the email from the decoded token
    const { email } = decoded;

    // Find the user by email (now that we have it from the token)
    User.findByEmail(email, (err, user) => {
      if (err) {
        console.error('Error finding user:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      if (!user) {
        console.log(`User data retrieval failed. User with email ${email} not found.`);
        return res.status(404).json({ message: 'User not found' });
      }

      // Exclude the password from the response
      const { password, ...userWithoutPassword } = user;

      // Send the response after successfully retrieving user data
      res.status(200).json({
        message: 'User Info Retrieved.',
        user: userWithoutPassword,
      });
    });
  },
};

module.exports = userController;
