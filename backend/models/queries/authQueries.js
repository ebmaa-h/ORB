// Login by email
const login = 'SELECT user_id FROM users WHERE email = ?';

// Get user info by ID (including role)
const sessionId = `
  SELECT u.*, r.role_name
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.role_id
  WHERE u.user_id = ?`;

// Get all permissions for user (role + overrides)
const getUserPermissions = `
SELECT DISTINCT p.permission_name
FROM permissions p
JOIN role_permissions rp ON rp.permission_id = p.permission_id
JOIN users u ON u.role_id = rp.role_id
LEFT JOIN user_permission_overrides upo_revoke
       ON upo_revoke.permission_id = p.permission_id
       AND upo_revoke.user_id = u.user_id
       AND upo_revoke.effect = 'revoke'
WHERE u.user_id = ?
  AND upo_revoke.permission_id IS NULL

UNION

SELECT p.permission_name
FROM permissions p
JOIN user_permission_overrides upo_grant
  ON upo_grant.permission_id = p.permission_id
WHERE upo_grant.user_id = ?
  AND upo_grant.effect = 'grant';
`;

// Client/doctor access
const clientAccess = `
  SELECT d.client_id, CONCAT('Dr ', d.first, ' ', d.last) AS client_name, d.practice_nr
  FROM user_client_access uda
  JOIN clients d ON uda.client_id = d.client_id
  WHERE uda.user_id = ?`;

module.exports = {
  login,
  sessionId,
  getUserPermissions,
  clientAccess
};
