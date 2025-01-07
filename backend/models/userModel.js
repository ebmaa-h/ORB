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

      // Fetch user doctor access
      const fetchDoctorAccess = (callback) => {
        let doctorAccessQuery = `
          SELECT d.doctor_id, CONCAT('Dr ', d.first, ' ', d.last) AS doctor_name, d.practice_nr, uda.permissions
          FROM user_doctor_access uda
          JOIN doctors d ON uda.doctor_id = d.doctor_id
          WHERE uda.user_id = ?`;
        db.query(doctorAccessQuery, [user.user_id], (err, doctorAccess) => {
          if (err) return callback(err);
          user.doctor_access = doctorAccess; // Attach doctor access array to user
          callback(null);
        });
      };

      // Execute features and doctor access retrieval
      fetchFeatures((err) => {
        if (err) return callback(err, null);

        fetchDoctorAccess((err) => {
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

  // Create new doctor
  createDoctor: (doctorDetails, callback) => {
    const { email, password, first, last, registration_nr, practice_nr, doctor_type, tell_nr } = doctorDetails;

    // Insert doctor into the doctors table
    let query = `INSERT INTO doctors ( email, password, first, last, registration_nr, practice_nr, doctor_type, tell_nr) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [ email, password, first, last, registration_nr, practice_nr, doctor_type, tell_nr], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return callback({ message: 'Email already exists' }, null); 
        }
        return callback({ message: 'Database error', details: err }, null);
      }

      const doctorId = result.insertId;
      callback(null, { doctorId });
    });
  },

}

module.exports = User;
