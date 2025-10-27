const GET_BATCHES_BY_DEPARTMENT = `
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
  WHERE current_department = ?
  ORDER BY date_received DESC
`;

const GET_FU_BY_DEPARTMENT = `
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
  WHERE fua.current_department = ?
  ORDER BY b.date_received DESC
`;

// Transfers
const INSERT_TRANSFER = `
  INSERT INTO batch_transfers (
    item_type, item_id, from_department, to_department, target_status, status, created_by
  ) VALUES (?, ?, ?, ?, ?, 'pending', ?)
`;

const GET_LATEST_PENDING_TRANSFER = `
  SELECT * FROM batch_transfers
  WHERE item_type = ? AND item_id = ? AND to_department = ? AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1
`;

const ACCEPT_TRANSFER = `
  UPDATE batch_transfers
  SET status = 'accepted', accepted_by = ?, accepted_at = NOW()
  WHERE transfer_id = ?
`;

// Incoming to a department (derived inbox)
const GET_INCOMING_TRANSFERS_BATCHES = `
  SELECT b.*, ? AS current_department, 'inbox' AS status
  FROM batch_transfers t
  JOIN batches b ON b.batch_id = t.item_id
  WHERE t.item_type = 'batch' AND t.to_department = ? AND t.status = 'pending'
`;

const GET_OUTGOING_TRANSFERS_BATCHES = `
  SELECT b.*, ? AS current_department, 'outbox' AS status
  FROM batch_transfers t
  JOIN batches b ON b.batch_id = t.item_id
  WHERE t.item_type = 'batch' AND t.from_department = ? AND t.status = 'pending'
`;

const GET_INCOMING_TRANSFERS_FU = `
  SELECT 
    fua.foreign_urgent_batch_id AS batch_id,
    fua.batch_id AS parent_batch_id,
    fua.patient_name,
    fua.medical_aid_nr,
    ? AS current_department,
    'inbox' AS status,
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
  FROM batch_transfers t
  JOIN foreign_urgent_accounts fua ON fua.foreign_urgent_batch_id = t.item_id
  LEFT JOIN batches b ON fua.batch_id = b.batch_id
  WHERE t.item_type = 'fu' AND t.to_department = ? AND t.status = 'pending'
`;

const GET_OUTGOING_TRANSFERS_FU = `
  SELECT 
    fua.foreign_urgent_batch_id AS batch_id,
    fua.batch_id AS parent_batch_id,
    fua.patient_name,
    fua.medical_aid_nr,
    ? AS current_department,
    'outbox' AS status,
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
  FROM batch_transfers t
  JOIN foreign_urgent_accounts fua ON fua.foreign_urgent_batch_id = t.item_id
  LEFT JOIN batches b ON fua.batch_id = b.batch_id
  WHERE t.item_type = 'fu' AND t.from_department = ? AND t.status = 'pending'
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

const UPDATE_BATCH_ADMITTED_BY = `
  UPDATE batches
  SET admitted_by = ?
  WHERE batch_id = ?
`;

const UPDATE_BATCH_BILLED_BY = `
  UPDATE batches
  SET billed_by = ?
  WHERE batch_id = ?
`;

const UPDATE_FU_ADMITTED_BY = `
  UPDATE foreign_urgent_accounts
  SET admitted_by = ?
  WHERE foreign_urgent_batch_id = ?
`;

const UPDATE_FU_BILLED_BY = `
  UPDATE foreign_urgent_accounts
  SET billed_by = ?
  WHERE foreign_urgent_batch_id = ?
`;

const MOVE_BATCH = `
  UPDATE batches
  SET current_department = ?, status = 'inbox'
  WHERE batch_id = ?
`;

const MOVE_FU = `
  UPDATE foreign_urgent_accounts
  SET current_department = ?, status = 'inbox'
  WHERE foreign_urgent_batch_id = ?
`;

const ACCEPT_BATCH = `
  UPDATE batches
  SET status = 'current'
  WHERE batch_id = ?
`;

const ACCEPT_FU = `
  UPDATE foreign_urgent_accounts
  SET status = 'current'
  WHERE foreign_urgent_batch_id = ?
