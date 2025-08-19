// batchModel.js
const db = require('../config/db');
const queries = require('./queries/batchQueries.js');

const Batch = {
  getAll: async () => {
    try {
      const [results] = await db.query(queries.GET_ALL_BATCHES);
      return results;
    } catch (err) {
      console.error('Error fetching batches:', err);
      throw new Error('Internal Server Error');
    }
  },
};

module.exports = Batch;
