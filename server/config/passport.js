const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Auth = require('../models/authModel');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // User authenticated on google's side
    // Check if user is on our db -> registered
    // user_id only -> authenticated user
    let authUser = await Auth.findByEmail(profile.emails[0].value);
    
    // Trigger google callback failure if user is not registered.
    if (!authUser) {
      return done(null, false);
    }
    console.log('✅ 🔒0/3 passport: user_id retrieved.', authUser.user_id);
    return done(null, authUser);
  } catch (err) {
    return done(err, null);
  }
}));

// Save user_id in session
passport.serializeUser((user, done) => {
  console.log('✅ 🔒1/3 serializeUser: saving session for ID', user.user_id);
  done(null, user.user_id);
});

// Validate session & retrieve user data, save user data in req
passport.deserializeUser(async (user_id, done) => {
  try {
    const authUser = await Auth.findById(user_id);
    console.log('✅ 🔒2/3 deserializeUser: user fetched from DB for ID', user_id);
    done(null, authUser);
  } catch (err) {
    console.log('❌ 🔒2/3 deserializeUser failed');
    done(err, null);
  }
});
