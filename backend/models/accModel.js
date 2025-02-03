const db = require('../config/db');
const queries = require('./queries/accQueries');

const Account = {
  allAccounts: async () => {
    try {
      const [results] = await db.query(queries.allAccounts);
      return results;
    } catch (err) {
      throw err;
    }
  },

  clientAccounts: async (clientId) => {
    try {
      const [results] = await db.query(queries.clientAccounts, [clientId]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  partialAccount: async (accountId) => {
    try {
      const [accountResults] = await db.query(queries.partialAccount, [accountId]);
      if (!accountResults.length) return null;

      const account = accountResults[0];
      const [memberResults, patientResults, invoiceResults] = await Promise.all([
        db.query(queries.record, [account.main_member_id, accountId]),
        db.query(queries.record, [account.patient_id, accountId]),
        db.query(queries.inv, [accountId]),
      ]);

      return {
        invoices: invoiceResults[0],
        account: account,
        member: memberResults[0],
        patient: patientResults[0],
      };
    } catch (err) {
      throw err;
    }
  },

  account: async (accountId) => {
    try {
      const [accountResults] = await db.query(queries.acc, [accountId]);
      if (!accountResults.length) return null;

      const account = accountResults[0];
      const [memberResults, patientResults, invoiceResults] = await Promise.all([
        db.query(queries.record, [account.main_member_id]),
        db.query(queries.record, [account.patient_id]),
        db.query(queries.inv, [accountId]),
      ]);

      return {
        ...account,
        member: memberResults[0],
        patient: patientResults[0],
        invoices: invoiceResults[0],
      };
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Account;
