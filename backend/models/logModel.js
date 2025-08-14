const db = require('../config/db');
const queries = require('./queries/logQueries');

const Log = {
  createLog: async (userId, action, table, id, changes) => {
    const values = [
      userId,
      action,
      table,
      id,
      JSON.stringify(changes || {})
    ];

    await db.query(queries.insertLog, values);
  },

  listLogs: async (targetTable, targetId) => {
    const [rows] = await db.query(queries.getLogs, [targetTable, targetId]);
    return rows;
  }
  
};

module.exports = Log;
