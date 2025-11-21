const express = require('express');
const accountController = require('../controllers/accountController');

const router = express.Router();

router.get('/search', accountController.searchProfiles);
router.get('/catalog/medical-aids', accountController.getMedicalAidCatalog);
router.post('/profiles', accountController.createProfile);
router.post('/profiles/:profileId/persons', accountController.createProfilePerson);
router.put('/profiles/:profileId/persons/:recordId', accountController.updateProfilePerson);

module.exports = router;
