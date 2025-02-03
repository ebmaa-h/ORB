const allInvoices = `
SELECT 
  i.invoice_id,
  i.account_id,
  DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.title')) AS patient_title,
  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')) AS patient_first,
  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last')) AS patient_last,
  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS patient_id_nr,
  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.title')) AS member_title,
  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')) AS member_first,
  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last')) AS member_last,
  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS member_id_nr,
  CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
  DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updated_date,
  i.status,
  CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
  d.practice_nr AS client_practice_number
FROM invoices i
LEFT JOIN accounts a ON i.account_id = a.account_id
LEFT JOIN clients d ON a.client_id = d.client_id;
`;

const clientInvoices = `
SELECT 
  i.invoice_id,
  DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.title')) AS patient_title,
  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')) AS patient_first,
  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last')) AS patient_last,
  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS patient_id_nr,
  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.title')) AS member_title,
  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')) AS member_first,
  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last')) AS member_last,
  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS member_id_nr,
  CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
  DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updated_date,
  i.status
FROM invoices i
LEFT JOIN accounts a ON i.account_id = a.account_id
LEFT JOIN clients d ON a.client_id = d.client_id
WHERE d.client_id = ?;
`;

const invoiceDetails = `
SELECT 
  i.invoice_id,
  i.account_id,
  DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
  CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
  i.status,
  DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updated_date
FROM invoices i
WHERE i.invoice_id = ?;
`;
const patientDetails = `
SELECT
  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.title')) AS patient_title,
  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')) AS patient_first,
  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last')) AS patient_last,
  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS patient_id_nr
FROM invoices i
WHERE i.invoice_id = ?;
`;
const memberDetails = `
SELECT
  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.title')) AS member_title,
  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')) AS member_first,
  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last')) AS member_last,
  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS member_id_nr
FROM invoices i
WHERE i.invoice_id = ?;
`;
const clientDetails = `
SELECT
  CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
  d.practice_nr AS client_practice_number
FROM invoices i
LEFT JOIN accounts a ON i.account_id = a.account_id
LEFT JOIN clients d ON a.client_id = d.client_id
WHERE i.invoice_id = ?;
`;
const medicalAidDetails = `
SELECT
  p.medical_aid_nr AS profile_medical_aid_nr,
  p.authorization_nr AS profile_authorization_nr,
  ma.name AS medical_aid_name,
  mp.plan_name AS medical_aid_plan_name
FROM invoices i
LEFT JOIN accounts a ON i.account_id = a.account_id
LEFT JOIN profiles p ON a.profile_id = p.profile_id
LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
LEFT JOIN medical_aid_plans mp ON p.plan_id = mp.plan_id
WHERE i.invoice_id = ?;
`;


const createNewInvoice = `
INSERT INTO 
  invoices (account_id, profile_id, date_of_service, status, patient_snapshot, member_snapshot, balance)
  VALUES (?, ?, ?, 'Processing', ?, ?, ?);
`;


module.exports = {
  allInvoices,
  clientInvoices,
  invoiceDetails,
  patientDetails,
  memberDetails,
  clientDetails,
  medicalAidDetails,
  createNewInvoice,
};
