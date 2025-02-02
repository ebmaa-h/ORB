const db = require('../config/db');
const queries = require('./queries/recordQueries')

const Record = {
  // Retrieve all records
  allRecords: async () => {

    try {
      const [results] = await db.query(queries.allRecords);
      return results;
    } catch (err) {
      console.error('Error fetching records:', err);
      throw new Error('Error fetching records');
    }
  },

  getRecordDetails: async (recordId) => {

    try {
      const [recordDetails] = await db.query(queries.recordDetailsQuery, [recordId]);
      if (!recordDetails.length) return null;

      const [addresses] = await db.query(queries.addressesQuery, [recordId]);
      const [contactNumbers] = await db.query(queries.contactNumbersQuery, [recordId]);
      const [emails] = await db.query(queries.emailsQuery, [recordId]);
      const [accounts] = await db.query(queries.accountsQuery, [recordId]);
      const [invoices] = await db.query(queries.invoicesQuery, [recordId]);

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
