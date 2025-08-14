const express = require('express');
const cc = require('../controllers/clientController.js');
const router = express.Router();
const { accessGuard } = require('../utils/accessGuard.js');
const { clientAccessGuard } = require('../utils/clientAccessGuard.js');

// Get all client invoices
router.get('/:clientId/invoices',clientAccessGuard,accessGuard('invoices'), cc.listInvoices);

// Get single invoice
router.get('/:clientId/invoices/:invoiceId', clientAccessGuard, accessGuard('invoices'), cc.viewInvoice);

// Update a invoice
router.patch('/:clientId/invoices/:invoiceId',clientAccessGuard,accessGuard('invoice-update'), cc.updateInvoice);

// Create new invoice
router.put('/:clientId/accounts/:accountId/invoices', clientAccessGuard, accessGuard('invoice-create'), cc.createInvoice);

// Get all client accounts
router.get('/:clientId/accounts',clientAccessGuard,accessGuard('accounts'), cc.listAccounts);

// Get single account
router.get('/:clientId/accounts/:accountId',clientAccessGuard,accessGuard('accounts'), cc.viewAccount);

module.exports = router;