const db = require('../config/db');
const queries = require('./queries/noteQueries');

const Note = {
  fetchNotes: async (targetTable, targetId) => {
    try {
      const [results] = await db.query(queries.fetchNotes, [targetTable, targetId]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  createNote: async ({ target_table, target_id, user_id, note }) => {
    try {
      // Insert the note
      const [insertResult] = await db.query(queries.insertNote, [target_table, target_id, user_id, note]);

      // Retrieve the newly inserted note
      const [newNote] = await db.query(queries.fetchSingleNote, [insertResult.insertId]);

      return newNote[0]; // Return the first result (object)
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Note;
