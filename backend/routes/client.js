const express = require('express');
const cc = require('../controllers/clientController.js');
const router = express.Router();
const { accessGuard } = require('../utils/accessGuard.js');

// Invoices
router.get('/:clientId/invoices',accessGuard('invoices'), cc.getClientInvoices); // All Client invoices
router.get('/:clientId/invoices/:invoiceId',accessGuard('invoices'), cc.getClientInvoice); // A single client invoice

router.patch('/:clientId/invoices/:invoiceId',accessGuard('invoice-update'), cc.updateInvoice); // Update a invoice
router.put('/:clientId/accounts/:accountId/invoices',accessGuard('invoice-new'), cc.getClientInvoice); // New invoice

// Accounts
router.get('/:clientId/accounts',accessGuard('accounts'), cc.getClientAccounts);
router.get('/:clientId/accounts/:accountId',accessGuard('accounts'), cc.getClientAccount);

module.exports = router;