const { verifyToken } = require('../utils/jwt');
const Profile = require('../models/profileModel');

const profilesController = {
  getProfiles: (req, res) => {
    Profile.allProfiles((err, profiles) => {
      if (err) {
        console.error('Error finding profiles:', err);
        return res.status(500).json({ message: 'Internal server error', error: err });
      }

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found.');
        return res.status(404).json({ message: 'No profiles found' });
      }

      console.log("profiles Found: ", profiles);
      return res.status(200).json({
        message: 'profiles retrieval successful',
        profiles: profiles,
      });
    });
  },

  getProfile: (req, res) => {
    const profileId = req.params.profileId;
    // console.log(req.params)

    if (!profileId) {
      return res.status(400).json({ message: 'Profile ID is required' });
    }

    Profile.oneProfile(profileId, (err, profile) => {
      if (err) {
        console.error('Error finding profile:', err);
        return res.status(500).json({ message: 'Internal server error', error: err });
      }

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      console.log("Profile Found: ", profile);
      return res.status(200).json({
        message: 'Profile retrieval successful',
        profile: profile,
      });
    });
  },
};

module.exports = profilesController;
