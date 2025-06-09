const Record = require('../models/recordModel.js');

const recordController = {
  getRecords: async (req, res) => {
    try {
      const records = await Record.allRecords();
      if (!records || records.length === 0) {
        console.log('No records found.');
        return res.status(404).json({ message: 'No records found' });
      }

      console.log('Records Found:', records);
      return res.status(200).json({
        message: 'Records retrieval successful',
        records,
      });
    } catch (err) {
      console.error('Error finding records:', err);
      return res.status(500).json({ message: 'Internal server error', error: err });
    }
  },

  getRecord: async (req, res) => {
    const recordId = req.params.id;

    if (!recordId) {
      return res.status(400).json({ message: 'Record ID is required' });
    }

    try {
      const record = await Record.getRecordDetails(recordId);
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

module.exports = recordController;
