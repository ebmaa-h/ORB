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
      CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS doctor_name,
      d.practice_nr AS doctor_practice_number
    FROM invoices i
    LEFT JOIN accounts a ON i.account_id = a.account_id
    LEFT JOIN doctors d ON a.doctor_id = d.doctor_id;
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
      doctor_name: invoice.doctor_name,
      doctor_practice_number: invoice.doctor_practice_number,
      updated_date: invoice.updated_date,
    }));

    callback(null, formattedResults);
  });
},

doctorInvoices: (doctorId, callback) => {
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
    LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
    WHERE d.doctor_id = ?;
  `;

  db.query(query, [doctorId], (err, results) => {
    if (err) {
      return callback(err, null);
    }

    // Extract actual invoice data, format names etc,
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

    callback(null, formattedResults);
  });
},





  // Retrieve a single invoice
  oneInvoice: (invoiceId, callback) => {
    const query = `

    `;
    db.query(query, [invoiceId], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  },
};

module.exports = Invoice;
