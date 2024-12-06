const db = require('../config/db');

const Profile = {

  allProfiles: (callback) => {
    const query = `
      SELECT 
          p.profile_id,
          CONCAT(mm.title, ' ', mm.first, ' ', mm.last) AS member_name,
          ma.name AS medical_aid_name,
          map.plan_name AS plan_name,
          p.medical_aid_nr,
          p.authorization_nr,
          p.balance,
          COUNT(DISTINCT a.account_id) AS total_accounts,
          COUNT(DISTINCT ppm.person_id) AS total_dependents,
          COUNT(DISTINCT i.invoice_id) AS total_invoices,
          GROUP_CONCAT(DISTINCT dependents.dependent) AS dependents,
          GROUP_CONCAT(DISTINCT accounts.account) AS accounts,
          GROUP_CONCAT(DISTINCT invoices.invoice) AS invoices
      FROM 
          profiles p
      LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
      LEFT JOIN medical_aid_plans map ON p.plan_id = map.plan_id
      LEFT JOIN accounts a ON p.profile_id = a.profile_id
      LEFT JOIN profile_person_map ppm ON p.profile_id = ppm.profile_id
      LEFT JOIN invoices i ON p.profile_id = i.profile_id
      -- Main member join
      LEFT JOIN profile_person_map main_map ON p.profile_id = main_map.profile_id AND main_map.is_main_member = TRUE
      LEFT JOIN person_records mm ON main_map.person_id = mm.person_id
      LEFT JOIN profile_person_map dependents ON p.profile_id = dependents.profile_id
      LEFT JOIN accounts accounts ON p.profile_id = accounts.profile_id
      LEFT JOIN invoices invoices ON p.profile_id = invoices.profile_id
      GROUP BY 
          p.profile_id;
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
              ppm.profile_id,
              JSON_OBJECT(
                  'person_id', pr.person_id,
                  'name', CONCAT(pr.title, ' ', pr.first, ' ', pr.last),
                  'date_of_birth', pr.date_of_birth,
                  'id_nr', pr.id_nr,
                  'dependent_nr', ppm.dependent_nr,
                  'total_accounts', COUNT(a.account_id)
              ) AS dependent
          FROM profile_person_map ppm
          JOIN person_records pr ON pr.person_id = ppm.person_id
          LEFT JOIN accounts a ON a.profile_id = ppm.profile_id AND a.dependent_id = pr.person_id
          WHERE ppm.profile_id = ?
          GROUP BY ppm.map_id
      ),
      accounts AS (
          SELECT 
              a.account_id,
              a.doctor_id,
              a.profile_id,
              JSON_OBJECT(
                  'account_id', a.account_id,
                  'doctor_name', CONCAT('Dr. ', LEFT(d.first, 1), ' ', d.last),
                  'patient_name', CONCAT(pr.title, ' ', pr.first, ' ', pr.last),
                  'id_nr', pr.id_nr,
                  'balance', CONCAT('R ', FORMAT(a.balance, 2)),
                  'total_invoices', COUNT(i.invoice_id)
              ) AS account
          FROM accounts a
          LEFT JOIN doctors d ON d.doctor_id = a.doctor_id
          LEFT JOIN person_records pr ON pr.person_id = COALESCE(a.dependent_id, a.main_member_id)
          LEFT JOIN invoices i ON i.account_id = a.account_id
          WHERE a.profile_id = ?
          GROUP BY a.account_id
      ),
      invoices AS (
          SELECT 
              i.invoice_id,
              i.account_id,
              i.profile_id,
              CONCAT(
                  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.title')), ' ',
                  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')), ' ',
                  JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last'))
              ) AS patient_name,
              JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS patient_id_nr,
              CONCAT(
                  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.title')), ' ',
                  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')), ' ',
                  JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last'))
              ) AS member_name,
              JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS member_id_nr,
              CONCAT('R ', FORMAT(i.balance, 2)) AS balance,
              i.date_of_service,
              i.status,
              CONCAT('Dr. ', LEFT(d.first, 1), '. ', d.last) AS doctor_name,
              d.practice_nr AS doctor_practice_number
          FROM invoices i
          LEFT JOIN accounts a ON i.account_id = a.account_id
          LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
          WHERE i.profile_id = ?
      )
      SELECT 
          p.profile_id,
          p.medical_aid_nr,
          p.authorization_nr,
          ma.name AS medical_aid_name,
          map.plan_name AS plan_name,
          GROUP_CONCAT(DISTINCT dependents.dependent) AS dependents,
          GROUP_CONCAT(DISTINCT accounts.account) AS accounts,
          GROUP_CONCAT(
              DISTINCT JSON_OBJECT(
                'invoice_id', invoices.invoice_id,
                'account_id', invoices.account_id,
                'profile_id', invoices.profile_id,
                'patient_name', invoices.patient_name,
                'patient_id_nr', invoices.patient_id_nr,
                'member_name', invoices.member_name,
                'member_id_nr', invoices.member_id_nr,
                'balance', invoices.balance,
                'date_of_service', invoices.date_of_service,
                'status', invoices.status,
                'doctor_name', invoices.doctor_name,
                'doctor_practice_number', invoices.doctor_practice_number
              )
          ) AS invoices,
          CONCAT(pm.title, ' ', pm.first, ' ', pm.last) AS main_member_name,
          pm.id_nr AS main_member_id_nr,
          ppm.dependent_nr AS main_member_dependent_nr
      FROM profiles p
      LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
      LEFT JOIN medical_aid_plans map ON p.plan_id = map.plan_id
      LEFT JOIN profile_person_map ppm ON ppm.profile_id = p.profile_id AND ppm.is_main_member = TRUE
      LEFT JOIN person_records pm ON pm.person_id = ppm.person_id
      LEFT JOIN dependents ON dependents.profile_id = p.profile_id
      LEFT JOIN accounts ON accounts.profile_id = p.profile_id
      LEFT JOIN invoices ON invoices.profile_id = p.profile_id
      WHERE p.profile_id = ?
      GROUP BY p.profile_id, ma.name, map.plan_name, pm.first, pm.last, ppm.dependent_nr;
    `;

    db.query(query, [profileId, profileId, profileId, profileId], (err, results) => {
        if (err) {
            return callback(err, null);
        }

        // Parse the JSON objects in the results for dependents, accounts, and invoices
        if (results.length > 0) {
            const result = results[0];
            console.log(results.invoices);
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
