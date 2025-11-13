const Invoice = require('../models/invoiceModel');

const toPositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const invoiceController = {
  getBatchInvoices: async (req, res) => {
    try {
      const batchId = toPositiveInt(req.params.batchId);
      if (!batchId) {
        return res.status(400).json({ error: 'Invalid batch id' });
      }

      const invoices = await Invoice.getByBatchId(batchId);
      res.json({
        batchId,
        count: invoices.length,
        invoices,
      });
    } catch (err) {
      console.error('Error fetching batch invoices:', err);
      res.status(500).json({ error: 'Failed to fetch batch invoices' });
    }
  },
};

module.exports = invoiceController;
