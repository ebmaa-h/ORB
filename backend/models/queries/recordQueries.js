const allRecords = `
SELECT 
  record_id,
  CONCAT(title, ' ', first, ' ', last) AS name,
  gender,
  id_nr,
  DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at
FROM person_records;
`;

const recordDetailsQuery = `
SELECT 
pr.title,
pr.first,
pr.last,
DATE_FORMAT(pr.date_of_birth, '%Y-%m-%d') AS date_of_birth,
pr.id_nr,
pr.gender
FROM person_records pr
WHERE pr.record_id = ?;
`;

const addressesQuery = `
SELECT
  pa.address_id,
  pa.is_domicilium,
  pa.address
FROM person_addresses pa
WHERE pa.record_id = ?;
`;

const contactNumbersQuery = `
SELECT
  pc.number_id,
  pc.num_type,
  pc.num
FROM person_contact_numbers pc
WHERE pc.record_id = ?;
`;

const emailsQuery = `
SELECT
  pe.email_id,
  pe.email
FROM person_emails pe
WHERE pe.record_id = ?;
`;

const accountsQuery = `
SELECT
  a.account_id,
  CONCAT('R ', FORMAT(SUM(i.balance), 2)) AS acc_balance,
  CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client,
  COUNT(i.invoice_id) AS total_invoices
FROM accounts a
LEFT JOIN invoices i ON a.account_id = i.account_id
LEFT JOIN clients d ON a.client_id = d.client_id
WHERE a.patient_id = ?
GROUP BY a.account_id, client;
`;

const invoicesQuery = `
SELECT
  i.invoice_id,
  DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
  i.status,
  i.balance,
  DATE_FORMAT(i.created_at, '%Y-%m-%d') AS created_date,
  DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updated_date
FROM invoices i
LEFT JOIN accounts a ON i.account_id = a.account_id
WHERE a.patient_id = ?;
`;

module.exports = {
  allRecords,
  recordDetailsQuery,
  addressesQuery,
  contactNumbersQuery,
  emailsQuery,
  accountsQuery,
  invoicesQuery,
}