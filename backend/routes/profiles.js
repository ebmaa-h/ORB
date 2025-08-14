const express = require('express');
const profController = require('../controllers/profilesController');
const router = express.Router();
const { accessGuard } = require('../utils/accessGuard.js');

// Get all profiles
router.get('/',accessGuard('profiles'), profController.listProfiles);

// Get single profile
router.get('/:profileId',accessGuard('profiles'), profController.viewProfile); 


module.exports = router;