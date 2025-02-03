// Login
const login = 'SELECT * FROM users WHERE email = ?';

// User specific features
const features = `
  SELECT f.feature_name, uf.is_active, uf.permissions
  FROM user_feature_access uf
  JOIN features f ON uf.feature_id = f.feature_id
  WHERE uf.user_id = ?`;

// User client/doctor access
const clientAccess = `
  SELECT d.client_id, CONCAT('Dr ', d.first, ' ', d.last) AS client_name, d.practice_nr, uda.permissions
  FROM user_client_access uda
  JOIN clients d ON uda.client_id = d.client_id
  WHERE uda.user_id = ?`;

const newUser = `INSERT INTO users (email, password, first, last, address, tell_nr) VALUES (?, ?, ?, ?, ?, ?)`;

const newClient = `INSERT INTO clients (email, password, first, last, registration_nr, practice_nr, client_type, tell_nr) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

module.exports = {
  features,
  clientAccess,
  newUser,
  newClient,
  login,
}