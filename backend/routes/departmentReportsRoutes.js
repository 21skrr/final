// routes/departmentReportsRoutes.js

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // Assuming auth middleware is available
const departmentReportsController = require('../controllers/departmentReportsController');

// Department Reports Endpoints (require authentication and appropriate role check)
router.post('/schedule/department', auth, departmentReportsController.scheduleDepartmentReport);
router.get('/export/department', auth, departmentReportsController.exportDepartmentReport);

module.exports = router; 