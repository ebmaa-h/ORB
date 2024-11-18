const db = require('../config/db');

const User = {

  // Find user by email
  findByEmail: (email, callback) => {
    let query = `SELECT * FROM users WHERE email = ?`;
    db.query(query, [email], (err, results) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, results[0]);
      }
    });
  },

  // Create new user
  createUser: (email, password, first_name, last_name, callback) => {
    let query = `INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)`;
    db.query(query, [email, password, first_name, last_name], (err, result) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, result);
      }
    });
  }

  
}

module.exports = User;