`;

const GET_BATCH_BY_ID = `
  SELECT 
    b.batch_id,
    b.created_by,
    b.batch_size,
    b.client_id,
    b.date_received,
    b.method_received,
    b.bank_statements,
    b.added_on_drive,
    b.total_urgent_foreign,
    b.cc_availability,
    b.corrections,
    b.admitted_by,
    b.billed_by,
    b.current_department,
    b.status,
    b.is_pure_foreign_urgent,
    c.first AS client_first,
    c.last AS client_last,
    c.client_type,
    SUBSTRING_INDEX(u_created.email, '@', 1) AS created_by_name,
    SUBSTRING_INDEX(u_admitted.email, '@', 1) AS admitted_by_name,
    SUBSTRING_INDEX(u_billed.email, '@', 1) AS billed_by_name
  FROM batches b
  LEFT JOIN clients c ON c.client_id = b.client_id
  LEFT JOIN users u_created ON u_created.user_id = b.created_by
  LEFT JOIN users u_admitted ON u_admitted.user_id = b.admitted_by
  LEFT JOIN users u_billed ON u_billed.user_id = b.billed_by
  WHERE b.batch_id = ?
`;

const GET_FU_BY_ID = `
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
    fua.admitted_by,
    fua.billed_by,
    b.created_by,
    b.client_id,
    b.method_received,
    b.date_received,
    c.first AS client_first,
    c.last AS client_last,
    c.client_type,
    SUBSTRING_INDEX(u_created.email, '@', 1) AS created_by_name,
    SUBSTRING_INDEX(u_fu_admitted.email, '@', 1) AS admitted_by_name,
    SUBSTRING_INDEX(u_fu_billed.email, '@', 1) AS billed_by_name
  FROM foreign_urgent_accounts fua
  LEFT JOIN batches b ON fua.batch_id = b.batch_id
  LEFT JOIN clients c ON c.client_id = b.client_id
  LEFT JOIN users u_created ON u_created.user_id = b.created_by
  LEFT JOIN users u_fu_admitted ON u_fu_admitted.user_id = fua.admitted_by
  LEFT JOIN users u_fu_billed ON u_fu_billed.user_id = fua.billed_by
  WHERE fua.foreign_urgent_batch_id = ?
`;

// Workflows
const WF_UPSERT_MAIN = `
  INSERT INTO workflows (entity_type, entity_id, department, status, outbox_temp, created_by)
  VALUES (?, ?, ?, ?, 0, ?)
  ON DUPLICATE KEY UPDATE department = VALUES(department), status = VALUES(status), updated_at = CURRENT_TIMESTAMP
`;

const WF_UPSERT_OUTBOX = `
  INSERT INTO workflows (entity_type, entity_id, department, status, outbox_temp, created_by)
  VALUES (?, ?, ?, 'outbox', 1, ?)
  ON DUPLICATE KEY UPDATE department = VALUES(department), status = 'outbox', updated_at = CURRENT_TIMESTAMP
`;

const WF_DELETE_OUTBOX = `
  DELETE FROM workflows WHERE entity_type = ? AND entity_id = ? AND outbox_temp = 1
`;

const WF_GET_MAIN_BY_ENTITY = `
  SELECT * FROM workflows WHERE entity_type = ? AND entity_id = ? AND outbox_temp = 0
`;

const WF_GET_OUTBOX_BY_ENTITY = `
  SELECT * FROM workflows WHERE entity_type = ? AND entity_id = ? AND outbox_temp = 1
`;

const WF_SELECT_BATCHES_MAIN_BY_DEPT = `
  SELECT 
    b.*,
    w.department AS current_department,
    w.status,
    c.first AS client_first,
    c.last AS client_last,
    c.client_type,
    SUBSTRING_INDEX(u_created.email, '@', 1) AS created_by_name,
    SUBSTRING_INDEX(u_admitted.email, '@', 1) AS admitted_by_name,
    SUBSTRING_INDEX(u_billed.email, '@', 1) AS billed_by_name
  FROM workflows w
  JOIN batches b ON b.batch_id = w.entity_id
  LEFT JOIN clients c ON c.client_id = b.client_id
  LEFT JOIN users u_created ON u_created.user_id = b.created_by
  LEFT JOIN users u_admitted ON u_admitted.user_id = b.admitted_by
  LEFT JOIN users u_billed ON u_billed.user_id = b.billed_by
  WHERE w.entity_type = 'batch' AND w.outbox_temp = 0 AND w.department = ?
`;

const WF_SELECT_BATCHES_OUTBOX_BY_DEPT = `
  SELECT 
    b.*,
    w.department AS current_department,
    w.status,
    c.first AS client_first,
    c.last AS client_last,
    c.client_type,
    SUBSTRING_INDEX(u_created.email, '@', 1) AS created_by_name,
    SUBSTRING_INDEX(u_admitted.email, '@', 1) AS admitted_by_name,
    SUBSTRING_INDEX(u_billed.email, '@', 1) AS billed_by_name
  FROM workflows w
  JOIN batches b ON b.batch_id = w.entity_id
  LEFT JOIN clients c ON c.client_id = b.client_id
  LEFT JOIN users u_created ON u_created.user_id = b.created_by
  LEFT JOIN users u_admitted ON u_admitted.user_id = b.admitted_by
  LEFT JOIN users u_billed ON u_billed.user_id = b.billed_by
  WHERE w.entity_type = 'batch' AND w.outbox_temp = 1 AND w.department = ? AND w.status = 'outbox'
