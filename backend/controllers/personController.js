const { verifyToken } = require('../utils/jwt');
const Person = require('../models/personModel');

const personController = {
  getPersons: async (req, res) => {
    try {
      const persons = await Person.allPersons();
      if (!persons || persons.length === 0) {
        console.log('No persons found.');
        return res.status(404).json({ message: 'No persons found' });
      }

      console.log('Persons Found:', persons);
      return res.status(200).json({
        message: 'Persons retrieval successful',
        persons,
      });
    } catch (err) {
      console.error('Error finding persons:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },

  getPerson: async (req, res) => {
    const personId = req.params.id;

    if (!personId) {
      return res.status(400).json({ message: 'Record ID is required' });
    }

    try {
      const record = await Person.getPersonDetails(personId);
      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }

      console.log('Record Found:', record);
      return res.status(200).json({
        message: 'Record retrieval successful',
        record,
      });
    } catch (err) {
      console.error('Error finding record:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },
};

module.exports = personController;
