const db = require('../config/db');
const queries = require('./queries/batchQueries');

const Batch = {
  getDepartmentBatches: async (department) => {
    const [mainNormal] = await db.query(queries.WF_SELECT_BATCHES_MAIN_BY_DEPT, [department]);
    const [mainFU] = await db.query(queries.WF_SELECT_FU_MAIN_BY_DEPT, [department]);

    const [outboxNormal] = await db.query(queries.WF_SELECT_BATCHES_OUTBOX_BY_DEPT, [department]);
    const [outboxFU] = await db.query(queries.WF_SELECT_FU_OUTBOX_BY_DEPT, [department]);

    return {
      normal: [...mainNormal, ...outboxNormal],
      foreignUrgent: [...mainFU, ...outboxFU],
    };
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

  updateReceptionFields: async ({
    batch_id,
    batch_size,
    client_id,
    date_received,
    method_received,
    bank_statements,
    added_on_drive,
    corrections,
    cc_availability,
    is_pure_foreign_urgent,
  }) => {
    await db.query(queries.UPDATE_BATCH_RECEPTION_FIELDS, [
      batch_size,
      client_id,
      date_received,
      method_received,
      bank_statements,
      added_on_drive,
      corrections,
      cc_availability,
      is_pure_foreign_urgent,
      batch_id,
    ]);
  },

  getBatchById: async (batch_id) => {
    const [rows] = await db.query(queries.GET_BATCH_BY_ID, [batch_id]);
    return rows[0] || null;
  },

  getForeignUrgentById: async (batch_id) => {
    const [rows] = await db.query(queries.GET_FU_BY_ID, [batch_id]);
    return rows[0] || null;
  },

  

  

  

  

  

  

  

  // workflows helpers
  upsertWorkflowMain: async ({ entity_type, entity_id, department, status, created_by = null }) => {
    await db.query(queries.WF_UPSERT_MAIN, [entity_type, entity_id, department, status, created_by]);
  },

  upsertWorkflowOutbox: async ({ entity_type, entity_id, department, created_by = null }) => {
    await db.query(queries.WF_UPSERT_OUTBOX, [entity_type, entity_id, department, created_by]);
  },

  deleteWorkflowOutbox: async ({ entity_type, entity_id }) => {
    await db.query(queries.WF_DELETE_OUTBOX, [entity_type, entity_id]);
  },

  deleteWorkflowMain: async ({ entity_type, entity_id }) => {
    await db.query(queries.WF_DELETE_MAIN, [entity_type, entity_id]);
  },

  archiveBatch: async ({ entity_id, filed_by = null }) => {
    await db.query(queries.ARCHIVE_BATCH, [filed_by, entity_id]);
  },

  archiveForeignUrgent: async ({ entity_id, filed_by = null }) => {
    await db.query(queries.ARCHIVE_FU, [filed_by, entity_id]);
  },

  listClients: async () => {
    const [rows] = await db.query(queries.LIST_CLIENTS_SUMMARY);
    return rows;
  },

  getWorkflowMainByEntity: async ({ entity_type, entity_id }) => {
    const [rows] = await db.query(queries.WF_GET_MAIN_BY_ENTITY, [entity_type, entity_id]);
    return rows[0] || null;
  },

  getWorkflowOutboxByEntity: async ({ entity_type, entity_id }) => {
    const [rows] = await db.query(queries.WF_GET_OUTBOX_BY_ENTITY, [entity_type, entity_id]);
    return rows[0] || null;
  },

  markAdmitted: async ({ entity_type, entity_id, user_id }) => {
    if (!user_id) return;
    if (entity_type === 'fu') {
      await db.query(queries.UPDATE_FU_ADMITTED_BY, [user_id, entity_id]);
    } else {
      await db.query(queries.UPDATE_BATCH_ADMITTED_BY, [user_id, entity_id]);
    }
  },

  markBilled: async ({ entity_type, entity_id, user_id }) => {
    if (!user_id) return;
    if (entity_type === 'fu') {
      await db.query(queries.UPDATE_FU_BILLED_BY, [user_id, entity_id]);
    } else {
      await db.query(queries.UPDATE_BATCH_BILLED_BY, [user_id, entity_id]);
    }
  },
};

module.exports = Batch;


