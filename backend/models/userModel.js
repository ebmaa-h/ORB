const db = require('../config/db');

const User = {

  // Find user by email
  findByEmail: (email, callback) => {
    let query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
      if (err) {
        return callback(err, null);
      }

      const user = results[0];
      if (!user) {
        return callback(null, null); // No user found
      }

      // Role-based enrichment
      const fetchDetails = (callback) => {
        if (user.role === 'user') {
          let userDetailsQuery = 'SELECT * FROM user_details WHERE user_id = ?';
          db.query(userDetailsQuery, [user.user_id], (err, userDetails) => {
            if (err) return callback(err);
              user.details = userDetails[0] || {};
              callback(null);
            });
        } else if (user.role === 'doctor') {
          let doctorDetailsQuery = 'SELECT * FROM doctor_details WHERE user_id = ?';
          db.query(doctorDetailsQuery, [user.user_id], (err, doctorDetails) => {
            if (err) return callback(err);
            user.details = doctorDetails[0] || {};
            callback(null);
          });
          } else {
            callback(null); 
          }
      };

      // Fetch user features
      const fetchFeatures = (callback) => {
        let featuresQuery = `
          SELECT f.feature_name, uf.is_active, uf.permissions
          FROM user_features uf
          JOIN features f ON uf.feature_id = f.feature_id
          WHERE uf.user_id = ?`;
        db.query(featuresQuery, [user.user_id], (err, features) => {
          if (err) return callback(err);
          user.features = features; // Attach features array to user
          callback(null);
        });
      };

      // Execute enrichment and features retrieval
      fetchDetails((err) => {
        if (err) return callback(err, null);

        fetchFeatures((err) => {
          if (err) return callback(err, null);
          callback(null, user); // Final enriched user object
        });
      });
    });
  },

  // Create new user
  createUser: (userDetails, callback) => {
    const { email, password, first, last, role, address, tell_nr, doctorDetails } = userDetails;

    let query = `INSERT INTO users (email, password, first, last, role) VALUES (?, ?, ?, ?, ?)`;
    db.query(query, [email, password, first, last, role], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return callback({ message: 'Email already exists' }, null); 
        }
        return callback({ message: 'Database error', details: err }, null);
      }

      const userId = result.insertId;

      if (role === 'doctor' && doctorDetails) {
        // If the user is a doctor, insert only into doctor_details
        const { registration_nr, practice_nr, doctor_type } = doctorDetails;
        const doctorDetailsQuery = `INSERT INTO doctor_details (user_id, registration_nr, practice_nr, tell_nr, doctor_type) VALUES (?, ?, ?, ?, ?)`;

        db.query(doctorDetailsQuery, [userId, registration_nr, practice_nr, tell_nr, doctor_type], (err) => {
          if (err) return callback({ message: 'Error adding doctor details', details: err }, null);
          callback(null, { userId });
        });
      } else {
        // For non-doctor roles, insert into user_details
        const userDetailsQuery = `INSERT INTO user_details (user_id, address, tell_nr) VALUES (?, ?, ?)`;

        db.query(userDetailsQuery, [userId, address, tell_nr], (err) => {
          if (err) return callback({ message: 'Error adding user details', details: err }, null);
          callback(null, { userId });
        });
      }
    });
  },

}

module.exports = User;
