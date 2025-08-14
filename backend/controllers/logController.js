const Log = require('../models/logModel');

const logController = {
  createLog: async (req, res) => {
    try {
      const { userId, action, table, id, changes } = req.body;

      if (!userId || !action || !table || !id || !changes) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      await Log.addLog(userId, action, table, id, changes);
      console.log('Log added successfully');
      res.status(201).json({ message: 'Log added successfully' });
    } catch (error) {
      console.error('Error adding log:', error);
      res.status(500).json({ message: 'Failed to add log' });
    }
  },
  
  listLogs: async (req, res) => {
    try {
      const { targetTable, targetId } = req.params;
  
      if (!targetTable || !targetId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }
  
      const logs = await Log.listLogs(targetTable, targetId);
      res.status(200).json(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ message: 'Failed to fetch logs' });
    }
  }
  
};

module.exports = logController;
