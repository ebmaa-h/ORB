const express = require('express');
const accountController = require('../controllers/accountController');

const router = express.Router();

router.get('/search', accountController.searchProfiles);
router.get('/catalog/medical-aids', accountController.getMedicalAidCatalog);

module.exports = router;
