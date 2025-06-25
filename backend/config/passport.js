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

    console.log('✅ User found for passport: ', user);

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// Save user_id in session
passport.serializeUser((user, done) => {
  console.log('✅ serializeUser:', user.user_id);
  done(null, user.user_id);
});

// Validate session & retrieve user data
passport.deserializeUser(async (user_id, done) => {
  console.log('✅ deserializeUser for id:', user_id);
  try {
  const user = await User.findById(user_id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
