// batchModel.js
const db = require('../config/db');
const queries = require('./queries/batchQueries');

const Batch = {
  getReceptionBatches: async () => {
    const [normalResults] = await db.query(queries.GET_RECEPTION_BATCHES);
    const [foreignUrgentResults] = await db.query(queries.GET_RECEPTION_FOREIGN_URGENT_BATCHES);
    // const merged = [...normalResults, ...foreignUrgentResults].sort((a, b) => {
    //   return new Date(b.date_received || b.created_at) - new Date(a.date_received || a.created_at);
    // });
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

    return { batch_id: result.insertId, ...data, current_department: 'reception', status: 'current', };
  },

  createForeignUrgent: async (data) => {
    const { batch_id, patient_name, medical_aid_nr } = data;

    const [result] = await db.query(queries.CREATE_FOREIGN_URGENT, [
      batch_id,
      patient_name,
      medical_aid_nr,
    ]);

    return { 
      foreign_urgent_batch_id: result.insertId, 
      batch_id, 
      patient_name, 
      medical_aid_nr, 
      current_department: 'reception',
      status: 'current',
    };
  },
};

module.exports = Batch;