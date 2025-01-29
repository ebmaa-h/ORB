// const mysql = require('mysql2');  old
const mysql = require('mysql2/promise'); //new

// Create a connection pool to manage MySQL connections
const db = mysql.createPool({
  host: '127.0.0.1',  // Use IPv4 explicitly
  // host: 'localhost',
  user: 'root',
  password: 'justlogin',
  database: 'orb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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
