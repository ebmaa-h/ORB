// Main user queries
const getAll = `
  SELECT user_id, email, role, active, created_at, updated_at
  FROM users
  ORDER BY created_at DESC`;

const getById = `
  SELECT user_id, email, role, active, created_at, updated_at
  FROM users
  WHERE user_id = ?`;

// Create a new user
const create = `
  INSERT INTO users (email, role, active)
  VALUES (?, ?, ?)`;

// Update user info
const update = `
  UPDATE users
  SET email = ?, role = ?
  WHERE user_id = ?`;

// Soft delete user (set active = 0)
const deactivate = `
  UPDATE users
  SET active = 0
  WHERE user_id = ?`;

// User-specific features
const features = `
  SELECT f.feature_name
  FROM user_feature_access uf
  JOIN features f ON uf.feature_id = f.feature_id
  WHERE uf.user_id = ?`;

// User client/doctor access
const clientAccess = `
  SELECT d.client_id, CONCAT('Dr ', d.first, ' ', d.last) AS client_name, d.practice_nr
  FROM user_client_access uda
  JOIN clients d ON uda.client_id = d.client_id
  WHERE uda.user_id = ?`;

module.exports = {
  getAll,
  getById,
  create,
  update,
  deactivate,
  features,
  clientAccess
};
