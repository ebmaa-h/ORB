const allProfiles = `
SELECT 
  p.profile_id,
  CONCAT(mm.title, ' ', mm.first, ' ', mm.last) AS member_name,
  ma.name AS medical_aid_name,
  map.plan_name AS plan_name,
  p.medical_aid_nr,
  CONCAT('R ', FORMAT(p.balance, 2)) AS profile_balance
FROM 
  profiles p
LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
LEFT JOIN medical_aid_plans map ON p.plan_id = map.plan_id
LEFT JOIN accounts a ON p.profile_id = a.profile_id
LEFT JOIN profile_person_map ppm ON p.profile_id = ppm.profile_id
-- Main member join
LEFT JOIN profile_person_map main_map ON p.profile_id = main_map.profile_id AND main_map.is_main_member = TRUE
LEFT JOIN person_records mm ON main_map.record_id = mm.record_id
GROUP BY 
  p.profile_id, ma.name, map.plan_name, mm.title, mm.first, mm.last;
`;

const dependents = `
SELECT 
  ppm.record_id AS record_id,
  CONCAT(pr.title, ' ', pr.first, ' ', pr.last) AS name,
  DATE_FORMAT(pr.date_of_birth, '%Y-%m-%d') AS date_of_birth,
  pr.id_nr AS id_nr,
  pr.gender,
  ppm.dependent_nr AS dependent_nr
FROM profile_person_map ppm
JOIN person_records pr ON pr.record_id = ppm.record_id
WHERE ppm.profile_id = ?
GROUP BY ppm.map_id, pr.title, pr.first, pr.last, pr.date_of_birth, pr.id_nr, ppm.dependent_nr;
`;

const acc = `
SELECT 
  a.account_id,
  CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
  CONCAT(pr.title, ' ', pr.first, ' ', pr.last) AS patient_name,
  pr.id_nr AS id_nr,
  CONCAT('R ', FORMAT(SUM(i.balance), 2)) AS total_balance,
  COUNT(i.invoice_id) AS total_invoices
FROM accounts a
LEFT JOIN clients d ON d.client_id = a.client_id
LEFT JOIN person_records pr ON pr.record_id = COALESCE(a.patient_id, a.main_member_id)
LEFT JOIN invoices i ON i.account_id = a.account_id
WHERE a.profile_id = ?
GROUP BY a.account_id, a.client_id, a.profile_id, d.first, d.last, pr.title, pr.first, pr.last, pr.id_nr;
`;

const inv = `
SELECT
  i.invoice_id,
  CONCAT(p.first, ' ', p.last) AS patient_name,
  p.id_nr AS patient_id,
  CONCAT(m.first, ' ', m.last) AS member_name,
  m.id_nr AS member_id,
  CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
  DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
  i.status,
  DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updated_at
FROM invoices i
JOIN accounts a ON i.account_id = a.account_id
LEFT JOIN person_records p ON a.patient_id = p.record_id
LEFT JOIN person_records m ON a.main_member_id = m.record_id
WHERE a.profile_id = ?;
`;


const prof = `
SELECT 
  ppm.map_id,
  p.profile_id,
  p.medical_aid_nr,
  CONCAT('R ', FORMAT(p.balance, 2)) AS profile_balance,
  ma.name AS medical_aid_name,
  map.plan_name AS plan_name,
  CONCAT(pr.title,' ', pr.first,' ', pr.last) AS main_member_name,
  ppm.dependent_nr AS main_member_dependent_nr
FROM profile_person_map ppm
LEFT JOIN profiles p ON ppm.profile_id = p.profile_id
LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
LEFT JOIN medical_aid_plans map ON p.plan_id = map.plan_id
LEFT JOIN person_records pr ON ppm.record_id = pr.record_id
WHERE p.profile_id = ?;
`;

module.exports = {
  allProfiles,
  dependents,
  acc,
  inv,
  prof,
}