`;

const WF_SELECT_FU_MAIN_BY_DEPT = `
  SELECT 
    fua.foreign_urgent_batch_id AS batch_id,
    fua.batch_id AS parent_batch_id,
    fua.patient_name,
    fua.medical_aid_nr,
    w.department AS current_department,
    w.status,
    fua.created_at,
    fua.updated_at,
    fua.bank_statements,
    fua.added_on_drive,
    fua.cc_availability,
    fua.corrections,
    b.created_by,
    b.client_id,
    b.method_received,
    b.date_received,
    c.first AS client_first,
    c.last AS client_last,
    c.client_type,
    SUBSTRING_INDEX(u_created.email, '@', 1) AS created_by_name,
    SUBSTRING_INDEX(u_fu_admitted.email, '@', 1) AS admitted_by_name,
    SUBSTRING_INDEX(u_fu_billed.email, '@', 1) AS billed_by_name
  FROM workflows w
  JOIN foreign_urgent_accounts fua ON fua.foreign_urgent_batch_id = w.entity_id
  LEFT JOIN batches b ON fua.batch_id = b.batch_id
  LEFT JOIN clients c ON c.client_id = b.client_id
  LEFT JOIN users u_created ON u_created.user_id = b.created_by
  LEFT JOIN users u_fu_admitted ON u_fu_admitted.user_id = fua.admitted_by
  LEFT JOIN users u_fu_billed ON u_fu_billed.user_id = fua.billed_by
  WHERE w.entity_type = 'fu' AND w.outbox_temp = 0 AND w.department = ?
`;

const WF_SELECT_FU_OUTBOX_BY_DEPT = `
  SELECT 
    fua.foreign_urgent_batch_id AS batch_id,
    fua.batch_id AS parent_batch_id,
    fua.patient_name,
    fua.medical_aid_nr,
    w.department AS current_department,
    w.status,
    fua.created_at,
    fua.updated_at,
    fua.bank_statements,
    fua.added_on_drive,
    fua.cc_availability,
    fua.corrections,
    b.created_by,
    b.client_id,
    b.method_received,
    b.date_received,
    c.first AS client_first,
    c.last AS client_last,
    c.client_type,
    SUBSTRING_INDEX(u_created.email, '@', 1) AS created_by_name,
    SUBSTRING_INDEX(u_fu_admitted.email, '@', 1) AS admitted_by_name,
    SUBSTRING_INDEX(u_fu_billed.email, '@', 1) AS billed_by_name
  FROM workflows w
  JOIN foreign_urgent_accounts fua ON fua.foreign_urgent_batch_id = w.entity_id
  LEFT JOIN batches b ON fua.batch_id = b.batch_id
  LEFT JOIN clients c ON c.client_id = b.client_id
  LEFT JOIN users u_created ON u_created.user_id = b.created_by
  LEFT JOIN users u_fu_admitted ON u_fu_admitted.user_id = fua.admitted_by
  LEFT JOIN users u_fu_billed ON u_fu_billed.user_id = fua.billed_by
  WHERE w.entity_type = 'fu' AND w.outbox_temp = 1 AND w.department = ? AND w.status = 'outbox'
`;

module.exports = {
  CREATE_BATCH,
  CREATE_FOREIGN_URGENT,
  GET_BATCHES_BY_DEPARTMENT,
  GET_FU_BY_DEPARTMENT,
  MOVE_BATCH,
  MOVE_FU,
  ACCEPT_BATCH,
  ACCEPT_FU,
  GET_BATCH_BY_ID,
  GET_FU_BY_ID,
  UPDATE_BATCH_ADMITTED_BY,
  UPDATE_BATCH_BILLED_BY,
  UPDATE_FU_ADMITTED_BY,
  UPDATE_FU_BILLED_BY,
  // workflows
  WF_UPSERT_MAIN,
  WF_UPSERT_OUTBOX,
  WF_DELETE_OUTBOX,
  WF_GET_MAIN_BY_ENTITY,
  WF_GET_OUTBOX_BY_ENTITY,
  WF_SELECT_BATCHES_MAIN_BY_DEPT,
  WF_SELECT_BATCHES_OUTBOX_BY_DEPT,
  WF_SELECT_FU_MAIN_BY_DEPT,
  WF_SELECT_FU_OUTBOX_BY_DEPT,
};

 

