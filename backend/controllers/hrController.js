const { SystemSetting, Role, ActivityLog } = require("../models");
const logActivity = require("../utils/logActivity");
const crypto = require("crypto");


// @desc    Get global system settings
// @route   GET /api/systemsettings
// @access  Private (HR, Admin)
const getSystemSettings = async (req, res) => {
    try {
      const settings = await SystemSetting.findAll();
  
      const parsed = {};
      settings.forEach((setting) => {
        parsed[setting.key] = setting.value; // Already parsed by the getter
      });
  
      res.json(parsed);
    } catch (err) {
      console.error("Error fetching system settings:", err);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  
  

// @desc    Update global system settings
// @route   PUT /api/systemsettings
// @access  Private (HR, Admin)

const updateSystemSettings = async (req, res) => {
  try {
    const entries = Object.entries(req.body);

    // Optional validation
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ message: "Request body must be a key-value object." });
    }

    for (const [key, val] of entries) {
      // Update or insert system setting
      await SystemSetting.upsert({
        key,
        value: val, // Sequelize model setter will handle stringify
        updatedBy: req.user.id
      });

      // Log the update action
      await logActivity({
        userId: req.user.id,
        action: "update",
        entityType: "SystemSetting",
        entityId: key,
        details: { newValue: val },
        req
      });
    }

    res.json({ message: "Settings updated successfully." });
  } catch (err) {
    console.error("Error updating system settings:", err);
    res.status(500).json({ message: "Server error" });
  }
};

  
  
  

// List all roles and their permissions
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.json(roles);
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new role with custom permissions
const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name || !permissions) {
      return res.status(400).json({ message: "Name and permissions are required" });
    }
    const newRole = await Role.create({
      id: require("crypto").randomUUID(),
      name,
      description,
      permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions),
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res.status(201).json(newRole);
  } catch (err) {
    console.error("Error creating role:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update role permissions
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    role.name = name ?? role.name;
    role.description = description ?? role.description;
    if (permissions) {
      role.permissions = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
    }
    role.updatedAt = new Date();
    await role.save();
    res.json(role);
  } catch (err) {
    console.error("Error updating role:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    await role.destroy();
    res.json({ message: "Role deleted successfully" });
  } catch (err) {
    console.error("Error deleting role:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
}; 