const express = require('express');
const accountController = require('../controllers/accountController');

const router = express.Router();

router.get('/search', accountController.searchProfiles);

module.exports = router;
