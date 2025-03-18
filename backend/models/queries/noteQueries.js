const fetchAccNotes = `
  SELECT 
    n.note_id, 
    n.user_id, 
    u.first AS user_name, 
    n.note, 
    n.created_at
  FROM notes n
  LEFT JOIN users u ON n.user_id = u.user_id
  WHERE n.target_table = 'accounts' AND n.target_id = ?;
`;
const fetchInvoiceNotes = `
  SELECT 
    n.note_id, 
    n.user_id, 
    u.first AS user_name, 
    n.note, 
    n.created_at
  FROM notes n
  LEFT JOIN users u ON n.user_id = u.user_id
  WHERE n.target_table = 'invoices' AND n.target_id = ?;
`;

module.exports = { fetchAccNotes, fetchInvoiceNotes };
