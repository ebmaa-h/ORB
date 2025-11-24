const Invoice = require('../models/invoiceModel');
const Batch = require('../models/batchModel');

const toPositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const normalizeBooleanFlag = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', ''].includes(normalized)) return false;
  }
  return null;
};

const invoiceController = {
  getBatchInvoices: async (req, res) => {
    try {
      const batchId = toPositiveInt(req.params.batchId);
      if (!batchId) {
        return res.status(400).json({ error: 'Invalid batch id' });
      }

      const requestIsFu = normalizeBooleanFlag(req.query?.is_fu);
      let fu = null;
      let invoices = [];

      if (requestIsFu === true) {
        fu = await Batch.getForeignUrgentById(batchId);
        invoices = fu ? await Invoice.getByForeignUrgentId(batchId) : [];
      } else if (requestIsFu === false) {
        invoices = await Invoice.getByBatchId(batchId);
      } else {
        fu = await Batch.getForeignUrgentById(batchId);
        invoices = fu
          ? await Invoice.getByForeignUrgentId(batchId)
          : await Invoice.getByBatchId(batchId);
      }

      res.json({
        batchId,
        is_foreign_urgent: Boolean(fu),
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
