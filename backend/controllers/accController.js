const Account = require('../models/accModel');

const accController = {
  getAccounts: (req, res) => {
    Account.allAccounts((err, accounts) => {
      if (err) {
        console.error('Error finding accounts:', err);
        return res.status(500).json({ message: 'Internal server error', error: err });
      }

      if (!accounts || accounts.length === 0) {
        console.log('No accounts found.');
        return res.status(404).json({ message: 'No accounts found' });
      }

      console.log("Accounts Found: ", accounts);
      return res.status(200).json({
        message: 'Accounts retrieval successful',
        accounts: accounts,
      });
    });
  },
};

module.exports = accController;
