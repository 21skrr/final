const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");
const { auth, checkRole } = require("../middleware/auth");

// -------------------
// Employee Routes
// -------------------

// GET /api/resources/my-resources - Get all resources assigned to the current user
router.get('/my-resources', auth, checkRole('employee', 'supervisor', 'manager', 'hr'), resourceController.getAssignedResources);

// POST /api/resources/:id/download - Track a resource download
router.post('/:id/download', auth, checkRole('employee'), resourceController.trackResourceDownload);


// -------------------
// Supervisor Routes
// -------------------

// POST /api/resources/assign - Assign resources to employees
router.post('/assign', auth, checkRole('supervisor', 'hr'), resourceController.assignResources);

// GET /api/resources/usage - Get resources relevant to a specific employee
router.get('/usage', auth, checkRole('supervisor', 'manager'), resourceController.getEmployeeResources);


// -------------------
// Manager Routes
// -------------------

// GET /api/resources/summary - View usage summary across teams or departments
router.get('/summary', auth, checkRole('manager', 'hr'), resourceController.getResourceSummary);

// GET /api/resources/recommendations - View recommended resources
router.get('/recommendations', auth, checkRole('manager', 'hr'), resourceController.getResourceRecommendations);


// -------------------
// HR Routes
// -------------------

// GET /api/resources - List all resources (for HR/management views)
router.get('/', auth, checkRole('hr', 'manager', 'supervisor'), resourceController.getAllResources);

// POST /api/resources - Create a new resource
router.post('/', auth, checkRole('hr'), resourceController.createResource);

// PUT /api/resources/:id - Update resource metadata
router.put('/:id', auth, checkRole('hr'), resourceController.updateResource);

// DELETE /api/resources/:id - Delete a resource
router.delete('/:id', auth, checkRole('hr'), resourceController.deleteResource);

// GET /api/resources/analytics - Get global resource access analytics
router.get('/analytics', auth, checkRole('hr'), resourceController.getResourceAnalytics);


// -------------------
// Common / General Routes
// -------------------

// GET /api/resources/:id - View specific resource details (must be last to avoid catching other routes)
router.get('/:id', auth, checkRole('employee', 'supervisor', 'manager', 'hr'), resourceController.getResourceById);

module.exports = router; 