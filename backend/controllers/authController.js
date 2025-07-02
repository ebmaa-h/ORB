// const User = require('../models/userModel');
const passport = require('passport');

const authController = {

  googleAuth: (req, res, next) => {
    console.log('🔑 Starting Google OAuth...');
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  },

  googleCallback: (req, res, next) => {
    console.log('🔁 Returned from Google, processing callback...');
    passport.authenticate('google', {
      failureRedirect: `${process.env.CLIENT_URL}/not-found?reason=unauthorized`,
      successRedirect: `${process.env.CLIENT_URL}/dashboard`,
      session: true,
    })(req, res, next);
  },

  getMe: async (req, res) => {
    console.log('✅ Retrieving user data');
    // After de-serialize
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json(req.user);
    console.log('✅ User data retrieved:   req.user', req.user);
  },

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


};

module.exports = authController;