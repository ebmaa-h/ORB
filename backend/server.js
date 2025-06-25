require('dotenv').config();
require('./config/passport');

// Require necessary modules
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.js');
const userRoutes = require('./routes/user.js');
const accRoutes = require('./routes/accounts.js');
const profRoutes = require('./routes/profiles.js');
const invRoutes = require('./routes/invoices.js');
const recordRoutes = require('./routes/records.js');
const noteRoutes = require('./routes/notes.js');
const logRoutes = require('./routes/logs.js');
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
app.use(passport.session());

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

// Routes
app.use('/auth', authRoutes);
// app.use('/users', userRoutes);
app.use('/accounts', accRoutes);
app.use('/profiles', profRoutes);
app.use('/invoices', invRoutes);
app.use('/records', recordRoutes);
app.use('/notes', noteRoutes);
app.use('/logs', logRoutes);

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
