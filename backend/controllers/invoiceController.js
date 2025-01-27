const { verifyToken } = require('../utils/jwt');
const Invoice = require('../models/invoiceModel');

const invoiceController = {
  getInvoices: (req, res) => {
    Invoice.allInvoices((err, invoices) => {
      if (err) {
        console.error('Error finding invoices:', err);
        return res.status(500).json({ message: 'Internal server error', error: err });
      }

      if (!invoices || invoices.length === 0) {
        console.log('No invoices found.');
        return res.status(404).json({ message: 'No invoices found' });
      }

      console.log("invoices Found: ", invoices);
      return res.status(200).json({
        message: 'invoices retrieval successful',
        invoices: invoices,
      });
    });
  },

  getInvoicesByClient: (req, res) => {
    const clientId = req.params.clientId;

    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    Invoice.clientInvoices(clientId, (err, invoices) => {
      if (err) {
        console.error('Error finding invoices:', err);
        return res.status(500).json({ message: 'Internal server error', error: err });
      }

      if (!invoices || invoices.length === 0) {
        console.log('No invoices found.');
        return res.status(404).json({ message: 'No invoices found' });
      }

      console.log("invoices Found: ", invoices);
      return res.status(200).json({
        message: 'invoices retrieval successful',
        invoices: invoices,
      });
    });
  },

  // Single invoice
  getInvoice: (req, res) => {
    const invoiceId = req.params.invoiceId;

    console.log('get request made for:', invoiceId);
    
    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }

    Invoice.oneInvoice(invoiceId, (err, invoice) => {
      if (err) {
        console.error('Error finding invoice:', err);
        return res.status(500).json({ message: 'Internal server error', error: err });
      }

      if (!invoice) {
        console.log('Invoice not found.');
        return res.status(404).json({ message: 'Invoice not found' });
      }

      console.log("Invoice Found: ", invoice);
      return res.status(200).json({
        message: 'Invoice retrieval successful',
        invoice: invoice,
      });
    });
  },
};

module.exports = invoiceController;
