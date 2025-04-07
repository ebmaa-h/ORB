const db = require('../config/db');
const queries = require('./queries/logQueries');

const Log = {
  addLog: async (userId, action, table, id, changes) => {
    const values = [
      userId,
      action,
      table,
      id,
      JSON.stringify(changes || {})
    ];

    await db.query(queries.insertLog, values);
  },

  getLogs: async (targetTable, targetId) => {
    const [rows] = await db.query(queries.getLogs, [targetTable, targetId]);
    return rows;
  }
  
};

module.exports = Log;
