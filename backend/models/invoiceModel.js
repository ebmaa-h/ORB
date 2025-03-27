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
        file_nr: invoice.file_nr,
        auth_nr: invoice.auth_nr,
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

  oneInvoice: async (invoiceId, accountId) => {

    try {
      let invoiceResults;
      let newInvoiceId;
      if (accountId) {
        const [accountResults] = await db.query(queries.accountByAccountId, [accountId]);
        console.log(accountResults);

         await db.query(queries.createNewInvoice, [accountId]);
         console.log('invoice created apparently')

         const newInvoiceResults = await db.query(queries.getNewInvoiceId);

         console.log('got invoice as', newInvoiceResults[0][0].invoice_id);
        newInvoiceId = newInvoiceResults[0][0].invoice_id;
         console.log('invoice as', newInvoiceId);

        [invoiceResults] = await db.query(queries.accountByInvoiceId, [newInvoiceId]);

      } else {
        [invoiceResults] = await db.query(queries.accountByInvoiceId, [invoiceId]);

      }
      
      if (!invoiceResults.length) return null;
      const invoice = invoiceResults[0];
      const [
        memberResults, 
        memberAddresses,
        memberContact,
        memberEmail,
        patientResults, 
        patientAddresses,
        patientContact,
        patientEmail,
        clientResults,
        refClientResults,
        medicalResults,

      ] = await Promise.all([
        
        db.query(queries.record, [invoice.main_member_id, invoice.account_id]),
        db.query(queries.addresses, [invoice.main_member_id]),
        db.query(queries.contactNumbers, [invoice.main_member_id]),
        db.query(queries.emails, [invoice.main_member_id]),

        db.query(queries.record, [invoice.patient_id, invoice.account_id]),
        db.query(queries.addresses, [invoice.patient_id]),
        db.query(queries.contactNumbers, [invoice.patient_id]),
        db.query(queries.emails, [invoice.patient_id]),

        db.query(queries.client, [invoice.client_id]),
        db.query(queries.refClient, [invoice.client_id]),
        db.query(queries.medical, [invoice.account_id]),
      ]);
      return {
        invoiceId: accountId ? newInvoiceId : null, 
        invoice,
        member: {
          ...memberResults[0],
          addresses: memberAddresses[0],
          contactNumbers: memberContact[0],
          emails: memberEmail[0],
        },
        patient: {
          ...patientResults[0],
          addresses: patientAddresses[0],
          contactNumbers: patientContact[0],
          emails: patientEmail[0],
        },
        // invoices: invoiceResults[0],
        client: clientResults[0][0],
        refClient: refClientResults[0],
        medical: medicalResults[0][0],
      };
    } catch (err) {
      throw err;
    }
  },

  createNewInvoice: async (accountId) => {

    try {
      const [invoiceResults] = await db.query(queries.accountByAccountId, [accountId]);
      
      if (!invoiceResults.length) return null;
      const invoice = invoiceResults[0];
      const [
        memberResults, 
        memberAddresses,
        memberContact,
        memberEmail,
        patientResults, 
        patientAddresses,
        patientContact,
        patientEmail,
        clientResults,
        refClientResults,
        medicalResults,

      ] = await Promise.all([
        
        db.query(queries.record, [invoice.main_member_id, invoice.account_id]),
        db.query(queries.addresses, [invoice.main_member_id]),
        db.query(queries.contactNumbers, [invoice.main_member_id]),
        db.query(queries.emails, [invoice.main_member_id]),

        db.query(queries.record, [invoice.patient_id, invoice.account_id]),
        db.query(queries.addresses, [invoice.patient_id]),
        db.query(queries.contactNumbers, [invoice.patient_id]),
        db.query(queries.emails, [invoice.patient_id]),

        db.query(queries.client, [invoice.client_id]),
        db.query(queries.refClient, [invoice.client_id]),
        db.query(queries.medical, [invoice.account_id]),
      ]);
      return {
        invoice,
        member: {
          ...memberResults[0],
          addresses: memberAddresses[0],
          contactNumbers: memberContact[0],
          emails: memberEmail[0],
        },
        patient: {
          ...patientResults[0],
          addresses: patientAddresses[0],
          contactNumbers: patientContact[0],
          emails: patientEmail[0],
        },
        // invoices: invoiceResults[0],
        client: clientResults[0][0],
        refClient: refClientResults[0],
        medical: medicalResults[0][0],
      };
    } catch (err) {
      throw err;
    }
  },





  updateInvoice: async (updatedInvoice) => {
    console.log('updating....')
    console.log('updatedInvoice', updatedInvoice)
    try {
      const [results] = await db.query(
        queries.updateInvoice, 
        [
          updatedInvoice.date_of_service,
          updatedInvoice.status,
          updatedInvoice.ref_client_id,
          updatedInvoice.file_nr,
          updatedInvoice.auth_nr,
          updatedInvoice.invoice_id
        ]
      );
      return results;
    } catch (err) {
      console.error("Error creating new invoice:", err);
      throw new Error("Error creating new invoice");
    }
  },

};

module.exports = Invoice;
