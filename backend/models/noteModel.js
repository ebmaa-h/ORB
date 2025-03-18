const db = require('../config/db');
const queries = require('./queries/noteQueries');

const Note = {
  fetchNotes: async (targetTable, targetId) => {
    try {
      const [results] = await db.query(queries.fetchNotes, [targetTable, targetId]);
      return results.length ? results : null;
    } catch (err) {
      throw err;
    }
  },

  createNote: async ({ target_table, target_id, user_id, note }) => {
    try {
      const [result] = await db.query(queries.insertNote, [target_table, target_id, user_id, note]);
      return { note_id: result.insertId, target_table, target_id, user_id, note, created_at: new Date() };
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Note;
