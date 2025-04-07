const insertLog = `
  INSERT INTO logs (user_id, action, target_table, target_id, changes)
  VALUES (?, ?, ?, ?, ?)
`;

// target_id and table redundant -, but doig it for now check later, needed for create of invoice, to display that in the logs
const getLogs = `
  SELECT 
    l.log_id,
    l.user_id,
    u.first AS user_name,
    l.action,
    l.target_table,
    l.target_id,
    l.changes,
    l.timestamp
  FROM logs l
  LEFT JOIN users u ON l.user_id = u.user_id
  WHERE l.target_table = ? AND l.target_id = ?
  ORDER BY l.timestamp DESC
`;

module.exports = {
  insertLog,
  getLogs
};