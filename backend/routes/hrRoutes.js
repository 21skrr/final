const express = require("express");
const router = express.Router();
const hrController = require("../controllers/hrController");
const { auth, checkRole } = require("../middleware/auth");

// System Settings Endpoints (HR and Admin only)

// @route   GET /api/systemsettings
// @desc    Get global system settings
// @access  Private (HR, Admin)
router.get("/systemsettings", auth, checkRole('hr', 'admin'), hrController.getSystemSettings);

// @route   PUT /api/systemsettings
// @desc    Update global system settings
// @access  Private (HR, Admin)
router.put("/systemsettings", auth, checkRole('hr', 'admin'), hrController.updateSystemSettings);

// Role Management Endpoints (HR and Admin only)

// @route   GET /api/roles
// @desc    List all roles and their permissions
// @access  Private (HR, Admin)
router.get("/roles", auth, checkRole('hr', 'admin'), hrController.getAllRoles);

// @route   POST /api/roles
// @desc    Create a new role with custom permissions
// @access  Private (HR, Admin)
router.post("/roles", auth, checkRole('hr', 'admin'), hrController.createRole);

// @route   PUT /api/roles/:id
// @desc    Update role permissions
// @access  Private (HR, Admin)
router.put("/roles/:id", auth, checkRole('hr', 'admin'), hrController.updateRole);

// @route   DELETE /api/roles/:id
// @desc    Delete role
// @access  Private (HR, Admin)
router.delete("/roles/:id", auth, checkRole('hr', 'admin'), hrController.deleteRole);


module.exports = router; 