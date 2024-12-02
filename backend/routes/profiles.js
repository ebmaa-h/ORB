const express = require('express');
const profController = require('../controllers/profilesController');
const router = express.Router();

router.get('/', profController.getProfiles); // Get all profiles
router.get('/:profileId', profController.getProfile); // Get a profile by id
// router.get('/:id', accController.getAccount); // Get one account by ID



module.exports = router;