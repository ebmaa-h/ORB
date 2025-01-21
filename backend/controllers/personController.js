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
    const recordId = req.params.id;

    if (!recordId) {
      return res.status(400).json({ message: 'Record ID is required' });
    }

    Person.getPersonDetails(recordId, (err, record) => {
      if (err) {
        console.error('Error finding record:', err);
        return res.status(500).json({ message: 'Internal server error', error: err });
      }

      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }

      console.log("Record Found: ", record);
      return res.status(200).json({
        message: 'Record retrieval successful',
        record: record,
      });
    });
  },
};

module.exports = personController;
