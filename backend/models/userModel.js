const db = require('../config/db');
const queries = require('./queries/userQueries')

const User = {

  loginUser: async (email) => {
    try {
      // Fetch user by email
      const [results] = await db.query(queries.login, [email]);
  
      // If no user is found, return null
      const user = results[0];
      if (!user) {
        console.log(`User with email ${email} not found.`);
        return null; 
      }
  
      const [features] = await db.query(queries.features, [user.user_id]);
      user.features = features;
  
      const [clientAccess] = await db.query(queries.clientAccess, [user.user_id]);
      user.client_access = clientAccess;
  
      return user; // Return complete user object
  
    } catch (err) {
      console.error('Error fetching user data:', err);
      throw new Error('Internal Server Error');
    }
  },  
  

// Create new user
createUser: async (userDetails) => {
  const { email, password, first, last, address, tell_nr } = userDetails;

  try {
    const [result] = await db.query(queries.newUser, [email, password, first, last, address, tell_nr]);
    
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
      const [result] = await db.query(queries.newClient, [email, password, first, last, registration_nr, practice_nr, client_type, tell_nr]);
      
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
