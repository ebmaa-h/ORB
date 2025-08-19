// batchController.js
const Batch = require('../models/batchModel.js');

const batchController = {
  batches: async (req, res) => {
    try {
      const results = await Batch.getAll();
      res.json(results);
    } catch (err) {
      console.error("Error fetching batches:", err);
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  }
};

module.exports = batchController;
