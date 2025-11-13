// Queries related to the reception department

const GET_RECEPTION_BATCHES = `
  SELECT * FROM batches 
    WHERE current_department = 'reception'
    ORDER BY date_received DESC
`;

const CREATE_BATCH = `
  INSERT INTO batches (
    pending, created_by, admitted_by, billed_by,
    batch_size, client_id, date_received, method_received,
    bank_statements, added_on_drive, total_urgent_foreign,
    cc_availability, corrections
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

module.exports = {
  CREATE_BATCH,
  GET_RECEPTION_BATCHES
};
