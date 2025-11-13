const db = require('../config/db');
const queries = require('./queries/noteQueries');

const Note = {
  listWorkflowNotes: async ({ department, batchType }) => {
    try {
      const [results] = await db.query(queries.FETCH_WORKFLOW_NOTES, [department, batchType]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  createWorkflowNote: async ({ department, batchType, userId, note, entityType = null, entityId = null }) => {
    try {
      const [insertResult] = await db.query(queries.INSERT_WORKFLOW_NOTE, [
        userId,
        department,
        batchType,
        entityType,
        entityId,
        note,
      ]);

      const [newNoteRows] = await db.query(queries.FETCH_NOTE_BY_ID, [insertResult.insertId]);
      return newNoteRows[0];
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Note;
