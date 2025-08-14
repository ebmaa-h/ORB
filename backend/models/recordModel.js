const db = require('../config/db');
const queries = require('./queries/recordQueries')

const Record = {
  listRecords: async () => {

    try {
      const [results] = await db.query(queries.allRecords);
      return results;
    } catch (err) {
      console.error('Error fetching records:', err);
      throw new Error('Error fetching records');
    }
  },

  getRecord: async (recordId) => {
    try {
      const [recordDetails] = await db.query(queries.recordDetails, [recordId]);
      if (!recordDetails.length) return null;

      const [addresses] = await db.query(queries.addresses, [recordId]);
      const [contactNumbers] = await db.query(queries.contactNumbers, [recordId]);
      const [emails] = await db.query(queries.emails, [recordId]);
      const [accounts] = await db.query(queries.accounts, [recordId]);
      const [invoices] = await db.query(queries.invoices, [recordId]);

      return {
        record: recordDetails[0],
        addresses,
        contactNumbers,
        emails,
        accounts,
        invoices,
      };
    } catch (err) {
      console.error('Error fetching record details:', err);
      throw new Error('Error fetching record details');
    }
  },
};

module.exports = Record;
