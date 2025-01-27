const db = require('../config/db');

const User = {

  // Login
  loginUser: (email, callback) => {
    let query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
      if (err) {
        return callback(err, null);
      }

      const user = results[0];
      if (!user) {
        return callback(null, null); // No user found
      }

      // Fetch user features
      const fetchFeatures = (callback) => {
        let featuresQuery = `
          SELECT f.feature_name, uf.is_active, uf.permissions
          FROM user_feature_access uf
          JOIN features f ON uf.feature_id = f.feature_id
          WHERE uf.user_id = ?`;
        db.query(featuresQuery, [user.user_id], (err, features) => {
          if (err) return callback(err);
          user.features = features; // Attach features array to user
          callback(null);
        });
      };

      // Fetch user client access
      const fetchClientAccess = (callback) => {
        let clientAccessQuery = `
          SELECT d.client_id, CONCAT('Dr ', d.first, ' ', d.last) AS client_name, d.practice_nr, uda.permissions
          FROM user_client_access uda
          JOIN clients d ON uda.client_id = d.client_id
          WHERE uda.user_id = ?`;
        db.query(clientAccessQuery, [user.user_id], (err, clientAccess) => {
          if (err) return callback(err);
          user.client_access = clientAccess; // Attach client access array to user
          callback(null);
        });
      };

      // Execute features and client access retrieval
      fetchFeatures((err) => {
        if (err) return callback(err, null);

        fetchClientAccess((err) => {
          if (err) return callback(err, null);

          callback(null, user); // Final enriched user object
        });
      });
    });
  },

  // Create new user
  createUser: (userDetails, callback) => {
    const { email, password, first, last, address, tell_nr } = userDetails;

    // Insert user into the users table
    let query = `INSERT INTO users (email, password, first, last, address, tell_nr) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(query, [email, password, first, last, address, tell_nr], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return callback({ message: 'Email already exists' }, null); 
        }
        return callback({ message: 'Database error', details: err }, null);
      }

      const userId = result.insertId;
      callback(null, { userId });
    });
  },

  // Create new client
  createClient: (clientDetails, callback) => {
    const { email, password, first, last, registration_nr, practice_nr, client_type, tell_nr } = clientDetails;

    // Insert client into the clients table
    let query = `INSERT INTO clients ( email, password, first, last, registration_nr, practice_nr, client_type, tell_nr) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [ email, password, first, last, registration_nr, practice_nr, client_type, tell_nr], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return callback({ message: 'Email already exists' }, null); 
        }
        return callback({ message: 'Database error', details: err }, null);
      }

      const clientId = result.insertId;
      callback(null, { clientId });
    });
  },

}

module.exports = User;
