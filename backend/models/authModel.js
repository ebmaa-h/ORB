const db = require('../config/db');
const queries = require('./queries/authQueries.js')

const Auth = {

  // For session get user_id
  findByEmail: async (email) => {
    try {
      const [results] = await db.query(queries.login, [email]);
      const user = results[0];

      if (!user) {
        console.log(`User with email ${email} not found.`);
        return null;
      }

      return user;
    } catch (err) {
      console.error('Error fetching user data:', err);
      throw new Error('Internal Server Error');
    }
  },

  // For context get all user data 
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

}

module.exports = Auth;
