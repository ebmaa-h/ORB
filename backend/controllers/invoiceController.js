const Invoice = require('../models/invoiceModel');

const invoiceController = {
  getInvoices: async (req, res) => {
    try {
      const invoices = await Invoice.allInvoices();

      if (!invoices || invoices.length === 0) {
        console.log('No invoices found.');
        return res.status(404).json({ message: 'No invoices found' });
      }

      console.log("Invoices Found: ", invoices);
      return res.status(200).json({
        message: 'Invoices retrieval successful',
        invoices: invoices,
      });
    } catch (err) {
      console.error('Error finding invoices:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },


  getInvoicesByClient: async (req, res) => {
    const clientId = req.params.clientId;

    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    try {
      const invoices = await Invoice.clientInvoices(clientId);

      if (!invoices || invoices.length === 0) {
        console.log('No invoices found.');
        return res.status(404).json({ message: 'No invoices found' });
      }

      console.log("Invoices Found: ", invoices);
      return res.status(200).json({
        message: 'Invoices retrieval successful',
        invoices: invoices,
      });
    } catch (err) {
      console.error('Error finding invoices:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },
  getInvoice: async (req, res) => {
    const invoiceId = req.params.invoiceId;
    const accountId = req.params.accountId;
  
    if (!invoiceId && !accountId) {
      return res.status(400).json({ message: 'ID is required' });
    }
  
    try {
      const invoice = await Invoice.oneInvoice(invoiceId ? invoiceId : null, invoiceId ? null : accountId);
  
      if (!invoice) {
        console.log('Invoice not found.');
        return res.status(404).json({ message: 'Invoice not found' });
      }
  
      console.log("Invoice Found: ", invoice);
      return res.status(200).json({
        message: 'Invoice retrieval successful',
        invoice: invoice,
      });
    } catch (err) {
      console.error('Error finding invoice:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },

  createNewInvoice: async (req, res) => {
    const accountId = req.params.accountId;
    console.log("accountId", accountId)
    // Account id for invoice to be related to
    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required' });
    }

    try {
      const newInvoice = await Invoice.oneInvoice(accountId);

      if (!newInvoice) {
        return res.status(404).json({ message: 'Invoice not created.' });
      }

      return res.status(201).json({
        message: createdInvoice,
      });
    } catch (err) {
      console.error('Error creating invoice:', err);
      return res.status(500).json({ 
        message: 'Invoice creation successful',
        invoice: newInvoice,
       });
    }
  },

  updateInvoice: async (req, res) => {
    const updatedInvoice = req.body;

    // Account id for invoice to be related to
    if (!updatedInvoice.invoice_id) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }
    try {
      const response = await Invoice.updateInvoice(updatedInvoice);

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
};

module.exports = invoiceController;
