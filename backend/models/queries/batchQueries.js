// batchQueries.js

// Get all batches with client + user info
const GET_ALL_BATCHES = `
  SELECT 
    b.batch_id,
    b.current_department,
    b.pending,
    b.status,
    b.batch_size,
    b.date_received,
    c.client_id,
    c.first AS client_first,
    c.last AS client_last,
    c.client_type,
    u1.email AS created_by_email,
    u2.email AS admitted_by_email,
    u3.email AS billed_by_email
  FROM batches b
  LEFT JOIN clients c ON b.client_id = c.client_id
  LEFT JOIN users u1 ON b.created_by = u1.user_id
  LEFT JOIN users u2 ON b.admitted_by = u2.user_id
  LEFT JOIN users u3 ON b.billed_by = u3.user_id
  ORDER BY b.created_at DESC
`;

const CREATE_BATCH = `
  INSERT INTO batches (
    pending,
    status,
    created_by,
    admitted_by,
    billed_by,
    batch_size,
    client_id,
    date_received,
    method_received,
    bank_statements,
    added_on_drive,
    total_urgent_foreign,
    cc_availability,
    corrections
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

module.exports = {
  GET_ALL_BATCHES,
  CREATE_BATCH
};
