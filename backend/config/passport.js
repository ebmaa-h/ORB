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
    // User authenticated on google's side
    // Check if user is on our db -> registered
    let user = await User.findByEmail(profile.emails[0].value);
    
    // Trigger google callback failure if user is not registered.
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
  console.log('✅ 🔒1/3 serializeUser: saving session for ID', user.user_id);
  done(null, user.user_id);
});

// Validate session & retrieve user data
passport.deserializeUser(async (user_id, done) => {
  try {
    const user = await User.findById(user_id);
    console.log('✅ 🔒2/3 deserializeUser: user fetched from DB for ID', user_id);
    done(null, user);
  } catch (err) {
    console.log('❌ 🔒2/3 deserializeUser failed');
    done(err, null);
  }
});
