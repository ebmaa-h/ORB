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

const partialAccount = `
  SELECT
    a.account_id, a.profile_id, a.client_id, a.main_member_id, a.patient_id,
    CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
    p.authorization_nr, p.medical_aid_nr, mp.plan_name, mp.plan_code,
    ma.name AS medical_aid_name
  FROM accounts a
  LEFT JOIN clients d ON a.client_id = d.client_id
  LEFT JOIN profiles p ON a.profile_id = p.profile_id
  LEFT JOIN medical_aid_plans mp ON p.plan_id = mp.plan_id
  LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
  WHERE a.account_id = ?;
`;

const recordQuery = `
  SELECT 
    pr.record_id, CONCAT(pr.title, ' ', pr.first, ' ', pr.last) AS name,
    DATE_FORMAT(pr.date_of_birth, '%Y-%m-%d') AS date_of_birth, pr.gender,
    ppm.dependent_nr
  FROM person_records pr
  LEFT JOIN profile_person_map ppm ON pr.record_id = ppm.record_id
  LEFT JOIN accounts a ON ppm.profile_id = a.profile_id
  WHERE pr.record_id = ? AND a.account_id = ?;
`;

const invQuery = `
  SELECT
    i.invoice_id,
    CONCAT(JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')), ' ', 
           JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last'))) AS patient_name,
    JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS patient_id,
    CONCAT(JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')), ' ', 
           JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last'))) AS member_name,
    JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS member_id,
    CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
    DATE_FORMAT(i.date_of_service , '%Y-%m-%d') AS date_of_service,
    i.status AS status
  FROM invoices i
  WHERE i.account_id = ?;
`;

const account = partialAccount; 

module.exports = {
  allAccounts,
  clientAccounts,
  partialAccount,
  account,
  recordQuery,
  invQuery,
};
