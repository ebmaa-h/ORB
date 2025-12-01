// Ensure we load environment variables from the server directory
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('./config/passport.js');

const express = require('express');
const http = require('http'); // for sockets
const cors = require('cors');
const authRoutes = require('./routes/auth.js');
const batchRoutes = require('./routes/batch.js');
const accountRoutes = require('./routes/accounts.js');
const workflowMetaRoutes = require('./routes/workflowMeta.js');

const registerSockets = require("./sockets/index");

const session = require('express-session');
const passport = require('passport');

// express app
const app = express();
const { init } = require("./sockets/socket.js");

const server = http.createServer(app); 
const io = init(server); 
registerSockets(io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// trust first proxy if behind a proxy (for production Nginx)
app.set('trust proxy', 1);


// SERVER SESSION WITH SECURE COOKIES 
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 30600000,
    // secure: !!process.env.USE_HTTPS,   // ENABLE FOR PRODUCTION//SERVER
    sameSite: 'lax'
  },
}));

// initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());  // triggers deserializeUser automatically

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://167.99.196.172',
    'http://orb.ebmaa.co.za',
    'https://orb.ebmaa.co.za'   // if using TLS
  ],
  methods: ['GET', 'POST', 'OPTIONS', 'PATCH', 'PUT'],
  credentials: true,
}));

// logging middleware
app.use((req, res, next) => {
  console.log(`A ${req.method} request has been made from ${req.path}`);
  next();
});

// session / user check
app.use((req, res, next) => {
  const safePaths = [
    '/api/auth/google',
    '/api/auth/google/callback',
    '/api/auth/me',
    '/api/auth/logout'
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

// routes
app.use('/api/auth', authRoutes);
// app.use('/notes', noteRoutes);
// app.use('/logs', logRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/workflow', workflowMetaRoutes);
app.use('/api/accounts', accountRoutes);

// error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An internal error occurred." });
});

// socket.io 
registerSockets(io);

// listen for requests
const PORT = process.env.PORT;
server.listen(PORT, () => {  // 👈 use server, not app
  console.log(`🚀 Server is listening on port ${PORT}...`);
});
