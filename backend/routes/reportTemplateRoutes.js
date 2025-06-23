const express = require('express');
const router = express.Router();
const reportTemplateController = require('../controllers/reportTemplateController');

// GET /api/reports/templates - Get all report templates with export options
router.get('/templates', reportTemplateController.getReportTemplates);

// POST /api/reports/templates - Create a new report template
router.post('/templates', reportTemplateController.createReportTemplate);

// PUT /api/reports/templates/:id - Update a report template
router.put('/templates/:id', reportTemplateController.updateReportTemplate);

// DELETE /api/reports/templates/:id - Delete a report template
router.delete('/templates/:id', reportTemplateController.deleteReportTemplate);

module.exports = router; 