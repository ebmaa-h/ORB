const User = require('../models/userModel');

const userController = {

  // Request made from userContext to retrieve user data.
  getUserData: async (req, res) => {
    console.log("Getting user info...");

    // After de-serialize
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json(req.user); // sends user info back to client
    console.log('✅ User data retrieved: ', req.user);
  }
};

module.exports = userController;
