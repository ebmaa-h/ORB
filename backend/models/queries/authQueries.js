// Login
const login = 'SELECT user_id FROM users WHERE email = ?';

// Get user ID
const sessionId = 'SELECT * FROM users WHERE user_id = ?';

// User specific features
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
  login,
  sessionId,
  clientAccess,
  features,
}