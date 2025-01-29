const Account = require('../models/accModel');

const accController = {
  // Get all accounts
  getAccounts: async (req, res) => {
    try {
      const accounts = await Account.allAccounts();
      
      if (!accounts || accounts.length === 0) {
        console.log('No accounts found.');
        return res.status(404).json({ message: 'No accounts found' });
      }

      console.log("Accounts Found: ", accounts);
      return res.status(200).json({
        message: 'Accounts retrieval successful',
        accounts: accounts,
      });
    } catch (err) {
      console.error('Error finding accounts:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },

  // Get accounts by client ID
  getAccountsByClient: async (req, res) => {
    const clientId = req.params.clientId;

    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    try {
      const accounts = await Account.clientAccounts(clientId);

      if (!accounts || accounts.length === 0) {
        console.log('No accounts found.');
        return res.status(404).json({ message: 'No accounts found' });
      }

      console.log("Accounts Found: ", accounts);
      return res.status(200).json({
        message: 'Accounts retrieval successful',
        accounts: accounts,
      });
    } catch (err) {
      console.error('Error finding accounts:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },

  // Get partial account details
  getPartialAccount: async (req, res) => {
    const accountId = req.params.accountId;

    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required' });
    }

    try {
      const account = await Account.partialAccount(accountId);

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      console.log("Account Found: ", account);
      return res.status(200).json({
        message: 'Account retrieval successful',
        account: account,
      });
    } catch (err) {
      console.error('Error finding account:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },

  // Get full account details
  getAccount: async (req, res) => {
    const accountId = req.params.accountId;

    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required' });
    }

    try {
      const account = await Account.account(accountId);

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      console.log("Account Found: ", account);
      return res.status(200).json({
        message: 'Account retrieval successful',
        account: account,
      });
    } catch (err) {
      console.error('Error finding account:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },
};

module.exports = accController;
