const express = require('express');
const cc = require('../controllers/clientController.js');
const router = express.Router();
const { accessGuard } = require('../utils/accessGuard.js');
const { clientAccessGuard } = require('../utils/clientAccessGuard.js');

// Invoices
router.get('/:clientId/invoices',clientAccessGuard,accessGuard('invoices'), cc.getClientInvoices); // All Client invoices
router.get('/:clientId/invoices/:invoiceId',clientAccessGuard,accessGuard('invoices'), cc.getClientInvoice); // A single client invoice

router.patch('/:clientId/invoices/:invoiceId',clientAccessGuard,accessGuard('invoice-update'), cc.updateInvoice); // Update a invoice
router.put('/:clientId/accounts/:accountId/invoices',clientAccessGuard,accessGuard('invoice-new'), cc.getClientInvoice); // New invoice

// Accounts
router.get('/:clientId/accounts',clientAccessGuard,accessGuard('accounts'), cc.getClientAccounts);
router.get('/:clientId/accounts/:accountId',clientAccessGuard,accessGuard('accounts'), cc.getClientAccount);

module.exports = router;