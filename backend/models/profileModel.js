const db = require('../config/db');

const Profile = {

    // COUNT(DISTINCT a.account_id) AS total_accounts,
    // COUNT(DISTINCT ppm.person_id) AS total_dependents,
    // COUNT(DISTINCT i.invoice_id) AS total_invoices

  allProfiles: (callback) => {
    const query = `
        SELECT 
            p.profile_id,
            CONCAT(mm.title, ' ', mm.first, ' ', mm.last) AS member_name,
            ma.name AS medical_aid_name,
            map.plan_name AS plan_name,
            p.medical_aid_nr,
            p.authorization_nr,
            CONCAT('R ', FORMAT(p.balance, 2)) AS profile_balance
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
        GROUP BY 
            p.profile_id, ma.name, map.plan_name, mm.title, mm.first, mm.last;

    `;
    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  oneProfile: (profileId, callback) => {

    const dependentsQuery = `
        SELECT 
            ppm.person_id AS person_id,
            CONCAT(pr.title, ' ', pr.first, ' ', pr.last) AS name,
            DATE_FORMAT(pr.date_of_birth, '%Y-%m-%d') AS date_of_birth,
            pr.id_nr AS id_nr,
            pr.gender,
            ppm.dependent_nr AS dependent_nr
        FROM profile_person_map ppm
        JOIN person_records pr ON pr.person_id = ppm.person_id
        WHERE ppm.profile_id = ?
        GROUP BY ppm.map_id, pr.title, pr.first, pr.last, pr.date_of_birth, pr.id_nr, ppm.dependent_nr;
    `;
    
    const accQuery = `
        SELECT 
            a.account_id,
            CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
            CONCAT(pr.title, ' ', pr.first, ' ', pr.last) AS patient_name,
            pr.id_nr AS id_nr,
            CONCAT('R ', FORMAT(SUM(i.balance), 2)) AS total_balance,
            COUNT(i.invoice_id) AS total_invoices
        FROM accounts a
        LEFT JOIN clients d ON d.client_id = a.client_id
        LEFT JOIN person_records pr ON pr.person_id = COALESCE(a.patient_id, a.main_member_id)
        LEFT JOIN invoices i ON i.account_id = a.account_id
        WHERE a.profile_id = ?
        GROUP BY a.account_id, a.client_id, a.profile_id, d.first, d.last, pr.title, pr.first, pr.last, pr.id_nr;
    `;


  const invQuery = `
        SELECT
            i.invoice_id,
            CONCAT(JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')), ' ', JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last'))) AS 'Patient Name',
            JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS 'Patient ID',
            CONCAT(JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')), ' ', JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last'))) AS 'Member Name',
            JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS 'Member ID',
            CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
            DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
            i.status AS 'Status',
            DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updated_at
        FROM invoices i
        JOIN accounts a ON i.account_id = a.account_id
        JOIN clients d ON a.client_id = d.client_id
        WHERE i.profile_id = ?
    `;

    const profQuery = `
        SELECT 
            ppm.map_id,
            p.profile_id,
            p.medical_aid_nr,
            p.authorization_nr,
            CONCAT('R ', FORMAT(p.balance, 2)) AS profile_balance,
            ma.name AS medical_aid_name,
            map.plan_name AS plan_name,
            CONCAT(pr.title,' ', pr.first,' ', pr.last) AS main_member_name,
            ppm.dependent_nr AS main_member_dependent_nr
        FROM profile_person_map ppm
        LEFT JOIN profiles p ON ppm.profile_id = p.profile_id
        LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
        LEFT JOIN medical_aid_plans map ON p.plan_id = map.plan_id
        LEFT JOIN person_records pr ON ppm.person_id = pr.person_id
        WHERE p.profile_id = ?;
    `;



    // Query for dependents
    db.query(dependentsQuery, [profileId], (err, dependentsResults) => {
        if (err) {
            return callback(err, null);
        }

        // Query for accounts
        db.query(accQuery, [profileId], (err, accountsResults) => {
            if (err) {
                return callback(err, null);
            }

            // Query for invoices
            db.query(invQuery, [profileId], (err, invoicesResults) => {
                if (err) {
                    return callback(err, null);
                }

                // Query for profile
                db.query(profQuery, [profileId], (err, profileResults) => {
                    if (err) {
                        return callback(err, null);
                }

                    // Prepare result object
                    const result = {
                        dependents: dependentsResults.length > 0 ? dependentsResults : [],
                        accounts: accountsResults,
                        invoices: invoicesResults,
                        profileData: profileResults[0],
                    };

                    // Return the result
                    callback(null, result);
                });
            });
        });
    });
    },

};


module.exports = Profile;
