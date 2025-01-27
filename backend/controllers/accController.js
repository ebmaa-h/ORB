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

  getAccountsByClient: (req, res) => {
    const clientId = req.params.clientId;

    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }


    Account.clientAccounts(clientId, (err, accounts) => {
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

  getAccount: (req, res) => {
    const accountId = req.params.id;

    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required' });
    }

    Account.oneAccount(accountId, (err, account) => {
      if (err) {
        console.error('Error finding account:', err);
        return res.status(500).json({ message: 'Internal server error', error: err });
      }

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      console.log("Account Found: ", account);
      return res.status(200).json({
        message: 'Account retrieval successful',
        account: account,
      });
    });
  },
};

module.exports = accController;
