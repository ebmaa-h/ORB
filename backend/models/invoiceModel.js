const db = require('../config/db');
const queries = require('./queries/invoiceQueries')

const Invoice = {
  // Retrieve all invoices
 allInvoices: async () => {

  try {
    const [results] = await db.query(queries.allInvoices);
    return results.map((invoice) => ({
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
  } catch (err) {
    console.error('Error fetching all invoices:', err);
    throw new Error('Error fetching all invoices');
  }
},

  clientInvoices: async (clientId) => {
    try {
      const [results] = await db.query(queries.clientInvoices, [clientId]);

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

    try {
      // Perform all queries concurrently using Promise.all
      const [invoiceDetailsResults, patientDetailsResults, memberDetailsResults, clientDetailsResults, medicalAidDetailsResults] = await Promise.all([
        db.query(queries.invoiceDetailsQuery, [invoiceId]),
        db.query(queries.patientDetailsQuery, [invoiceId]),
        db.query(queries.memberDetailsQuery, [invoiceId]),
        db.query(queries.clientDetailsQuery, [invoiceId]),
        db.query(queries.medicalAidDetailsQuery, [invoiceId]),
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
