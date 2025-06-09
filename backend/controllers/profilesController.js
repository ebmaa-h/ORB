const Profile = require('../models/profileModel');

const profileController = {
  getProfiles: async (req, res) => {
    try {
      const profiles = await Profile.allProfiles();
      if (!profiles || profiles.length === 0) {
        console.log('No profiles found.');
        return res.status(404).json({ message: 'No profiles found' });
      }

      console.log('Profiles Found:', profiles);
      return res.status(200).json({
        message: 'Profiles retrieval successful',
        profiles,
      });
    } catch (err) {
      console.error('Error finding profiles:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },

  getProfile: async (req, res) => {
    const profileId = req.params.profileId;

    if (!profileId) {
      return res.status(400).json({ message: 'Profile ID is required' });
    }

    try {
      const profileData = await Profile.oneProfile(profileId);
      if (!profileData) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      console.log('Profile Found:', profileData);
      return res.status(200).json({
        message: 'Profile retrieval successful',
        profileData,
      });
    } catch (err) {
      console.error('Error finding profile:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },
};

module.exports = profileController;
