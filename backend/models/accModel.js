const db = require('../config/db');

const Account = {
  allAccounts: (callback) => {
    const query = `
      SELECT 
        a.account_id,
        CONCAT('Dr. ', LEFT(d.first, 1), '. ', d.last) AS doctor_name,
        d.practice_nr,
        CONCAT(pr_dep.title, ' ', pr_dep.first, ' ', pr_dep.last) AS patient_name,
        ppm.dependent_nr AS patient_dependent_number, -- Add dependent number
        CONCAT(pr_main.title, ' ', pr_main.first, ' ', pr_main.last) AS member_name,
        pr_main.id_nr AS main_member_id,
        COUNT(i.invoice_id) AS total_invoices,
        CONCAT('R ', FORMAT(SUM(i.balance), 2)) AS total_invoice_balance
      FROM accounts a
      LEFT JOIN profiles p ON a.profile_id = p.profile_id
      LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
      LEFT JOIN person_records pr_main ON a.main_member_id = pr_main.person_id
      LEFT JOIN person_records pr_dep ON a.dependent_id = pr_dep.person_id
      LEFT JOIN profile_person_map ppm 
        ON ppm.profile_id = p.profile_id AND ppm.person_id = a.dependent_id
      LEFT JOIN invoices i ON a.account_id = i.account_id
      GROUP BY 
        a.account_id, 
        a.balance, 
        d.doctor_id, 
        d.practice_nr, 
        pr_main.person_id, 
        pr_dep.person_id,
        ppm.dependent_nr;
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  // Get one account with all details
  oneAccount: (accountId, callback) => {
    const query = `
    SELECT 
      a.account_id,
      
    FROM accounts a WHERE account_id = ?`;

      db.query(query, [accountId], (err, result) => {
        if (err) {
          return callback(err, null);
        }

      // Return the result with account
      callback(null, result);
    });
  },
};

module.exports = Account;
