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

  getInvoice: (req, res) => {
  // 
  },
};

module.exports = invoiceController;
