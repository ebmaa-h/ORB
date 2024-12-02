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
                  'first', pr.first,
                  'last', pr.last,
                  'date_of_birth', pr.date_of_birth,
                  'gender', pr.gender,
                  'dependent_nr', pr.dependent_nr,
                  'is_main_member', pr.is_main_member
              ) AS dependent
          FROM person_records pr
      ),
      accounts AS (
          SELECT 
              a.profile_id,
              JSON_OBJECT(
                  'account_id', a.account_id,
                  'doctor_id', a.doctor_id,
                  'doctor_name', CONCAT(d.first, ' ', d.last),
                  'main_member_id', a.main_member_id,
                  'main_member_name', CONCAT(mm.first, ' ', mm.last),
                  'dependent_id', a.dependent_id,
                  'dependent_name', CONCAT(dp.first, ' ', dp.last)
              ) AS account
          FROM accounts a
          LEFT JOIN person_records dp ON dp.person_id = a.dependent_id
          LEFT JOIN person_records mm ON mm.person_id = a.main_member_id
          LEFT JOIN doctors d ON d.doctor_id = a.doctor_id
      ),
      invoices AS (
          SELECT 
              i.profile_id,
              JSON_OBJECT(
                  'invoice_id', i.invoice_id,
                  'date_of_service', i.date_of_service,
                  'status', i.status,
                  'patient_snapshot', i.patient_snapshot,
                  'member_snapshot', i.member_snapshot
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
