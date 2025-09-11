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
  },

  createBatch: async (req, res) => {
    try {
      const newBatch = await Batch.create(req.body);
      res.status(201).json({ message: "Batch created successfully", batch: newBatch });
    } catch (err) {
      console.error("Error creating batch:", err);
      res.status(500).json({ error: "Failed to create batch" });
    }
  },
};

module.exports = batchController;
