const db = require('../config/db');

const Account = {
  allAccounts: (callback) => {
    const query = `
      SELECT 
        a.account_id,
        CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS doctor_name,
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
      LEFT JOIN person_records pr_dep ON a.patient_id = pr_dep.person_id
      LEFT JOIN profile_person_map ppm 
        ON ppm.profile_id = p.profile_id AND ppm.person_id = a.patient_id
      LEFT JOIN invoices i ON a.account_id = i.account_id
      GROUP BY 
        a.account_id, 
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

  oneAccount: (accountId, callback) => {
    const accQuery = `
      SELECT
        a.account_id,
        a.profile_id,
        a.doctor_id,
        a.main_member_id,
        a.patient_id,
        CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS doctor_name,
        p.authorization_nr,
        p.medical_aid_nr, 
        mp.plan_name,
        mp.plan_code,
        ma.name AS medical_aid_name
      FROM accounts a
      LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
      LEFT JOIN profiles p ON a.profile_id = p.profile_id
      LEFT JOIN medical_aid_plans mp ON p.plan_id = mp.plan_id
      LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
      WHERE a.account_id = ?;
    `;

    const memberQuery = `
      SELECT 
      pr.person_id,
      CONCAT(pr.title, ' ', pr.first, ' ', pr.last) AS member_name,
      pr.cell_nr AS member_cell, 
      pr.tell_nr AS member_cell, 
      pr.email AS member_email,
      DATE_FORMAT(pr.date_of_birth, '%Y-%m-%d') AS date_of_birth,
      pr.gender,
      ppm.dependent_nr
      FROM person_records pr
      LEFT JOIN profile_person_map ppm ON pr.person_id = ppm.person_id
      WHERE pr.person_id = ?;
    `;

    const patientQuery = `
      SELECT 
      pr.person_id,
      CONCAT(pr.title, ' ', pr.first, ' ', pr.last) AS member_name,
      pr.cell_nr AS member_cell, 
      pr.tell_nr AS member_cell, 
      pr.email AS member_email,
      DATE_FORMAT(pr.date_of_birth, '%Y-%m-%d') AS date_of_birth,
      pr.gender,
      ppm.dependent_nr
      FROM person_records pr
      LEFT JOIN profile_person_map ppm ON pr.person_id = ppm.person_id
      WHERE pr.person_id = ?;
    `;

    const invQuery = `
        SELECT
            i.invoice_id AS 'Invoice ID',  -- Specify table alias for invoice_id
            CONCAT(JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')), ' ', JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last'))) AS 'Patient Name',
            JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS 'Patient ID',
            CONCAT(JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')), ' ', JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last'))) AS 'Member Name',
            JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS 'Member ID',
            CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
            DATE_FORMAT(i.date_of_service , '%Y-%m-%d') AS date_of_service,
            i.status AS 'Status',
            CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS doctor_name,
            d.practice_nr AS 'Doctor Practice Number'
        FROM invoices i
        JOIN accounts a ON i.account_id = a.account_id
        JOIN doctors d ON a.doctor_id = d.doctor_id
        WHERE i.account_id = ?
    `;

    db.query(accQuery, [accountId], (err, accResults) => {
        if (err) return callback(err, null);
        const account = accResults[0];

        db.query(memberQuery, [account.main_member_id], (err, memberResults) => {
            if (err) return callback(err, null);

            db.query(patientQuery, [account.patient_id], (err, patientResults) => {
                if (err) return callback(err, null);

                db.query(invQuery, [accountId], (err, invoiceResults) => {
                    if (err) return callback(err, null);

                    const result = {
                        account,
                        member: memberResults[0],
                        patient: patientResults[0],
                        invoices: invoiceResults,
                    };

                    callback(null, result);
                });
            });
        });
    });
  },

};

module.exports = Account;
