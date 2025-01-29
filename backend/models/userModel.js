const db = require('../config/db');

const User = {

  loginUser: async (email) => {
    try {
      // Fetch user by email
      const query = 'SELECT * FROM users WHERE email = ?';
      const [results] = await db.query(query, [email]);
  
      // If no user is found, return null
      const user = results[0];
      if (!user) {
        console.log(`User with email ${email} not found.`);
        return null; 
      }
  
      // Fetch user features
      const featuresQuery = `
        SELECT f.feature_name, uf.is_active, uf.permissions
        FROM user_feature_access uf
        JOIN features f ON uf.feature_id = f.feature_id
        WHERE uf.user_id = ?`;
      const [features] = await db.query(featuresQuery, [user.user_id]);
      user.features = features;
  
      // Fetch user client access
      const clientAccessQuery = `
        SELECT d.client_id, CONCAT('Dr ', d.first, ' ', d.last) AS client_name, d.practice_nr, uda.permissions
        FROM user_client_access uda
        JOIN clients d ON uda.client_id = d.client_id
        WHERE uda.user_id = ?`;
      const [clientAccess] = await db.query(clientAccessQuery, [user.user_id]);
      user.client_access = clientAccess;
  
      return user; // Return complete user object
  
    } catch (err) {
      console.error('Error fetching user data:', err);
      throw new Error('Internal Server Error'); // Re-throw a more generic error
    }
  },  
  

// Create new user
createUser: async (userDetails) => {
  const { email, password, first, last, address, tell_nr } = userDetails;

  try {
    const query = `INSERT INTO users (email, password, first, last, address, tell_nr) VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(query, [email, password, first, last, address, tell_nr]);
    
    return { userId: result.insertId };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw { message: 'Email already exists' };
    }
    throw { message: 'Database error', details: err };
  }
},


  // Create new client
  createClient: async (clientDetails) => {
    const { email, password, first, last, registration_nr, practice_nr, client_type, tell_nr } = clientDetails;

    try {
      const query = `INSERT INTO clients (email, password, first, last, registration_nr, practice_nr, client_type, tell_nr) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const [result] = await db.query(query, [email, password, first, last, registration_nr, practice_nr, client_type, tell_nr]);
      
      return { clientId: result.insertId };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw { message: 'Email already exists' };
      }
      throw { message: 'Database error', details: err };
    }
  },


}

module.exports = User;
