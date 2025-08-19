require('dotenv').config();
require('./config/passport');

// Require necessary modules
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.js');
const clientRoutes = require('./routes/client.js');
const profRoutes = require('./routes/profiles.js');
const recordRoutes = require('./routes/records.js');
const noteRoutes = require('./routes/notes.js');
const logRoutes = require('./routes/logs.js');
const userRoutes = require('./routes/user.js')
const batchRoutes = require('./routes/batches.js')

const session = require('express-session');
const passport = require('passport');

// Express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 30600000, // 8.5 hours
  },
}));

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());  // Triggers deserializeUser automatically

app.use(cors({
  origin: ['http://localhost:5173', 'http://167.99.196.172', 'http://orb.ebmaa.co.za'], // Local dev and production
  methods: ['GET', 'POST', 'OPTIONS', 'PATCH', 'PUT'],
  credentials: true,
}));

// Middleware to parse JSON
app.use(express.json());

// Output all requests (logging middleware)
app.use((req, res, next) => {
  console.log(`A ${req.method} request has been made from ${req.path}`);
  next();
});

// // Debug
// app.use((req, res, next) => {
//   console.log('🧠 Session data:', req.session);
//   console.log('👤 req.user:', req.user);
//   next();
// });


// Check if session is valid and user is deserialized ? i think
// 
app.use((req, res, next) => {
  const safePaths = [
    '/auth/google',
    '/auth/google/callback',
    '/auth/me',
    '/auth/logout'
  ];

  const isSafe = safePaths.some(path => req.path.startsWith(path));

  if (!req.user && !isSafe) {
    console.warn('⚠️ No user found in session. Session likely invalid or expired.');
    return res.status(401).json({
      message: 'Session expired or invalid',
      code: 'SESSION_INVALID'
    });
  }
  next();
});



// Routes
app.use('/auth', authRoutes);
app.use('/clients', clientRoutes);
app.use('/profiles', profRoutes);
app.use('/records', recordRoutes);
app.use('/notes', noteRoutes);
app.use('/logs', logRoutes);
app.use('/users', userRoutes);

app.use('/batches', batchRoutes);

// app.use('/users', userRoutes);
// app.use('/accounts', accRoutes);
// app.use('/invoices', invRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An internal error occurred." });
});

// Listen for requests
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}...`);
});
