const db = require('../config/db');
const queries = require('./queries/clientQueries.js')

const Client = {
  invoices: async (clientId) => {
    try {
      const [results] = await db.query(queries.clientInvoices, [clientId]);
      // console.log(results)
      return results;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw new Error('Error fetching invoices');
    }
  },

  invoice: async (invoiceId, accountId) => {
    try {
      let invoiceResults;
      let newInvoiceId = null;
  
      if (accountId) {
        // Fetch account details
        const [accountResults] = await db.query(queries.accountByAccountId, [accountId]);
        if (!accountResults.length) return null;
  
        // Create a new invoice
        await db.query(queries.createNewInvoice, [accountId]);
        console.log('Invoice created.');
  
        // Retrieve the new invoice ID
        const newInvoiceResults = await db.query(queries.getNewInvoiceId);
        newInvoiceId = newInvoiceResults[0][0]?.invoice_id;
        console.log('New Invoice ID:', newInvoiceId);
  
        // Fetch the newly created invoice
        [invoiceResults] = await db.query(queries.accountByInvoiceId, [newInvoiceId]);
      } else {
        [invoiceResults] = await db.query(queries.accountByInvoiceId, [invoiceId]);
      }
  
      if (!invoiceResults.length) return null;
      const invoice = invoiceResults[0];
  
      // Fetch related records in parallel
      const queriesToRun = [
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
      ];
  
      const [
        memberResults, memberAddresses, memberContact, memberEmail,
        patientResults, patientAddresses, patientContact, patientEmail,
        clientResults, refClientResults, medicalResults,
      ] = await Promise.all(queriesToRun);
  
      return {
        invoiceId: newInvoiceId ?? invoiceId,
        invoice,
        member: memberResults[0] ? {
          // details: memberResults[0],
          ...memberResults[0][0],
          addresses: memberAddresses[0] || [],
          contactNumbers: memberContact[0] || [],
          emails: memberEmail[0] || [],
        } : null,
        patient: patientResults[0] ? {
          ...patientResults[0][0],
          // details: patientResults[0],
          addresses: patientAddresses[0] || [],
          contactNumbers: patientContact[0] || [],
          emails: patientEmail[0] || [],
        } : null,
        client: clientResults[0]?.[0] || null,
        refClient: refClientResults[0] || [],
        medical: medicalResults[0]?.[0] || null,
      };
    } catch (err) {
      console.error('Error fetching invoice:', err);
      throw new Error('Error fetching invoice');
    }
  },

  updateInvoice: async (updatedInvoice) => {
    console.log('updating....')
    // console.log('updatedInvoice', updatedInvoice)
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

  accounts: async (clientId) => {
    try {
      const [results] = await db.query(queries.clientAccounts, [clientId]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  account: async (accountId) => {
    try {
      const [accountResults] = await db.query(queries.clientAccount, [accountId]);
      if (!accountResults.length) return null;

      const account = accountResults[0];
      const [memberResults, patientResults, invoiceResults] = await Promise.all([
        db.query(queries.partialRecord, [account.main_member_id, accountId]),
        db.query(queries.partialRecord, [account.patient_id, accountId]),
        db.query(queries.inv, [accountId]),
      ]);

      return {
        invoices: invoiceResults[0],
        account: account,
        member: memberResults[0],
        patient: patientResults[0],
      };
    } catch (err) {
      throw err;
    }
  },

};

module.exports = Client;
