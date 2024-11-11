const mysql = require('mysql2');

// Create a connection pool to manage MySQL connections
const db = mysql.createPool({
  // host: 'localhost',
  host: '127.0.0.1',
  user: 'root',
  password: 'justlogin',
  database: 'orb',
  waitForConnections: true,   // Wait for a connection if the pool is busy
  connectionLimit: 10,        // Max number of simultaneous connections
  queueLimit: 0               // No queue limit
});

// No need for db.connect() because the pool handles connections automatically

// db.connect((err) => {
//   if (err) {
//     console.error('Error connecting to database: ', err);
//   } else {
//     console.log('Connected to mysql database.');
//   }
// });

module.exports = db;
