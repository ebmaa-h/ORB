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
      successRedirect: `${process.env.CLIENT_URL}/workflow`,
      session: true,
    })(req, res, next);
  },

  getMe: async (req, res) => {
    // after de-serialize
    if (!req.user) {
      console.log('❌ 🔒3/3 route hit: /auth/me — req.user NOT present');
      return res.status(401).json({ message: 'Not authenticated' });
    }
    console.log('✅ 🔒3/3 route hit: /auth/me — req.user present');

    res.json(req.user);
  },

  logout: (req, res) => {
    req.logout(() => {
      req.session.destroy(err => {
        if (err) {
          return res.status(500).json({ message: 'Logout failed' });
        }

        console.log('✅ 🔒 User logged out');
        res.clearCookie('connect.sid'); // clear cookie on client
        res.status(200).json({ message: 'Logged out successfully' });
      });
    });
  },


};

module.exports = authController;