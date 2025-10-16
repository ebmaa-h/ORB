// batchQueries.js

// future, get all batches
// get all billing batch etc. etc.

const GET_RECEPTION_BATCHES = `
      SELECT *, 'normal' AS type FROM batches 
      WHERE current_department = 'reception'
      ORDER BY date_received DESC
`;


const GET_RECEPTION_FOREIGN_URGENT_BATCHES = `
      SELECT *, 'foreign-urgent' AS type FROM foreign_urgent_accounts
      WHERE current_department = 'reception'
      ORDER BY date_received DESC
`;


const CREATE_BATCH = `
  INSERT INTO batches (
    created_by,
    batch_size, client_id, date_received, method_received,
    bank_statements, added_on_drive, total_urgent_foreign,
    cc_availability, corrections
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

module.exports = {
  CREATE_BATCH,
  GET_RECEPTION_BATCHES,
  GET_RECEPTION_FOREIGN_URGENT_BATCHES
};
