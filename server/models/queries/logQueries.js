const INSERT_WORKFLOW_LOG = `
  INSERT INTO logs (user_id, context, department, batch_type, entity_type, entity_id, action, message, metadata)
  VALUES (?, 'workflow', ?, ?, ?, ?, ?, ?, ?)
`;

const GET_WORKFLOW_LOGS = `
  SELECT 
    l.log_id,
    l.user_id,
    u.email,
    l.action,
    l.message,
    l.metadata,
    l.department,
    l.batch_type,
    l.entity_type,
    l.entity_id,
    l.created_at
  FROM logs l
  LEFT JOIN users u ON l.user_id = u.user_id
  WHERE l.context = 'workflow'
    AND l.department = ?
    AND l.batch_type = ?
    AND COALESCE(JSON_EXTRACT(l.metadata, '$.is_pure_foreign_urgent'), false) = false
  ORDER BY l.created_at DESC
`;

const GET_WORKFLOW_LOG_BY_ID = `
  SELECT 
    l.log_id,
    l.user_id,
    u.email,
    l.action,
    l.message,
    l.metadata,
    l.department,
    l.batch_type,
    l.entity_type,
    l.entity_id,
    l.created_at
  FROM logs l
  LEFT JOIN users u ON l.user_id = u.user_id
  WHERE l.log_id = ?
`;

module.exports = {
  INSERT_WORKFLOW_LOG,
  GET_WORKFLOW_LOGS,
  GET_WORKFLOW_LOG_BY_ID,
};
