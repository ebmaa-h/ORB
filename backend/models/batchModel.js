const db = require('../config/db');
const queries = require('./queries/batchQueries');

const Batch = {
  getReceptionBatches: async () => {
    // two queries at once
    const [normalResults] = await db.query(queries.GET_RECEPTION_BATCHES);

    const [foreignUrgentResults] = await db.query(queries.GET_RECEPTION_FOREIGN_URGENT_BATCHES);

    // merge both lists and sort again by date
    const merged = [...normalResults, ...foreignUrgentResults].sort((a, b) => {
      return new Date(b.date_received) - new Date(a.date_received);
    });

    return merged;
  },


  getBillingBatches: async () => {
    const [results] = await db.query(queries.GET_BILLING_BATCHES);
    return results;
  },

  create: async (data) => {
    const {
      created_by,
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
      created_by,
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
