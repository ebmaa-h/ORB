const db = require('../config/db');
const queries = require('./queries/authQueries.js');

const Auth = {

  // Find user by email (login)
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

  // Get full user data for session/context
  findById: async (id) => {
    try {
      const [results] = await db.query(queries.sessionId, [id]);
      const user = results[0];

      if (!user) {
        console.log(`User with ID ${id} not found.`);
        return null;
      }

      // Fetch role-based permissions + user overrides + client access
      const [[permissions], [clientAccess]] = await Promise.all([
        db.query(queries.getUserPermissions, [user.user_id, user.user_id]), // Pass two times
        db.query(queries.clientAccess, [user.user_id])
      ]);


      user.permissions = permissions.map(p => p.permission_name);
      user.client_access = clientAccess;

      return user;
    } catch (err) {
      console.error('Error fetching user data:', err);
      throw new Error('Internal Server Error');
    }
  },

  };

module.exports = Auth;
