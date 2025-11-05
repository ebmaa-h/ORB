const express = require('express');
const workflowController = require('../controllers/workflowController.js');

const router = express.Router();

router.get('/:department/:batchType/notes', workflowController.getWorkflowNotes);
router.post('/:department/:batchType/notes', workflowController.addWorkflowNote);
router.get('/:department/:batchType/logs', workflowController.getWorkflowLogs);

module.exports = router;
