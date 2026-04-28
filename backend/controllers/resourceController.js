const { Resource } = require("../models");
const { Op } = require("sequelize");
const models = require("../models");
const path = require("path");
const fs = require("fs");

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: get the logged-in user's department / team context
// ─────────────────────────────────────────────────────────────────────────────
const getUserContext = async (userId) => {
  const user = await models.User.findByPk(userId, {
    attributes: ["id", "role", "department", "teamId", "supervisorId"],
  });
  return user;
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD PDF  (HR / Supervisor / Manager)
// POST /api/resources/upload   (multipart/form-data)
// ─────────────────────────────────────────────────────────────────────────────
const uploadPDF = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required." });
    }
    if (!req.file) {
      return res.status(400).json({ message: "A PDF file is required." });
    }

    const {
      title,
      description,
      category = "other",
      stage = "all",
      programType = "all",
      isPublic = false,
      scope = "global",
      scopeId = null,
    } = req.body;

    if (!title) {
      // remove uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Title is required." });
    }

    const fileUrl = `/uploads/resources/${req.file.filename}`;

    const resource = await models.Resource.create({
      title,
      description: description || null,
      type: "pdf",
      url: fileUrl,
      category,
      stage,
      programType,
      isPublic: isPublic === "true" || isPublic === true,
      scope,
      scopeId: scopeId || null,
      createdBy: req.user.id,
    });

    // Log upload activity
    await models.ActivityLog.create({
      userId: req.user.id,
      action: "resource_uploaded",
      entityType: "resource",
      entityId: resource.id,
      details: `Uploaded PDF: ${resource.title}`,
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error("Error uploading PDF:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL RESOURCES  (HR management list)
// GET /api/resources
// ─────────────────────────────────────────────────────────────────────────────
const getAllResources = async (req, res) => {
  try {
    const { stage, type, programType, category, scope } = req.query;
    const where = {};

    if (stage) where.stage = stage;
    if (type) where.type = type;
    if (programType) where.programType = programType;
    if (category) where.category = category;
    if (scope) where.scope = scope;

    const resources = await Resource.findAll({
      where,
      attributes: [
        "id", "title", "description", "type", "url", "category",
        "stage", "programType", "isPublic", "scope", "scopeId",
        "createdBy", "createdAt",
      ],
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: models.User,
          as: "creator",
          attributes: ["id", "name", "role"],
          foreignKey: "createdBy",
        },
      ],
    });

    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET RESOURCE BY ID
// GET /api/resources/:id
// ─────────────────────────────────────────────────────────────────────────────
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Log view activity
    if (req.user && req.user.id) {
      await models.ActivityLog.create({
        userId: req.user.id,
        action: "resource_viewed",
        entityType: "resource",
        entityId: resource.id,
        details: `Viewed resource: ${resource.title}`,
      }).catch(() => {}); // Non-blocking
    }

    res.json(resource);
  } catch (error) {
    console.error("Error fetching resource:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PUBLIC RESOURCES  (Employee read — global public docs)
// GET /api/resources/public
// ─────────────────────────────────────────────────────────────────────────────
const getPublicResources = async (req, res) => {
  try {
    const resources = await models.Resource.findAll({
      where: { isPublic: true },
      attributes: [
        "id", "title", "description", "type", "url",
        "category", "stage", "programType", "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(resources);
  } catch (error) {
    console.error("Error fetching public resources:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ASSIGNED RESOURCES  (Employee — explicitly assigned to them)
// GET /api/resources/my-resources
// ─────────────────────────────────────────────────────────────────────────────
const getAssignedResources = async (req, res) => {
  try {
    const userId = req.user.id;
    const assignments = await models.ResourceAssignment.findAll({
      where: { userId },
      include: [
        {
          model: models.Resource,
          as: "resource",
          attributes: [
            "id", "title", "description", "type", "url",
            "category", "stage", "programType", "isPublic", "createdAt",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assigned resources:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET TEAM RESOURCES  (Supervisor — docs they uploaded for their team)
// GET /api/resources/team
// ─────────────────────────────────────────────────────────────────────────────
const getTeamResources = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    // Resources created by this supervisor scoped to 'team', or global
    const resources = await models.Resource.findAll({
      where: {
        [Op.or]: [
          { createdBy: supervisorId },
          { scope: "global", isPublic: true },
        ],
      },
      attributes: [
        "id", "title", "description", "type", "url", "category",
        "stage", "programType", "isPublic", "scope", "scopeId", "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    // Get assignment counts per resource
    const resourceIds = resources.map((r) => r.id);
    const assignments = await models.ResourceAssignment.findAll({
      where: { resourceId: { [Op.in]: resourceIds } },
      attributes: ["resourceId", "userId"],
    });

    const assignmentMap = {};
    assignments.forEach((a) => {
      if (!assignmentMap[a.resourceId]) assignmentMap[a.resourceId] = 0;
      assignmentMap[a.resourceId]++;
    });

    const result = resources.map((r) => ({
      ...r.toJSON(),
      assignedCount: assignmentMap[r.id] || 0,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching team resources:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET DEPARTMENT RESOURCES  (Manager)
// GET /api/resources/department
// ─────────────────────────────────────────────────────────────────────────────
const getDepartmentResources = async (req, res) => {
  try {
    const manager = await getUserContext(req.user.id);
    if (!manager) return res.status(404).json({ message: "User not found" });

    const where = {
      [Op.or]: [
        { scope: "department", scopeId: manager.department },
        { scope: "global", isPublic: true },
        { createdBy: manager.id },
      ],
    };

    const resources = await models.Resource.findAll({
      where,
      attributes: [
        "id", "title", "description", "type", "url", "category",
        "stage", "programType", "isPublic", "scope", "scopeId",
        "createdBy", "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(resources);
  } catch (error) {
    console.error("Error fetching department resources:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGN RESOURCES TO SPECIFIC EMPLOYEES  (Supervisor / HR)
// POST /api/resources/assign
// ─────────────────────────────────────────────────────────────────────────────
const assignResources = async (req, res) => {
  try {
    const { resourceIds, employeeIds, dueDate } = req.body;

    if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({ message: "resourceIds array is required." });
    }
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ message: "employeeIds array is required." });
    }

    const assignmentsToCreate = [];
    for (const resourceId of resourceIds) {
      for (const userId of employeeIds) {
        // Skip if already assigned
        const existing = await models.ResourceAssignment.findOne({
          where: { resourceId, userId },
        });
        if (!existing) {
          assignmentsToCreate.push({
            resourceId,
            userId,
            dueDate: dueDate || null,
            status: "assigned",
          });
        }
      }
    }

    const assignments = await models.ResourceAssignment.bulkCreate(assignmentsToCreate);

    res.status(201).json({
      message: "Resources assigned successfully.",
      count: assignments.length,
    });
  } catch (error) {
    console.error("Error assigning resources:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ACKNOWLEDGE RESOURCE  (Employee)
// POST /api/resources/:id/acknowledge
// ─────────────────────────────────────────────────────────────────────────────
const acknowledgeResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resource = await models.Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    // Check if already acknowledged
    const existing = await models.ActivityLog.findOne({
      where: { userId, entityId: id, action: "resource_acknowledged" },
    });

    if (existing) {
      return res.json({ message: "Already acknowledged.", alreadyDone: true });
    }

    await models.ActivityLog.create({
      userId,
      action: "resource_acknowledged",
      entityType: "resource",
      entityId: id,
      details: `Acknowledged reading: ${resource.title}`,
    });

    // Update assignment status if exists
    await models.ResourceAssignment.update(
      { status: "completed" },
      { where: { userId, resourceId: id } }
    );

    res.json({ message: "Resource acknowledged." });
  } catch (error) {
    console.error("Error acknowledging resource:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET RESOURCE ACKNOWLEDGEMENT STATUS  (Employee)
// GET /api/resources/:id/acknowledge-status
// ─────────────────────────────────────────────────────────────────────────────
const getAcknowledgeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await models.ActivityLog.findOne({
      where: { userId, entityId: id, action: "resource_acknowledged" },
    });

    res.json({ acknowledged: !!existing });
  } catch (error) {
    console.error("Error checking acknowledgement:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE RESOURCE (legacy URL-based — kept for backward compat)
// POST /api/resources
// ─────────────────────────────────────────────────────────────────────────────
const createResource = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const {
      title, description, url, type, stage, programType,
      category = "other", isPublic = false, scope = "global", scopeId = null,
    } = req.body;

    if (!title || !url || !type) {
      return res.status(400).json({ message: "Title, URL, and type are required." });
    }

    const newResource = await models.Resource.create({
      title, description, url, type, stage, programType,
      category, isPublic, scope, scopeId,
      createdBy: req.user.id,
    });

    res.status(201).json(newResource);
  } catch (error) {
    console.error("Error creating resource:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE RESOURCE  (HR)
// PUT /api/resources/:id
// ─────────────────────────────────────────────────────────────────────────────
const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, url, type, stage, programType,
      category, isPublic, scope, scopeId,
    } = req.body;

    const resource = await models.Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    if (title !== undefined) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (url !== undefined) resource.url = url;
    if (type !== undefined) resource.type = type;
    if (stage !== undefined) resource.stage = stage;
    if (programType !== undefined) resource.programType = programType;
    if (category !== undefined) resource.category = category;
    if (isPublic !== undefined) resource.isPublic = isPublic;
    if (scope !== undefined) resource.scope = scope;
    if (scopeId !== undefined) resource.scopeId = scopeId;

    await resource.save();

    res.json({ message: "Resource updated successfully.", resource });
  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE RESOURCE  (HR / creator)
// DELETE /api/resources/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await models.Resource.findByPk(id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    // Delete physical file if it's an uploaded PDF
    if (resource.url && resource.url.startsWith("/uploads/resources/")) {
      const filePath = path.join(__dirname, "..", resource.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Clean up assignments
    await models.ResourceAssignment.destroy({ where: { resourceId: id } });

    await resource.destroy();

    res.json({ success: true, message: "Resource deleted successfully." });
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET RESOURCE ANALYTICS  (HR)
// GET /api/resources/analytics
// ─────────────────────────────────────────────────────────────────────────────
const getResourceAnalytics = async (req, res) => {
  try {
    const { resourceId, startDate, endDate } = req.query;

    const activityWhere = { entityType: "resource" };
    if (resourceId) activityWhere.entityId = resourceId;
    if (startDate && endDate) {
      activityWhere.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      activityWhere.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      activityWhere.createdAt = { [Op.lte]: new Date(endDate) };
    }

    const activities = await models.ActivityLog.findAll({
      where: activityWhere,
      include: [
        {
          model: models.User,
          as: "User",
          attributes: ["id", "role", "department"],
        },
        {
          model: models.Resource,
          as: "Resource",
          attributes: ["id", "title", "type", "category"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const analyticsData = {};

    activities.forEach((activity) => {
      if (!activity.Resource || !activity.User) return;
      const rId = activity.Resource.id;

      if (!analyticsData[rId]) {
        analyticsData[rId] = {
          resource: activity.Resource,
          viewCount: 0,
          uploadCount: 0,
          acknowledgeCount: 0,
          usageByRole: {},
        };
      }

      if (activity.action === "resource_viewed") analyticsData[rId].viewCount++;
      if (activity.action === "resource_uploaded") analyticsData[rId].uploadCount++;
      if (activity.action === "resource_acknowledged")
        analyticsData[rId].acknowledgeCount++;

      const role = activity.User.role || "Unknown";
      analyticsData[rId].usageByRole[role] =
        (analyticsData[rId].usageByRole[role] || 0) + 1;
    });

    res.json(Object.values(analyticsData));
  } catch (error) {
    console.error("Error fetching resource analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY STUBS (kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────
const trackResourceDownload = async (req, res) => {
  // Redirect to view — downloads disabled
  return getResourceById(req, res);
};

const getEmployeeResources = async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ message: "employeeId is required." });
    }
    const assignments = await models.ResourceAssignment.findAll({
      where: { userId: employeeId },
      include: [{ model: models.Resource, as: "resource" }],
    });
    res.json(assignments.map((a) => a.resource));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getResourceSummary = async (req, res) => {
  try {
    const resources = await models.Resource.findAll({
      order: [["createdAt", "DESC"]],
    });
    const result = resources.map((r) => ({ resource: r, accessCount: 0 }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getResourceRecommendations = async (req, res) => {
  try {
    const resources = await models.Resource.findAll({
      where: { isPublic: true },
      limit: 10,
      order: [["createdAt", "DESC"]],
    });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  uploadPDF,
  getAllResources,
  getResourceById,
  getPublicResources,
  getAssignedResources,
  getTeamResources,
  getDepartmentResources,
  assignResources,
  acknowledgeResource,
  getAcknowledgeStatus,
  createResource,
  updateResource,
  deleteResource,
  getResourceAnalytics,
  trackResourceDownload,
  getEmployeeResources,
  getResourceSummary,
  getResourceRecommendations,
};