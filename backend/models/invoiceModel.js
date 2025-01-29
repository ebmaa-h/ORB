const db = require('../config/db');

const Invoice = {
  // Retrieve all invoices
// Retrieve all invoices
allInvoices: (callback) => {
  const query = `
    SELECT 
      i.invoice_id,
      i.account_id,
      DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
      JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.title')) AS patient_title,
      JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')) AS patient_first,
      JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last')) AS patient_last,
      JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS patient_id_nr,
      JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.title')) AS member_title,
      JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')) AS member_first,
      JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last')) AS member_last,
      JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS member_id_nr,
      CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
      DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updated_date,
      i.status,
      CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
      d.practice_nr AS client_practice_number
    FROM invoices i
    LEFT JOIN accounts a ON i.account_id = a.account_id
    LEFT JOIN clients d ON a.client_id = d.client_id;
  `;

  db.query(query, (err, results) => {
    if (err) {
      return callback(err, null);
    }

    // Format results to include full names and other derived fields
    const formattedResults = results.map((invoice) => ({
      invoice_id: invoice.invoice_id,
      account_id: invoice.account_id,
      patient_full: `${invoice.patient_title} ${invoice.patient_first} ${invoice.patient_last}`,
      patient_id: invoice.patient_id_nr,
      member_full: `${invoice.member_title} ${invoice.member_first} ${invoice.member_last}`,
      member_id: invoice.member_id_nr,
      invoice_balance: invoice.invoice_balance,
      date_of_service: invoice.date_of_service,
      status: invoice.status,
      client_name: invoice.client_name,
      client_practice_number: invoice.client_practice_number,
      updated_date: invoice.updated_date,
    }));

    callback(null, formattedResults);
  });
},

  clientInvoices: async (clientId) => {
    const query = `
      SELECT 
        i.invoice_id,
        DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.title')) AS patient_title,
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')) AS patient_first,
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last')) AS patient_last,
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS patient_id_nr,
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.title')) AS member_title,
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')) AS member_first,
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last')) AS member_last,
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS member_id_nr,
        CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
        DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updated_date,
        i.status
      FROM invoices i
      LEFT JOIN accounts a ON i.account_id = a.account_id
      LEFT JOIN clients d ON a.client_id = d.client_id
      WHERE d.client_id = ?;
    `;

    try {
      const [results] = await db.query(query, [clientId]);  // MySQL2 returns a result array with the data in the first element

      // Extract actual invoice data, format names etc.
      const formattedResults = results.map((invoice) => ({
        invoice_id: invoice.invoice_id,
        patient_full: `${invoice.patient_title} ${invoice.patient_first} ${invoice.patient_last}`,
        patient_id: invoice.patient_id_nr,
        member_full: `${invoice.member_title} ${invoice.member_first} ${invoice.member_last}`,
        member_id: invoice.member_id_nr,
        invoice_balance: invoice.invoice_balance,
        date_of_service: invoice.date_of_service,
        status: invoice.status,
        updated_date: invoice.updated_date,
      }));

      return formattedResults;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw new Error('Error fetching invoices');
    }
  },

  oneInvoice: async (invoiceId) => {
    const invoiceDetailsQuery = `
      SELECT 
        i.invoice_id,
        i.account_id,
        DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
        CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
        i.status,
        DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updated_date
      FROM invoices i
      WHERE i.invoice_id = ?;
    `;
    const patientDetailsQuery = `
      SELECT
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.title')) AS patient_title,
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')) AS patient_first,
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last')) AS patient_last,
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS patient_id_nr
      FROM invoices i
      WHERE i.invoice_id = ?;
    `;
    const memberDetailsQuery = `
      SELECT
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.title')) AS member_title,
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')) AS member_first,
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last')) AS member_last,
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS member_id_nr
      FROM invoices i
      WHERE i.invoice_id = ?;
    `;
    const clientDetailsQuery = `
      SELECT
        CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client_name,
        d.practice_nr AS client_practice_number
      FROM invoices i
      LEFT JOIN accounts a ON i.account_id = a.account_id
      LEFT JOIN clients d ON a.client_id = d.client_id
      WHERE i.invoice_id = ?;
    `;
    const medicalAidDetailsQuery = `
      SELECT
        p.medical_aid_nr AS profile_medical_aid_nr,
        p.authorization_nr AS profile_authorization_nr,
        ma.name AS medical_aid_name,
        mp.plan_name AS medical_aid_plan_name
      FROM invoices i
      LEFT JOIN accounts a ON i.account_id = a.account_id
      LEFT JOIN profiles p ON a.profile_id = p.profile_id
      LEFT JOIN medical_aids ma ON p.medical_aid_id = ma.medical_aid_id
      LEFT JOIN medical_aid_plans mp ON p.plan_id = mp.plan_id
      WHERE i.invoice_id = ?;
    `;

    try {
      // Perform all queries concurrently using Promise.all
      const [invoiceDetailsResults, patientDetailsResults, memberDetailsResults, clientDetailsResults, medicalAidDetailsResults] = await Promise.all([
        db.query(invoiceDetailsQuery, [invoiceId]),
        db.query(patientDetailsQuery, [invoiceId]),
        db.query(memberDetailsQuery, [invoiceId]),
        db.query(clientDetailsQuery, [invoiceId]),
        db.query(medicalAidDetailsQuery, [invoiceId]),
      ]);

      if (!invoiceDetailsResults.length) return null;

      const result = {
        invoice: invoiceDetailsResults[0],
        client: clientDetailsResults[0],
        medical: medicalAidDetailsResults[0],
        member: memberDetailsResults[0],
        patient: patientDetailsResults[0],
      };

      return result;
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      throw new Error('Error fetching invoice details');
    }
  },

};

module.exports = Invoice;
