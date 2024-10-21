const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user:'root',
  password:'justlogin',
  database: 'orb',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ', err);
  } else {
    console.log('Connected to mysql database.');
  }
});

module.exports = db;