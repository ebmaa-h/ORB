const BASE_INVOICE_SELECT = `
  SELECT
    i.invoice_id,
    i.account_id,
    i.batch_id,
    i.nr_in_batch,
    i.date_of_service,
    i.status,
    i.ref_client_id,
    i.file_nr,
    i.balance,
    i.auth_nr,
    i.created_at,
    i.updated_at,
    a.profile_id,
    a.client_id,
    c.first AS client_first,
    c.last AS client_last,
    c.client_type,
    p.medical_aid_nr,
    p.balance AS profile_balance,
    p.is_active AS profile_is_active,
    ma.medical_aid_id,
    ma.name AS medical_aid_name,
    map.plan_id,
    map.plan_name,
    map.plan_code,
    mm.record_id AS main_member_record_id,
    mm.first AS main_member_first,
    mm.last AS main_member_last,
    mm.title AS main_member_title,
    mm.date_of_birth AS main_member_dob,
    mm.gender AS main_member_gender,
    mm.id_type AS main_member_id_type,
    mm.id_nr AS main_member_id_nr,
    ppm_main.dependent_nr AS main_member_dependent_nr,
    pat.record_id AS patient_record_id,
    pat.first AS patient_first,
    pat.last AS patient_last,
    pat.title AS patient_title,
    pat.date_of_birth AS patient_dob,
    pat.gender AS patient_gender,
    pat.id_type AS patient_id_type,
    pat.id_nr AS patient_id_nr,
    ppm_patient.dependent_nr AS patient_dependent_nr
  FROM invoices i
  JOIN accounts a ON a.account_id = i.account_id
  LEFT JOIN clients c ON c.client_id = a.client_id
  LEFT JOIN profiles p ON p.profile_id = a.profile_id
  LEFT JOIN medical_aids ma ON ma.medical_aid_id = p.medical_aid_id
  LEFT JOIN medical_aid_plans map ON map.plan_id = p.plan_id
  LEFT JOIN person_records mm ON mm.record_id = a.main_member_id
  LEFT JOIN profile_person_map ppm_main ON ppm_main.profile_id = p.profile_id AND ppm_main.record_id = a.main_member_id
  LEFT JOIN person_records pat ON pat.record_id = a.patient_id
  LEFT JOIN profile_person_map ppm_patient ON ppm_patient.profile_id = p.profile_id AND ppm_patient.record_id = a.patient_id
`;

const SELECT_INVOICES_BY_BATCH = `
  ${BASE_INVOICE_SELECT}
  WHERE i.batch_id = ?
  ORDER BY i.nr_in_batch ASC, i.invoice_id ASC
`;

const SELECT_INVOICE_BY_ID = `
  ${BASE_INVOICE_SELECT}
  WHERE i.invoice_id = ?
  LIMIT 1
`;

module.exports = {
  SELECT_INVOICES_BY_BATCH,
  SELECT_INVOICE_BY_ID,
};
