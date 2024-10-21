require('dotenv').config();

// Require
const express = require('express');

// Retrieve port via .env file or set a default
const PORT = process.env.PORT;

// Routes
const authRoutes = require('./routes/auth');

// Express app
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Output all requests
app.use((req, res, next) => {
  console.log(req.path, req.method, 'all-requests-output');
  next();
});

// Handle auth related routes
app.use('/', authRoutes);

// Listen for requests
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
