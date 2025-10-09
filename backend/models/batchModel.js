const db = require('../config/db');
const queries = require('./queries/batchQueries');

const Batch = {
  getReceptionBatches: async () => {
    const [results] = await db.query(queries.GET_RECEPTION_BATCHES);
    return results;
  },

  getBillingBatches: async () => {
    const [results] = await db.query(queries.GET_BILLING_BATCHES);
    return results;
  },

  create: async (data) => {
    const {
      pending,
      status,
      created_by,
      admitted_by,
      billed_by,
      batch_size,
      client_id,
      date_received,
      method_received,
      bank_statements,
      added_on_drive,
      total_urgent_foreign,
      cc_availability,
      corrections,
    } = data;

    const [result] = await db.query(queries.CREATE_BATCH, [
      pending,
      status,
      created_by,
      admitted_by,
      billed_by,
      batch_size,
      client_id,
      date_received,
      method_received,
      bank_statements,
      added_on_drive,
      total_urgent_foreign,
      cc_availability,
      corrections,
    ]);

    return { batch_id: result.insertId, ...data };
  },
};

module.exports = Batch;
