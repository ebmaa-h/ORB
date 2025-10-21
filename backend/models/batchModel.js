const db = require('../config/db');
const queries = require('./queries/batchQueries');

const Batch = {
  getReceptionBatches: async () => {
    const [normalResults] = await db.query(queries.GET_RECEPTION_BATCHES);
    const [foreignUrgentResults] = await db.query(queries.GET_RECEPTION_FOREIGN_URGENT_BATCHES);
    return {
      normal: normalResults,
      foreignUrgent: foreignUrgentResults,
    };
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

    const is_pure_foreign_urgent = Number(batch_size) === Number(total_urgent_foreign || 0);

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
      is_pure_foreign_urgent,
    ]);

    return { 
      batch_id: result.insertId, 
      ...data, 
      current_department: 'reception', 
      status: 'current',
      is_pure_foreign_urgent,
    };
  },

  createForeignUrgent: async (data) => {
    const { batch_id, patient_name, medical_aid_nr } = data;

    const [result] = await db.query(queries.CREATE_FOREIGN_URGENT, [
      batch_id,
      patient_name,
      medical_aid_nr,
    ]);

    return { 
      batch_id: result.insertId, 
      parent_batch_id: batch_id, 
      patient_name, 
      medical_aid_nr, 
      current_department: 'reception',
      status: 'current',
    };
  },
};

module.exports = Batch;