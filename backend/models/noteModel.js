const db = require('../config/db');
const queries = require('./queries/noteQueries');

const Note = {
  fetchAccNotes: async (accountId) => {
    try {
      const [results] = await db.query(queries.fetchAccNotes, [accountId]);
      if (!results.length) return null;
      return results;
    } catch (err) {
      throw err;
    }
  },
  fetchInvoiceNotes: async (invoiceId) => {
    try {
      const [results] = await db.query(queries.fetchInvoiceNotes, [invoiceId]);
      if (!results.length) return null;
      return results;
    } catch (err) {
      throw err;
    }
  },

};

module.exports = Note;
