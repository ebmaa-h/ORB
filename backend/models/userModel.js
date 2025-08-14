const db = require('../config/db');
const queries = require('./queries/userQueries');

const User = {
  listUsers: async (includeInactive = false) => {
    const query = includeInactive ? queries.getAllWithInactive : queries.getAll;
    const [users] = await db.query(query);
    return users;
  },

  getUser: async (id) => {
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

  createUser: async (userData) => {
    const { email, role = 'Reception', active = 1 } = userData;
    const [result] = await db.query(queries.create, [email, role, active]);
    return { user_id: result.insertId, email, role, active };
  },

  updateUser: async (id, updates) => {
    const { email, role } = updates;
    const [result] = await db.query(queries.update, [email, role, id]);
    return result.affectedRows > 0;
  },

  // Soft delete — set user inactive
  deactivate: async (id) => {
    const [result] = await db.query(queries.deactivate, [id]);
    return result.affectedRows > 0;
  },

  // Soft un-delete — set user active
  reactivate: async (id) => {
    const [result] = await db.query(queries.reactivate, [id]);
    return result.affectedRows > 0;
  }
};

module.exports = User;
