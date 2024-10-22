require('dotenv').config();

// Require
const express = require('express');
const cors = require('cors');


// Routes
const authRoutes = require('./routes/auth');

// Express app
const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  methods: ['GET', 'POST', 'OPTIONS'], // Allowed methods
  credentials: true, // Allow credentials if needed
}));

// Handle preflight request for /login route
app.options('/login', cors()); // This handles preflight requests for the /login route

// Retrieve port via .env file or set a default
const PORT = process.env.PORT;

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
