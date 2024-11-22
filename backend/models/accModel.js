const db = require('../config/db');

const Account = {
  // Get all accounts
  allAccounts: (callback) => {
    const query = `SELECT * FROM accounts`;
    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  },
};

module.exports = Account;
