const express = require('express');
const cc = require('../controllers/clientController.js');
const router = express.Router();
// const { authGuard } = require('../utils/authGuard.js');

// Invoices
router.get('/:clientId/invoices', cc.getClientInvoices);
router.get('/:clientId/invoices/:invoiceId', cc.getClientInvoice);
router.patch('/:clientId/invoices/:invoiceId', cc.updateInvoice);
router.put('/:clientId/accounts/:accountId/invoices', cc.getClientInvoice);

// Accounts
router.get('/:clientId/accounts', cc.getClientAccounts);
router.get('/:clientId/accounts/:accountId', cc.getClientAccount);

module.exports = router;