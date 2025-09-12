// batchModel.js
const db = require('../config/db');
const queries = require('./queries/batchQueries.js');

const Batch = {
  getAll: async () => {
    try {
      const [results] = await db.query(queries.GET_ALL_BATCHES);
      return results;
    } catch (err) {
      console.error('Error fetching batches:', err);
      throw new Error('Internal Server Error');
    }
  },

  receptionBatches: async () => {
    try {
      const [results] = await db.query(queries.GET_RECEPTION_BATCHES);
      return results;
    } catch (err) {
      console.error('Error fetching batches:', err);
      throw new Error('Internal Server Error');
    }
  },

  create: async (data) => {
    try {
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
    } catch (err) {
      console.error('Error creating batch:', err);
      throw new Error('Internal Server Error');
    }
  },
};

module.exports = Batch;
