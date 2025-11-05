const db = require('../config/db');
const queries = require('./queries/logQueries');

const Log = {
  createWorkflowLog: async ({
    userId = null,
    department,
    batchType,
    entityType = null,
    entityId = null,
    action,
    message = null,
    metadata = null,
  }) => {
    const values = [
      userId,
      department,
      batchType,
      entityType,
      entityId,
      action,
      message,
      metadata ? JSON.stringify(metadata) : null,
    ];

    const [insertResult] = await db.query(queries.INSERT_WORKFLOW_LOG, values);
    const [rows] = await db.query(queries.GET_WORKFLOW_LOG_BY_ID, [insertResult.insertId]);
    return rows[0];
  },

  listWorkflowLogs: async ({ department, batchType }) => {
    const [rows] = await db.query(queries.GET_WORKFLOW_LOGS, [department, batchType]);
    return rows;
  },
};

module.exports = Log;
