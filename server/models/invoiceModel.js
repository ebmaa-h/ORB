const db = require('../config/db');
const queries = require('./queries/invoiceQueries');

const Invoice = {
  getByBatchId: async (batchId) => {
    const [rows] = await db.query(queries.SELECT_INVOICES_BY_BATCH, [batchId]);
    return rows;
  },

  getByForeignUrgentId: async (fuId) => {
    const [rows] = await db.query(queries.SELECT_INVOICES_BY_FU, [fuId]);
    return rows;
  },

  getById: async (invoiceId) => {
    const [rows] = await db.query(queries.SELECT_INVOICE_BY_ID, [invoiceId]);
    return rows[0] || null;
  },
};

module.exports = Invoice;
