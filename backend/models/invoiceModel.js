const db = require('../config/db');

const Invoice = {
  // Retrieve all invoices
  allInvoices: (callback) => {
    const query = `
      SELECT 
        i.invoice_id,
        i.account_id,
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.title')) AS patient_title,
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.first')) AS patient_first,
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.last')) AS patient_last,
        JSON_UNQUOTE(JSON_EXTRACT(i.patient_snapshot, '$.patient.id_nr')) AS patient_id_nr,
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.title')) AS member_title,
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.first')) AS member_first,
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.last')) AS member_last,
        JSON_UNQUOTE(JSON_EXTRACT(i.member_snapshot, '$.member.id_nr')) AS member_id_nr,
        CONCAT('R ', FORMAT(i.balance, 2)) AS invoice_balance,
        i.created_at,
        i.updated_at,
        CONCAT('Dr. ', LEFT(d.first, 1), '. ', d.last) AS doctor_name,
        d.practice_nr AS doctor_practice_number
      FROM invoices i
      LEFT JOIN accounts a ON i.account_id = a.account_id
      LEFT JOIN doctors d ON a.doctor_id = d.doctor_id;
    `;

    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }

      // Format and clean up patient and member data
      const formattedResults = results.map((invoice) => {
        const patientFull = `${invoice.patient_title} ${invoice.patient_first} ${invoice.patient_last}`;
        const memberFull = `${invoice.member_title} ${invoice.member_first} ${invoice.member_last}`;

        // Destructure to remove unwanted fields and add formatted ones
        const { 
          patient_title, patient_first, patient_last,
          member_title, member_first, member_last,
          ...rest
        } = invoice;

        return {
          ...rest,
          patient_full: patientFull,
          member_full: memberFull,
        };
      });

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
