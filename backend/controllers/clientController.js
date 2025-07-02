const Client = require('../models/clientModel.js');
const Log = require('../models/logModel');

const clientController = {

  getClientInvoices: async (req, res) => {

    const clientId = req.params.clientId;
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    try {
      const invoices = await Client.clientInvoices(clientId);

      if (!invoices || invoices.length === 0) {
        // console.log('No invoices found.');
        return res.status(404).json({ message: 'No invoices found' });
      }

      // Format invoices
      const formattedInvoices = invoices.map((invoice) => ({
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

      // console.log("Invoices Found: ", formattedInvoices);
      return res.status(200).json({
        message: 'Invoices retrieval successful',
        invoices: formattedInvoices,
      });
    } catch (err) {
      console.error('Error finding invoices:', err);
      return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  },

  getClientInvoice: async (req, res) => {
    const { invoiceId, accountId } = req.params;

    if (!invoiceId && !accountId) {
      return res.status(400).json({ message: 'Invoice ID or Account ID is required' });
    }
  
    try {
      const invoiceData = await Client.oneInvoice(invoiceId || null, accountId || null);
  
      if (!invoiceData) {
        console.log('Invoice not found.');
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Log invoice created.
      if (accountId) {
        const userId = req.query.userId;
        if (userId) {
          Log.addLog(userId, 'create', 'invoices', invoiceData.invoiceId, '');
        }
      }
      
  
      return res.status(200).json({
        message: 'Invoice retrieval successful',
        invoice: {
          invoiceId: invoiceData.invoiceId,
          details: invoiceData.invoice,
          member: invoiceData.member || {},
          patient: invoiceData.patient || {},
          client: invoiceData.client || {},
          refClient: invoiceData.refClient || [],
          medical: invoiceData.medical || {},
        },
      });
  
    } catch (err) {
      console.error('Error finding invoice:', err);
      return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  },

  updateInvoice: async (req, res) => {
    const updatedInvoice = req.body;

    // Account id for invoice to be related to
    if (!updatedInvoice.invoice_id) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }
    try {
      const response = await Client.updateInvoice(updatedInvoice);

      if (!response) {
        return res.status(404).json({ message: 'Invoice not updated.' });
      }

      return res.status(201).json({
        message: response,
      });
    } catch (err) {
      console.error('Error updating invoice:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },

    // Get accounts by client ID
  getClientAccounts: async (req, res) => {
    const clientId = req.params.clientId;

    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    try {
      const accounts = await Client.clientAccounts(clientId);

      if (!accounts || accounts.length === 0) {
        console.log('No accounts found.');
        return res.status(404).json({ message: 'No accounts found' });
      }

      // console.log("Accounts Found: ", accounts);
      return res.status(200).json({
        message: 'Accounts retrieval successful',
        accounts: accounts,
      });
    } catch (err) {
      console.error('Error finding accounts:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },

  // Get partial account details
  getClientAccount: async (req, res) => {
    const accountId = req.params.accountId;

    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required' });
    }

    try {
      const account = await Client.partialAccount(accountId);

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      // console.log("Account Found: ", account);
      return res.status(200).json({
        message: 'Account retrieval successful',
        account: account,
      });
    } catch (err) {
      console.error('Error finding account:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },
};

module.exports = clientController;
