const SEARCH_PROFILES_WITH_ACCOUNTS = `
  SELECT
    p.profile_id,
    p.medical_aid_id,
    p.plan_id,
    p.medical_aid_nr,
    p.is_active,
    p.balance AS profile_balance,
    ma.name AS medical_aid_name,
    plan.plan_name,
    plan.plan_code,
    a.account_id,
    a.client_id,
    a.main_member_id,
    a.patient_id,
    mm_main.record_id AS mm_record_id,
    mm_main.first AS mm_first,
    mm_main.last AS mm_last,
    mm_main.title AS mm_title,
    mm_main.date_of_birth AS mm_dob,
    mm_main.gender AS mm_gender,
    mm_main.id_type AS mm_id_type,
    mm_main.id_nr AS mm_id_nr,
    ppm_main.dependent_nr AS mm_dependent_nr,
    pat.record_id AS patient_record_id,
    pat.first AS patient_first,
    pat.last AS patient_last,
    pat.title AS patient_title,
    pat.date_of_birth AS patient_dob,
    pat.gender AS patient_gender,
    pat.id_type AS patient_id_type,
    pat.id_nr AS patient_id_nr,
    ppm_patient.dependent_nr AS patient_dependent_nr
  FROM profiles p
  LEFT JOIN medical_aids ma ON ma.medical_aid_id = p.medical_aid_id
  LEFT JOIN medical_aid_plans plan ON plan.plan_id = p.plan_id
  LEFT JOIN profile_person_map ppm_main ON ppm_main.profile_id = p.profile_id AND ppm_main.is_main_member = 1
  LEFT JOIN person_records mm_main ON mm_main.record_id = ppm_main.record_id
  LEFT JOIN accounts a ON a.profile_id = p.profile_id AND a.client_id = ?
  LEFT JOIN person_records pat ON pat.record_id = a.patient_id
  LEFT JOIN profile_person_map ppm_patient ON ppm_patient.profile_id = p.profile_id AND ppm_patient.record_id = a.patient_id
  WHERE
    (
      p.medical_aid_nr = ?
      OR p.medical_aid_nr LIKE ?
      OR (mm_main.last IS NOT NULL AND mm_main.last LIKE ?)
      OR (mm_main.first IS NOT NULL AND mm_main.first LIKE ?)
      OR (mm_main.id_nr IS NOT NULL AND mm_main.id_nr LIKE ?)
      OR (pat.last IS NOT NULL AND pat.last LIKE ?)
      OR (pat.first IS NOT NULL AND pat.first LIKE ?)
      OR (pat.id_nr IS NOT NULL AND pat.id_nr LIKE ?)
    )
  ORDER BY p.medical_aid_nr ASC, a.account_id ASC
  LIMIT 100
`;

const buildProfilePersonsQuery = (count) => `
  SELECT
    ppm.profile_id,
    ppm.is_main_member,
    ppm.dependent_nr,
    pr.record_id,
    pr.first,
    pr.last,
    pr.title,
    pr.date_of_birth,
    pr.gender,
    pr.id_type,
    pr.id_nr
  FROM profile_person_map ppm
  INNER JOIN person_records pr ON pr.record_id = ppm.record_id
  WHERE ppm.profile_id IN (${new Array(count).fill("?").join(", ")})
`;

const SELECT_ALL_MEDICAL_AIDS = `
  SELECT medical_aid_id, name
  FROM medical_aids
  ORDER BY name ASC
`;

const SELECT_ALL_MEDICAL_AID_PLANS = `
  SELECT plan_id, plan_name, plan_code, medical_aid_id
  FROM medical_aid_plans
  ORDER BY plan_name ASC
`;

const SELECT_PROFILE_BY_MEDICAL_AID_NR = `
  SELECT *
  FROM profiles
  WHERE medical_aid_nr = ?
  LIMIT 1
`;

const INSERT_PROFILE = `
  INSERT INTO profiles (
    medical_aid_id,
    plan_id,
    medical_aid_nr,
    is_active,
    balance
  ) VALUES (?, ?, ?, 1, 0)
`;

const INSERT_PERSON = `
  INSERT INTO person_records (
    first,
    last,
    title,
    date_of_birth,
    gender,
    id_type,
    id_nr
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`;

const SELECT_PROFILE_PERSON_MAP = `
  SELECT map_id
  FROM profile_person_map
  WHERE profile_id = ? AND record_id = ?
  LIMIT 1
`;

const INSERT_PROFILE_PERSON_MAP = `
  INSERT INTO profile_person_map (
    profile_id,
    record_id,
    is_main_member,
    dependent_nr
  ) VALUES (?, ?, ?, ?)
`;

const SELECT_ACCOUNT_BY_KEYS = `
  SELECT *
  FROM accounts
  WHERE profile_id = ? AND client_id = ? AND main_member_id = ? AND (patient_id <=> ?)
  LIMIT 1
`;

const INSERT_ACCOUNT = `
  INSERT INTO accounts (
    profile_id,
    client_id,
    main_member_id,
    patient_id
  ) VALUES (?, ?, ?, ?)
`;

const INSERT_INVOICE = `
  INSERT INTO invoices (
    account_id,
    batch_id,
    nr_in_batch,
    date_of_service,
    status,
    ref_client_id,
    file_nr,
    balance,
    auth_nr
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

module.exports = {
  SEARCH_PROFILES_WITH_ACCOUNTS,
  SELECT_PROFILE_BY_MEDICAL_AID_NR,
  INSERT_PROFILE,
  INSERT_PERSON,
  SELECT_PROFILE_PERSON_MAP,
  INSERT_PROFILE_PERSON_MAP,
  SELECT_ACCOUNT_BY_KEYS,
  INSERT_ACCOUNT,
  INSERT_INVOICE,
  buildProfilePersonsQuery,
  SELECT_ALL_MEDICAL_AIDS,
  SELECT_ALL_MEDICAL_AID_PLANS,
};
