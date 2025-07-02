const express = require('express');
const profController = require('../controllers/profilesController');
const router = express.Router();
const { accessGuard } = require('../utils/accessGuard.js');

router.get('/',accessGuard('profiles'), profController.getProfiles); // Get all profiles
router.get('/:profileId',accessGuard('profiles'), profController.getProfile); // Get a profile by id
// router.get('/:id', accController.getAccount); // Get one account by ID



module.exports = router;