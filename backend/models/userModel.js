const db = require('../config/db');
const queries = require('./queries/userQueries')

const User = {

  findByEmail: async (email) => {
    try {
      const [results] = await db.query(queries.login, [email]);
      const user = results[0];

      console.log('User retrieved from db login request initial: ', user)

      if (!user) {
        console.log(`User with email ${email} not found.`);
        return null;
      }

      const [[features], [clientAccess]] = await Promise.all([
        db.query(queries.features, [user.user_id]),
        db.query(queries.clientAccess, [user.user_id])
      ]);

      user.features = features;
      user.client_access = clientAccess;

      return user;
    } catch (err) {
      console.error('Error fetching user data:', err);
      throw new Error('Internal Server Error');
    }
  },

  findById: async (id) => {
    try {
      const [results] = await db.query(queries.sessionId, [id]);
      const user = results[0];

      if (!user) {
        console.log(`User with ${id} not found.`);
        return null;
      }

       const [[features], [clientAccess]] = await Promise.all([
        db.query(queries.features, [user.user_id]),
        db.query(queries.clientAccess, [user.user_id])
      ]);

      user.features = features;
      user.client_access = clientAccess;

      return user;
    } catch (err) {
      console.error('Error fetching user data:', err);
      throw new Error('Internal Server Error');
    }
  },

  // Create new user
  createUser: async (userDetails) => {
    const { email, first, last, address = '', tell_nr = '' } = userDetails;

    try {
      const [result] = await db.query(queries.newUser, [email, first, last, address, tell_nr]);
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
