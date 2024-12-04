const db = require('../config/db');

const Account = {
  // Get all accounts with merged data
  allAccounts: (callback) => {
    const query = `
      SELECT 
          a.account_id,
          a.balance AS account_balance,
          -- Doctor Details
          CONCAT('Dr. ', LEFT(d.first, 1), '. ', d.last) AS doctor_name,
          d.practice_nr AS doctor_practice_number,
          -- Patient Details (Dependent)
          CONCAT(pat.title, ' ', pat.first, ' ', pat.last) AS patient_name,
          pat.id_nr AS patient_id_nr,
          pat.dependent_nr AS patient_dependent_nr,
          -- Member Details (Main Member)
          CONCAT(mem.title, ' ', mem.first, ' ', mem.last) AS member_name,
          mem.id_nr AS member_id_nr,
          -- Invoice Details
          COUNT(DISTINCT i.invoice_id) AS total_invoices -- Total invoices for this account
      FROM accounts a
      -- Join with doctor table for doctor details
      LEFT JOIN doctors d ON d.doctor_id = a.doctor_id
      -- Join with person_records table for patient details (linked via dependent_id)
      LEFT JOIN person_records pat ON pat.person_id = a.dependent_id
      -- Join with person_records table for member details (linked via main_member_id)
      LEFT JOIN person_records mem ON mem.person_id = a.main_member_id
      -- Join with invoices table to calculate total invoices
      LEFT JOIN invoices i ON i.account_id = a.account_id
      GROUP BY 
          a.account_id, 
          a.balance,
          d.first, d.last, d.practice_nr,
          pat.title, pat.first, pat.last, pat.id_nr, pat.dependent_nr,
          mem.title, mem.first, mem.last, mem.id_nr;
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
          -- Account Details
          a.account_id,
          CONCAT('R ', FORMAT(a.balance, 2)) AS account_balance,
          -- Doctor Details
          CONCAT('Dr. ', LEFT(d.first, 1), '. ', d.last) AS doctor_name,
          d.practice_nr AS doctor_practice_number,
          -- Patient Details (Dependent)
          CONCAT(pat.title, ' ', pat.first, ' ', pat.last) AS patient_name,
          pat.id_nr AS patient_id_nr,
          pat.dependent_nr AS patient_dependent_nr,
          -- Member Details (Main Member)
          CONCAT(mem.title, ' ', mem.first, ' ', mem.last) AS member_name,
          mem.id_nr AS member_id_nr,
          -- Profile and Medical Aid Details
          p.profile_id,
          p.medical_aid_nr,
          p.authorization_nr,
          ma.name AS medical_aid_name,
          map.plan_name AS medical_aid_plan_name,
          CONCAT('R ', FORMAT(p.balance, 2)) AS profile_balance,
      FROM accounts a
      -- Doctor Details
      LEFT JOIN doctors d ON d.doctor_id = a.doctor_id
      -- Patient Details
      LEFT JOIN person_records pat ON pat.person_id = a.dependent_id
      -- Member Details
      LEFT JOIN person_records mem ON mem.person_id = a.main_member_id
      -- Profile Details
      LEFT JOIN profiles p ON p.profile_id = a.profile_id
      LEFT JOIN medical_aids ma ON ma.medical_aid_id = p.medical_aid_id
      LEFT JOIN medical_aid_plans map ON map.plan_id = p.plan_id
      WHERE a.account_id = ?;
    `;
    db.query(query, [accountId], (err, results) => {
      if (err) {
        return callback(err, null);
      }

      // Fetch invoices related to this account
      const invoiceQuery = `
        SELECT 
          i.invoice_id,
          i.date_of_service,
          i.status,
          CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
        FROM invoices i
        WHERE i.account_id = ?
      `;

      db.query(invoiceQuery, [accountId], (err, invoiceResults) => {
        if (err) {
          return callback(err, null);
        }

      const account = results[0];
      const invoices = invoiceResults;

      // Initialize result with account data
      const result = {account, invoices};


      // Return the result with account and invoices data
      callback(null, result);
      });
    });
  },
};

module.exports = Account;
