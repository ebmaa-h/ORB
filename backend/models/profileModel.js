const db = require('../config/db');

const Profile = {

  allProfiles: (callback) => {
    const query = `
      SELECT 
          p.profile_id,
          p.medical_aid_nr,
          p.authorization_nr,
          ma.name AS medical_aid_name,
          map.plan_name AS plan_name,
          CONCAT(pm.first, ' ', pm.last) AS main_member_name,
          COUNT(DISTINCT pr.person_id) - 1 AS total_dependents, -- Exclude main member from dependents count
          COUNT(DISTINCT a.account_id) AS total_accounts
      FROM 
          profiles p
      LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
      LEFT JOIN medical_aid_plans map ON p.plan_id = map.plan_id
      LEFT JOIN person_records pr ON pr.profile_id = p.profile_id
      LEFT JOIN person_records pm ON pm.profile_id = p.profile_id AND pm.is_main_member = TRUE
      LEFT JOIN accounts a ON a.profile_id = p.profile_id
      GROUP BY 
          p.profile_id, 
          p.medical_aid_nr, 
          p.authorization_nr, 
          ma.name, 
          map.plan_name, 
          pm.first, 
          pm.last;
    `;
    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  oneProfile: (profileId, callback) => {
    const query = `
      WITH dependents AS (
          SELECT 
              pr.profile_id,
              JSON_OBJECT(
                  'person_id', pr.person_id,
                  'name', CONCAT(pr.title, ' ', pr.first, ' ', pr.last),
                  'date_of_birth', pr.date_of_birth,
                  'id', pr.id_nr,
                  'dependent_nr', pr.dependent_nr
              ) AS dependent
          FROM person_records pr
      ),
      accounts AS (
          SELECT 
              a.profile_id,
              JSON_OBJECT(
                  'account_id', a.account_id,
                  'doctor_name', CONCAT('Dr. ', LEFT(d.first, 1), ' ', d.last),
                  'patientname', CONCAT(pr.title, ' ', pr.first, ' ', pr.last),
                  'id_nr', pr.id_nr,
                  'balance', CONCAT('R ', FORMAT(a.balance, 2))
              ) AS account
          FROM accounts a
          LEFT JOIN doctors d ON d.doctor_id = a.doctor_id
          LEFT JOIN person_records pr ON pr.person_id = COALESCE(a.dependent_id, a.main_member_id)
      ),
      invoices AS (
          SELECT 
              i.profile_id,
              JSON_OBJECT(
                  'invoice_id', i.invoice_id,
                  'date_of_service', i.date_of_service,
                  'status', i.status,
                  'patient_snapshot', i.patient_snapshot,
                  'member_snapshot', i.member_snapshot,
                  'balance', CONCAT('R ', FORMAT(i.balance, 2))
              ) AS invoice
          FROM invoices i
      )
      SELECT 
          p.profile_id,
          p.medical_aid_nr,
          p.authorization_nr,
          ma.name AS medical_aid_name,
          map.plan_name AS plan_name,
          CONCAT(pm.first, ' ', pm.last) AS main_member_name,
          pm.id_nr AS main_member_id_nr, -- Main Member's ID Number
          pm.dependent_nr AS main_member_dependent_nr, -- Main Member's Dependent Number
          -- Aggregated Details
          GROUP_CONCAT(DISTINCT dependents.dependent) AS dependents,
          GROUP_CONCAT(DISTINCT accounts.account) AS accounts,
          GROUP_CONCAT(DISTINCT invoices.invoice) AS invoices
      FROM profiles p
      LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
      LEFT JOIN medical_aid_plans map ON p.plan_id = map.plan_id
      LEFT JOIN person_records pm ON pm.profile_id = p.profile_id AND pm.is_main_member = TRUE
      LEFT JOIN dependents ON dependents.profile_id = p.profile_id
      LEFT JOIN accounts ON accounts.profile_id = p.profile_id
      LEFT JOIN invoices ON invoices.profile_id = p.profile_id
      WHERE p.profile_id = ?
      GROUP BY p.profile_id, ma.name, map.plan_name, pm.first, pm.last;
    `;

    db.query(query, [profileId], (err, results) => {
      if (err) {
        return callback(err, null);
      }

      // Parse the JSON objects in the results for dependents, accounts, and invoices
      if (results.length > 0) {
        const result = results[0];
        result.dependents = JSON.parse(`[${result.dependents || ''}]`);
        result.accounts = JSON.parse(`[${result.accounts || ''}]`);
        result.invoices = JSON.parse(`[${result.invoices || ''}]`);
        callback(null, result);
      } else {
        callback(null, null);
      }
    });
  },

  
};

module.exports = Profile;
