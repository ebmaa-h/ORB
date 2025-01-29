const db = require('../config/db');

const Account = {
  // Get all accounts
  allAccounts: async () => {
    const query = `
      SELECT 
        a.account_id,
        CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
        d.practice_nr,
        CONCAT(pr_dep.title, ' ', pr_dep.first, ' ', pr_dep.last) AS patient_name,
        ppm.dependent_nr AS patient_dependent_number,
        CONCAT(pr_main.title, ' ', pr_main.first, ' ', pr_main.last) AS member_name,
        pr_main.id_nr AS main_member_id,
        COUNT(i.invoice_id) AS total_invoices,
        CONCAT('R ', FORMAT(SUM(i.balance), 2)) AS total_invoice_balance
      FROM accounts a
      LEFT JOIN profiles p ON a.profile_id = p.profile_id
      LEFT JOIN clients d ON a.client_id = d.client_id
      LEFT JOIN person_records pr_main ON a.main_member_id = pr_main.person_id
      LEFT JOIN person_records pr_dep ON a.patient_id = pr_dep.person_id
      LEFT JOIN profile_person_map ppm 
        ON ppm.profile_id = p.profile_id AND ppm.person_id = a.patient_id
      LEFT JOIN invoices i ON a.account_id = i.account_id
      GROUP BY 
        a.account_id, 
        d.client_id, 
        d.practice_nr, 
        pr_main.person_id, 
        pr_dep.person_id,
        ppm.dependent_nr;
    `;

    try {
      const [results] = await db.query(query);
      return results;
    } catch (err) {
      throw err;
    }
  },

  // Get accounts by client
  clientAccounts: async (clientId) => {
    const query = `
      SELECT 
        a.account_id,
        CONCAT(pr_dep.title, ' ', pr_dep.first, ' ', pr_dep.last) AS patient_name,
        ppm.dependent_nr AS patient_dependent_number,
        CONCAT(pr_main.title, ' ', pr_main.first, ' ', pr_main.last) AS member_name,
        pr_main.id_nr AS main_member_id,
        CONCAT('R ', FORMAT(SUM(i.balance), 2)) AS total_invoice_balance
      FROM accounts a
      LEFT JOIN profiles p ON a.profile_id = p.profile_id
      LEFT JOIN clients d ON a.client_id = d.client_id
      LEFT JOIN person_records pr_main ON a.main_member_id = pr_main.person_id
      LEFT JOIN person_records pr_dep ON a.patient_id = pr_dep.person_id
      LEFT JOIN profile_person_map ppm 
        ON ppm.profile_id = p.profile_id AND ppm.person_id = a.patient_id
      LEFT JOIN invoices i ON a.account_id = i.account_id
      WHERE d.client_id = ?
      GROUP BY 
        a.account_id, 
        d.client_id, 
        d.practice_nr, 
        pr_main.person_id, 
        pr_dep.person_id,
        ppm.dependent_nr;
    `;

    try {
      const [results] = await db.query(query, [clientId]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  // Get partial account details
  partialAccount: async (accountId) => {
    const accQuery = `SELECT
        a.account_id, a.profile_id, a.client_id, a.main_member_id, a.patient_id,
        CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
        p.authorization_nr, p.medical_aid_nr, mp.plan_name, mp.plan_code,
        ma.name AS medical_aid_name
      FROM accounts a
      LEFT JOIN clients d ON a.client_id = d.client_id
      LEFT JOIN profiles p ON a.profile_id = p.profile_id
      LEFT JOIN medical_aid_plans mp ON p.plan_id = mp.plan_id
      LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
      WHERE a.account_id = ?;`;

    const personQuery = `SELECT 
        pr.person_id, CONCAT(pr.title, ' ', pr.first, ' ', pr.last) AS name,
        DATE_FORMAT(pr.date_of_birth, '%Y-%m-%d') AS date_of_birth, pr.gender,
        ppm.dependent_nr
      FROM person_records pr
      LEFT JOIN profile_person_map ppm ON pr.person_id = ppm.person_id
      WHERE pr.person_id = ?;`;

    const invQuery = `SELECT
        i.invoice_id,
        CONCAT(JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')), ' ', 
                JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last'))) AS patient_name,
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS patient_id,
        CONCAT(JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')), ' ', 
                JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last'))) AS member_name,
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS member_id,
        CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
        DATE_FORMAT(i.date_of_service , '%Y-%m-%d') AS date_of_service,
        i.status AS status
      FROM invoices i
      WHERE i.account_id = ?;`;

    try {
      const [accountResults] = await db.query(accQuery, [accountId]);
      if (!accountResults.length) {
        return null; // No account found
      }
      const account = accountResults[0];

      const [memberResults, patientResults, invoiceResults] = await Promise.all([
        db.query(personQuery, [account.main_member_id]),
        db.query(personQuery, [account.patient_id]),
        db.query(invQuery, [accountId]),
      ]);

      const result = {
        invoices: invoiceResults[0],
        account: accountResults[0],
        member: memberResults[0],
        patient: patientResults[0],
      };

      return result;
    } catch (err) {
      throw err;
    }
  },

  // Get full account details
  account: async (accountId) => {
    try {
      const accQuery = `SELECT
          a.account_id, a.profile_id, a.client_id, a.main_member_id, a.patient_id,
          CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
          p.authorization_nr, p.medical_aid_nr, mp.plan_name, mp.plan_code,
          ma.name AS medical_aid_name
        FROM accounts a
        LEFT JOIN clients d ON a.client_id = d.client_id
        LEFT JOIN profiles p ON a.profile_id = p.profile_id
        LEFT JOIN medical_aid_plans mp ON p.plan_id = mp.plan_id
        LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
        WHERE a.account_id = ?;`;

      const personQuery = `SELECT 
          pr.person_id, CONCAT(pr.title, ' ', pr.first, ' ', pr.last) AS name,
          DATE_FORMAT(pr.date_of_birth, '%Y-%m-%d') AS date_of_birth, pr.gender,
          ppm.dependent_nr, pa.address_id, pa.is_domicilium, pa.address
        FROM person_records pr
        LEFT JOIN profile_person_map ppm ON pr.person_id = ppm.person_id
        LEFT JOIN person_addresses pa ON pr.person_id = pa.person_id
        WHERE pr.person_id = ?;`;

      const invQuery = `SELECT
          i.invoice_id,
          CONCAT(JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')), ' ', 
                 JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last'))) AS patient_name,
          JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS patient_id,
          CONCAT(JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')), ' ', 
                 JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last'))) AS member_name,
          JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS member_id,
          CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
          DATE_FORMAT(i.date_of_service , '%Y-%m-%d') AS date_of_service,
          i.status AS status
        FROM invoices i
        WHERE i.account_id = ?;`;

      const [accountResults] = await db.query(accQuery, [accountId]);
      if (!accountResults.length) {
        return null; // No account found
      }
      const account = accountResults[0];

      const [memberResults, patientResults, invoiceResults] = await Promise.all([
        db.query(personQuery, [account.main_member_id]),
        db.query(personQuery, [account.patient_id]),
        db.query(invQuery, [accountId]),
      ]);

      account.member = memberResults[0];
      account.patient = patientResults[0];
      account.invoices = invoiceResults[0];

      return account;
    } catch (err) {
      throw err;
    }
  },
  

  
};

module.exports = Account;
