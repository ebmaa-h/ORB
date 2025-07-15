const db = require('../config/db');
const queries = require('./queries/userQueries');

const User = {
  // Get all active users
  getAll: async () => {
    const [users] = await db.query(queries.getAll);
    return users;
  },

  // Get full user info by ID, including features and client access
  getById: async (id) => {
    const [[user]] = await db.query(queries.getById, [id]);
    if (!user) return null;

    const [[features], [clientAccess]] = await Promise.all([
      db.query(queries.features, [id]),
      db.query(queries.clientAccess, [id])
    ]);

    user.features = features;
    user.client_access = clientAccess;
    return user;
  },

  // Create a new user
  create: async (userData) => {
    const { email, role = 'Reception', active } = userData;
    const [result] = await db.query(queries.create, [email, role, active]);
    return { user_id: result.insertId, email, role, active };
  },

  // Update a user's info
  update: async (id, updates) => {
    const { email, role } = updates;
    const [result] = await db.query(queries.update, [email, role, id]);
    return result.affectedRows > 0;
  },

  // Soft delete — set user inactive
  deactivate: async (id) => {
    const [result] = await db.query(queries.deactivate, [id]);
    return result.affectedRows > 0;
  }
};

module.exports = User;
