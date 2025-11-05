const FETCH_WORKFLOW_NOTES = `
  SELECT 
    n.note_id,
    n.user_id,
    u.email,
    n.note,
    n.created_at,
    n.department,
    n.batch_type,
    n.entity_type,
    n.entity_id
  FROM notes n
  LEFT JOIN users u ON n.user_id = u.user_id
  WHERE n.context = 'workflow' AND n.department = ? AND n.batch_type = ?
  ORDER BY n.created_at ASC;
`;

const INSERT_WORKFLOW_NOTE = `
  INSERT INTO notes (user_id, context, department, batch_type, entity_type, entity_id, note)
  VALUES (?, 'workflow', ?, ?, ?, ?, ?);
`;

const FETCH_NOTE_BY_ID = `
  SELECT 
    n.note_id,
    n.user_id,
    u.email,
    n.note,
    n.created_at,
    n.department,
    n.batch_type,
    n.entity_type,
    n.entity_id
  FROM notes n
  LEFT JOIN users u ON n.user_id = u.user_id
  WHERE n.note_id = ?;
`;

module.exports = {
  FETCH_WORKFLOW_NOTES,
  INSERT_WORKFLOW_NOTE,
  FETCH_NOTE_BY_ID,
};
