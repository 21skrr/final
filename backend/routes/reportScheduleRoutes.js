const express = require('express');
const router = express.Router();
const reportScheduleController = require('../controllers/reportScheduleController');

// POST /api/reports/schedule - Create a new report schedule
router.post('/schedule', reportScheduleController.createReportSchedule);

// PUT /api/reports/schedule/:id - Update a report schedule
router.put('/schedule/:id', reportScheduleController.updateReportSchedule);

// DELETE /api/reports/schedule/:id - Delete a report schedule
router.delete('/schedule/:id', reportScheduleController.deleteReportSchedule);

module.exports = router; 