const { verifyToken } = require('../utils/jwt');
const Person = require('../models/personModel');

const personController = {
  getPersons: (req, res) => {
    Person.allPersons((err, persons) => {
      if (err) {
        console.error('Error finding persons:', err);
        return res.status(500).json({ message: 'Internal server error', error: err });
      }

      if (!persons || persons.length === 0) {
        console.log('No persons found.');
        return res.status(404).json({ message: 'No persons found' });
      }

      console.log("persons Found: ", persons);
      return res.status(200).json({
        message: 'persons retrieval successful',
        persons: persons,
      });
    });
  },

  getPerson: (req, res) => {
  // 
  },
};

module.exports = personController;
