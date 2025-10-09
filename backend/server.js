require('dotenv').config();
require('./config/passport');

const express = require('express');
const http = require('http');              // 🔑 needed for sockets
const { Server } = require('socket.io');   // 🔑 socket.io server
const cors = require('cors');
const authRoutes = require('./routes/auth.js');
// const noteRoutes = require('./routes/notes.js');
// const logRoutes = require('./routes/logs.js');
const batchRoutes = require('./routes/batch.js');

const registerSockets = require("./sockets/index");

const session = require('express-session');
const passport = require('passport');

// Express app
const app = express();
const server = http.createServer(app); // 👈 wrap express
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://167.99.196.172', 'http://orb.ebmaa.co.za'],
    methods: ['GET', 'POST', 'OPTIONS', 'PATCH', 'PUT'],
    credentials: true,
  },
});

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
  origin: ['http://localhost:5173', 'http://167.99.196.172', 'http://orb.ebmaa.co.za'],
  methods: ['GET', 'POST', 'OPTIONS', 'PATCH', 'PUT'],
  credentials: true,
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`A ${req.method} request has been made from ${req.path}`);
  next();
});

// Session / user check
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
// app.use('/notes', noteRoutes);
// app.use('/logs', logRoutes);
app.use('/batches', batchRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An internal error occurred." });
});

// --- socket.io ---
registerSockets(io);

// Listen for requests
const PORT = process.env.PORT;
server.listen(PORT, () => {  // 👈 use server, not app
  console.log(`🚀 Server is listening on port ${PORT}...`);
});
