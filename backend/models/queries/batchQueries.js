
const GET_RECEPTION_BATCHES = `
  SELECT 
    batch_id,
    created_by,
    batch_size,
    client_id,
    date_received,
    method_received,
    bank_statements,
    added_on_drive,
    total_urgent_foreign,
    cc_availability,
    corrections,
    current_department,
    status,
    is_pure_foreign_urgent
  FROM batches 
  WHERE current_department = 'reception'
  ORDER BY date_received DESC
`;

const GET_RECEPTION_FOREIGN_URGENT_BATCHES = `
  SELECT 
    fua.foreign_urgent_batch_id AS batch_id,
    fua.batch_id AS parent_batch_id,
    fua.patient_name,
    fua.medical_aid_nr,
    fua.current_department,
    fua.status,
    fua.created_at,
    fua.updated_at,
    fua.bank_statements,
    fua.added_on_drive,
    fua.cc_availability,
    fua.corrections,
    b.created_by,
    b.client_id,
    b.method_received,
    b.date_received
  FROM foreign_urgent_accounts fua
  LEFT JOIN batches b ON fua.batch_id = b.batch_id
  WHERE fua.current_department = 'reception'
  ORDER BY fua.date_received DESC
`;

const CREATE_BATCH = `
  INSERT INTO batches (
    created_by,
    batch_size,
    client_id,
    date_received,
    method_received,
    bank_statements,
    added_on_drive,
    total_urgent_foreign,
    cc_availability,
    corrections,
    current_department,
    status,
    is_pure_foreign_urgent
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reception', 'current', ?)
`;

const CREATE_FOREIGN_URGENT = `
  INSERT INTO foreign_urgent_accounts (
    batch_id,
    patient_name,
    medical_aid_nr,
    current_department,
    status
  ) VALUES (?, ?, ?, 'reception', 'current')
`;

module.exports = {
  CREATE_BATCH,
  CREATE_FOREIGN_URGENT,
  GET_RECEPTION_BATCHES,
  GET_RECEPTION_FOREIGN_URGENT_BATCHES,
};