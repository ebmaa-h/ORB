const db = require('../config/db');
const queries = require('./queries/profileQueries');


const Profile = {
  listProfiles: async () => {
      try {
        const [results] = await db.query(queries.allProfiles);
        return results;
      } catch (err) {
        throw err;
      }
    },

  getProfile: async (profileId) => {
    try {
      const [dependentsResults] = await db.query(queries.dependents, [profileId]);
      const [accountsResults] = await db.query(queries.acc, [profileId]);
      const [invoicesResults] = await db.query(queries.inv, [profileId]);
      const [profileResults] = await db.query(queries.prof, [profileId]);

      return {
        dependents: dependentsResults.length > 0 ? dependentsResults : [],
        accounts: accountsResults,
        invoices: invoicesResults,
        profileData: profileResults[0],
      };
    } catch (err) {
      throw err;
    }
  },

};


module.exports = Profile;
