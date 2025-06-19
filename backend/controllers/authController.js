const User = require('../models/userModel');
const passport = require('passport');

const authController = {

googleAuth: (req, res, next) => {
  console.log('🔑 Starting Google OAuth...');
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
},

googleCallback: (req, res, next) => {
  console.log('🔁 Returned from Google, processing callback...');
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}`,
    successRedirect: `${process.env.CLIENT_URL}/dashboard`,
    session: true,
  })(req, res, next);
},


  // login: async (req, res) => {
  //   try {
  //     console.log("Logging in...");
  //     const { email } = req.body;
  //     const user = await User.loginUser(email); // Await loginUser
  
  //     if (!user) {
  //       console.log(`Login failed. No user found for email: ${email}`);
  //       return res.status(404).json({ message: 'User not found' });
  //     }
  //     // Set HttpOnly cookie
  //     res.cookie('authToken', token, { httpOnly: true, sameSite: 'Strict', expires: new Date(Date.now() + 3600000) });
  
  //     res.status(200).json({ message: 'Login successful', user: userWithoutPassword });
  //   } catch (err) {
  //     console.error("Login error:", err);
  //     res.status(500).json({ message: 'Internal server error' });
  //   }
  // },
  

  // register: async (req, res) => {
  //   console.log("Registering User...");
  //   const { email, first, last, address, tell_nr } = req.body;
  
  //   try {
  //     const userDetails = { email, first, last, tell_nr, address };
  
  //     const result = await User.createUser(userDetails); // Await user creation
  //     console.log("User created successfully with ID:", result.userId);
  
  //     res.status(201).json({ message: "User Registered", userId: result.userId });
  //   } catch (err) {
  //     console.error("Database Error:", err);
  //     res.status(400).json({ message: err.message || "Error creating user", details: err.details || {} });
  //   }
  // },
  
  logout: (req, res) => {
    req.logout(() => {
      req.session.destroy(err => {
        if (err) {
          return res.status(500).json({ message: 'Logout failed' });
        }

        res.clearCookie('connect.sid'); // clear cookie on client
        res.status(200).json({ message: 'Logged out successfully' });
      });
    });
  },
  
  verifySession: (req, res) => {
    if (req.isAuthenticated()) {
      res.status(200).json({ user: req.user });
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  },


};

module.exports = authController;