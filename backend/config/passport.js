const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists via email
    let user = await User.findByEmail(profile.emails[0].value);

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// Required for sessions
passport.serializeUser((user, done) => {
  done(null, user.user_id);
});
passport.deserializeUser(async (user_id, done) => {
  try {
  const user = await User.findById(user_id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
