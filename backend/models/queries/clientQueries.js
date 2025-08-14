const allInvoices = `
SELECT 
  i.invoice_id,
  i.file_nr,
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
  i.auth_nr,
  CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
  d.practice_nr AS client_practice_number
FROM invoices i
LEFT JOIN accounts a ON i.account_id = a.account_id
LEFT JOIN clients d ON a.client_id = d.client_id;
`;

const accountByInvoiceId = `
SELECT
  a.account_id,
  a.profile_id,
  a.client_id,
  a.main_member_id,
  a.patient_id,
  DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
  i.status,
  i.file_nr,
  i.auth_nr,
  i.ref_client_id,
  i.updated_at
FROM accounts a
LEFT JOIN invoices i on a.account_id = i.account_id
WHERE i.invoice_id = ?;
`;

// get basic info needed to create new invoice
const accountByAccountId = `
SELECT
  a.account_id,
  a.profile_id,
  a.client_id,
  a.main_member_id,
  a.patient_id
FROM accounts a
WHERE a.account_id = ?;
`;

// create new invoice from top data and should retrieve invoice_id
const createNewInvoice = `
  INSERT INTO invoices (account_id)
  VALUES (?);
`;

const getNewInvoiceId = `
  SELECT LAST_INSERT_ID() AS invoice_id;
`;


const updateInvoice = `
UPDATE invoices
SET
    date_of_service = ?, 
    status = ?, 
    ref_client_id = ?, 
    file_nr = ?,
    auth_nr = ?,
    updated_at = NOW()
WHERE invoice_id = ?;
`;

const getAccountId = `
SELECT 
  i.account_id
FROM invoices i 
WHERE i.invoice_id = ?;
`;

// -- Fetch doctor details
// CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
// d.practice_nr AS client_practice_number

const clientInvoices = `
SELECT 
  i.invoice_id,
  i.file_nr,
  i.auth_nr,
  i.account_id,
  DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,

  -- Fetch patient details from person_records
  p.title AS patient_title,
  p.first AS patient_first,
  p.last AS patient_last,
  p.id_nr AS patient_id_nr,

  -- Fetch member details from person_records
  m.title AS member_title,
  m.first AS member_first,
  m.last AS member_last,
  m.id_nr AS member_id_nr,

  CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
  DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updated_date,
  i.status

FROM invoices i
LEFT JOIN accounts a ON i.account_id = a.account_id
LEFT JOIN clients d ON a.client_id = d.client_id
LEFT JOIN person_records p ON a.patient_id = p.record_id
LEFT JOIN person_records m ON a.main_member_id = m.record_id
WHERE d.client_id = ?;
`;

const invoiceDetails = `
SELECT 
  i.invoice_id,
  i.account_id,
  DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
  CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
  i.status,
  i.auth_nr,
  DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updated_date
FROM invoices i
WHERE i.invoice_id = ?;
`;
const patientDetails = `
SELECT
  CONCAT(p.title, ' ', p.first, ' ', p.last) AS patient_name,
  p.id_nr AS patient_id_nr
FROM accounts a
LEFT JOIN person_records p ON a.patient_id = p.record_id
WHERE a.account_id = ?;
`;
const memberDetails = `
SELECT
  CONCAT(m.title, ' ', m.first, ' ', m.last) AS memberName,
  m.id_nr AS member_id_nr
FROM accounts a
LEFT JOIN person_records p ON a.patient_id = p.record_id
WHERE a.account_id = ?;
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




// Same as accQueries
const client = `
SELECT
  c.client_id,
  c.email,
  CONCAT('Dr ', LEFT(c.first, 1), ' ', c.last) AS client_name,
  c.registration_nr,
  c.practice_nr,
  c.tell_nr,
  c.client_type
FROM clients c
WHERE c.client_id = ?;
`;


const refClient = `
SELECT 
* 
FROM ref_clients rc
LEFT JOIN ref_clients_list rcl ON rc.ref_client_list_id = rcl.ref_client_list_id
WHERE rc.client_id = 1;
`;

const addresses = `
SELECT
  pa.address_id,
  pa.is_domicilium,
  pa.address
FROM person_addresses pa
WHERE pa.record_id = ?;
`;

const contactNumbers = `
SELECT
  pc.number_id,
  pc.num_type,
  pc.num
FROM person_contact_numbers pc
WHERE pc.record_id = ?;
`;

const emails = `
SELECT
  pe.email_id,
  pe.email
FROM person_emails pe
WHERE pe.record_id = ?;
`;

const record = `
  SELECT 
    pr.record_id,
    pr.title,
    pr.first,
    pr.last,
    pr.id_nr,
    DATE_FORMAT(pr.date_of_birth, '%Y-%m-%d') AS date_of_birth,
    pr.gender,
    ppm.dependent_nr
  FROM person_records pr
  LEFT JOIN profile_person_map ppm ON pr.record_id = ppm.record_id
  LEFT JOIN accounts a ON ppm.profile_id = a.profile_id
  WHERE pr.record_id = ? AND a.account_id = ?;
`;


const medical = `
SELECT 
    p.profile_id,
    p.medical_aid_nr,
    m.name AS medical_aid_name,
    mp.plan_name,
    mp.plan_code
