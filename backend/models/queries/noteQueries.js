const fetchNotes = `
  SELECT 
    n.note_id, 
    n.user_id, 
    u.email, 
    n.note, 
    n.created_at
  FROM notes n
  LEFT JOIN users u ON n.user_id = u.user_id
  WHERE n.target_table = ? AND n.target_id = ?
  ORDER BY n.created_at ASC;
`;

const insertNote = `
  INSERT INTO notes (target_table, target_id, user_id, note, created_at)
  VALUES (?, ?, ?, ?, NOW());
`;

const fetchSingleNote = `
  SELECT 
    n.note_id, 
    n.user_id, 
    u.email, 
    n.note, 
    n.created_at
  FROM notes n
  LEFT JOIN users u ON n.user_id = u.user_id
  WHERE n.note_id = ?;
`;

module.exports = { fetchNotes, insertNote, fetchSingleNote };
