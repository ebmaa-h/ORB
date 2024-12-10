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
            COUNT(DISTINCT i.invoice_id) AS total_invoices
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
        GROUP BY ppm.map_id, pr.title, pr.first, pr.last, pr.date_of_birth, pr.id_nr, ppm.dependent_nr;
    `;
  
    const accQuery = 'SELECT * FROM accounts WHERE profile_id = ?';
    const invQuery = 'SELECT * FROM invoices WHERE profile_id = ?';

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

                // Prepare result object
                const result = {
                    dependents: dependentsResults.length > 0 ? JSON.parse(`[${dependentsResults[0].dependent}]`) : [],
                    accounts: accountsResults,
                    invoices: invoicesResults,
                };

                // Return the result
                callback(null, result);
            });
        });
    });
}

};

module.exports = Profile;