FROM accounts a
LEFT JOIN profiles p ON a.profile_id = p.profile_id
LEFT JOIN medical_aids m ON p.medical_aid_id = m.medical_aid_id
LEFT JOIN medical_aid_plans mp ON p.plan_id = mp.plan_id
WHERE a.account_id = ?;
`;

const allAccounts = `
  SELECT 
    a.account_id,
    CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
    d.practice_nr,
    CONCAT(pr_dep.title, ' ', pr_dep.first, ' ', pr_dep.last) AS patient_name,
    ppm.dependent_nr AS patient_dependent_number,
    CONCAT(pr_main.title, ' ', pr_main.first, ' ', pr_main.last) AS member_name,
    pr_main.id_nr AS main_member_id,
    COUNT(i.invoice_id) AS total_invoices,
    CONCAT('R ', FORMAT(SUM(i.balance), 2)) AS total_invoice_balance
  FROM accounts a
  LEFT JOIN profiles p ON a.profile_id = p.profile_id
  LEFT JOIN clients d ON a.client_id = d.client_id
  LEFT JOIN person_records pr_main ON a.main_member_id = pr_main.record_id
  LEFT JOIN person_records pr_dep ON a.patient_id = pr_dep.record_id
  LEFT JOIN profile_person_map ppm 
    ON ppm.profile_id = p.profile_id AND ppm.record_id = a.patient_id
  LEFT JOIN invoices i ON a.account_id = i.account_id
  GROUP BY 
    a.account_id, d.client_id, d.practice_nr, 
    pr_main.record_id, pr_dep.record_id, ppm.dependent_nr;
`;

const clientAccounts = `
  SELECT 
    a.account_id,
    CONCAT(pr_dep.title, ' ', pr_dep.first, ' ', pr_dep.last) AS patient_name,
    ppm.dependent_nr AS patient_dependent_number,
    CONCAT(pr_main.title, ' ', pr_main.first, ' ', pr_main.last) AS member_name,
    pr_main.id_nr AS main_member_id,
    CONCAT('R ', FORMAT(SUM(i.balance), 2)) AS total_invoice_balance
  FROM accounts a
  LEFT JOIN profiles p ON a.profile_id = p.profile_id
  LEFT JOIN clients d ON a.client_id = d.client_id
  LEFT JOIN person_records pr_main ON a.main_member_id = pr_main.record_id
  LEFT JOIN person_records pr_dep ON a.patient_id = pr_dep.record_id
  LEFT JOIN profile_person_map ppm 
    ON ppm.profile_id = p.profile_id AND ppm.record_id = a.patient_id
  LEFT JOIN invoices i ON a.account_id = i.account_id
  WHERE d.client_id = ?
  GROUP BY 
    a.account_id, d.client_id, d.practice_nr, 
    pr_main.record_id, pr_dep.record_id, ppm.dependent_nr;
`;

const clientAccount = `
  SELECT
    a.account_id, a.profile_id, a.client_id, a.main_member_id, a.patient_id,
    CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
    p.medical_aid_nr, mp.plan_name, mp.plan_code,
    ma.name AS medical_aid_name
  FROM accounts a
  LEFT JOIN clients d ON a.client_id = d.client_id
  LEFT JOIN profiles p ON a.profile_id = p.profile_id
  LEFT JOIN medical_aid_plans mp ON p.plan_id = mp.plan_id
  LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
  WHERE a.account_id = ?;
`;

const account = `
SELECT
  a.profile_id,
  a.client_id,
  a.main_member_id,
  a.patient_id
FROM accounts a
WHERE a.account_id = ?;
`;

const recordAll = `
SELECT
* 
FROM person_records pr
WHERE pr.record_id = ?;

`;

const partialRecord = `
  SELECT 
    pr.record_id,
    CONCAT(pr.title, ' ', pr.first, ' ', pr.last) AS name,
    pr.id_nr,
    ppm.dependent_nr
  FROM person_records pr
  LEFT JOIN profile_person_map ppm ON pr.record_id = ppm.record_id
  LEFT JOIN accounts a ON ppm.profile_id = a.profile_id
  WHERE pr.record_id = ? AND a.account_id = ?;
`;


const inv = `
SELECT
  i.invoice_id,
  i.file_nr,
  CONCAT(p.first, ' ', p.last) AS patient_name,
  p.id_nr AS patient_id,
  CONCAT(m.first, ' ', m.last) AS member_name,
  m.id_nr AS member_id,
  CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
  DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
  i.status AS status
FROM invoices i
LEFT JOIN accounts a ON a.account_id = i.account_id
LEFT JOIN person_records p ON a.patient_id = p.record_id
LEFT JOIN person_records m ON a.main_member_id = m.record_id
WHERE i.account_id = ?;

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

  allAccounts,
  clientAccounts,
  clientAccount,
  account,
  inv,
  recordAll,
  partialRecord,

  getAccountId,
  client,
  refClient,
  addresses,
  contactNumbers,
  emails,
  record,
  medical,
  updateInvoice,
  getNewInvoiceId,

  accountByAccountId,
  accountByInvoiceId,
};
