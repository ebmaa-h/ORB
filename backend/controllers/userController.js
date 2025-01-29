const { verifyToken } = require('../utils/jwt');
const User = require('../models/userModel');

const userController = {
  getUserData: async (req, res) => {
    console.log("Getting user info...");

    const token = req.cookies['authToken'];

    // Check if a JWT token is provided
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      // Validate JWT token (await the promise)
      const decoded = await verifyToken(token);

      // Extract the email from the decoded token
      const { email } = decoded;

      // Find the user by email / Log user in
      const user = await User.loginUser(email);  // Assuming loginUser is now a promise-based function

      if (!user) {
        console.log(`User data retrieval failed. User with email ${email} not found.`);
        return res.status(404).json({ message: 'User not found' });
      }

      // Exclude the password from the response
      const { password, ...userWithoutPassword } = user;

      console.log("User data retrieved...", userWithoutPassword);
      // Send the response after successfully retrieving user data
      return res.status(200).json({
        message: 'User Info Retrieved.',
        user: userWithoutPassword,
      });

    } catch (err) {
      console.error('Error occurred:', err);
      // Handle the error and send appropriate response
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ message: 'Invalid token' });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};

module.exports = userController;
