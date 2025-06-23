const { Resource } = require("../models");
const { Op } = require("sequelize");
const models = require("../models");

// Get all resources with optional filtering
const getAllResources = async (req, res) => {
  try {
    const { stage, type, programType } = req.query;
    const where = {};

    // Add filters if provided
    if (stage) where.stage = stage;
    if (type) where.type = type;
    if (programType) where.programType = programType;

    const resources = await Resource.findAll({
      where,
      attributes: ['id', 'title', 'type', 'url', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get resource by ID
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json(resource);
  } catch (error) {
    console.error("Error fetching resource:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Track resource download
const trackResourceDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await models.Resource.findByPk(id);
    
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Log the download activity
    if (req.user && req.user.id) {
      await models.ActivityLog.create({
        userId: req.user.id,
        action: 'resource_downloaded', // Log download action
        entityType: 'resource',
        entityId: resource.id,
        details: `Downloaded resource: ${resource.title}`
      });
    }

    res.json({ 
      message: "Download initiated",
      downloadUrl: resource.url // Still return the URL
    });
  } catch (error) {
    console.error("Error tracking resource download:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Assign resources to employees
const assignResources = async (req, res) => {
  try {
    const { resourceIds, employeeIds, dueDate } = req.body;

    // Basic validation
    if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({ message: "resourceIds array is required." });
    }
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ message: "employeeIds array is required." });
    }

    // Optional: Validate if resourceIds and employeeIds exist in their respective tables
    // This can prevent creating assignments to non-existent resources or users.
    // For brevity, skipping this validation here, but recommended for production.

    const assignmentsToCreate = [];
    resourceIds.forEach(resourceId => {
      employeeIds.forEach(userId => {
        assignmentsToCreate.push({
          resourceId,
          userId,
          dueDate: dueDate || null, // Use provided dueDate or null
          status: 'assigned' // Default status
        });
      });
    });

    // Bulk create resource assignments
    const assignments = await models.ResourceAssignment.bulkCreate(assignmentsToCreate);

    res.status(201).json({ 
      message: 'Resources assigned successfully.',
      assignments: assignments.map(assignment => ({ // Return created assignments (optional, adjust as needed)
        id: assignment.id,
        resourceId: assignment.resourceId,
        userId: assignment.userId,
        dueDate: assignment.dueDate,
        status: assignment.status,
      }))
    });

  } catch (error) {
    console.error("Error assigning resources:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get resources relevant to a specific employee
const getEmployeeResources = async (req, res) => {
  try {
    const { employeeId } = req.query;

    if (!employeeId) {
      return res.status(400).json({ message: "employeeId query parameter is required." });
    }

    // Find the employee to get their programType and stage
    const employee = await models.User.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employeeProgramType = employee.programType;
    const employeeStage = employee.stage; // Assuming stage is a field on the User model

    // Build the where clause dynamically based on employee's programType and stage
    const resourceWhere = {
        [Op.or]: [
            { programType: 'all' },
        ],
         // Assuming stage is also used for filtering resources.
        [Op.or]: [
            { stage: 'all' },
        ],
    };

    // Add employee's specific programType to the OR condition if it exists
    if (employeeProgramType) {
        resourceWhere[Op.or].push({ programType: employeeProgramType });
    }

    // Add employee's specific stage to the OR condition if it exists
     if (employeeStage) {
        resourceWhere[Op.or].push({ stage: employeeStage });
     }

    // Fetch resources that match the employee's programType and stage,
    // or are applicable to 'all' programs and stages.
    const resources = await models.Resource.findAll({
      where: resourceWhere,
       attributes: ['id', 'title', 'type', 'url', 'createdAt'],
       order: [['createdAt', 'DESC']]
    });

    res.json(resources);

  } catch (error) {
    console.error("Error fetching employee resources:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get resource usage summary across teams or departments
const getResourceSummary = async (req, res) => {
  try {
    const { departmentId, teamId, programType } = req.query;

    // Define filters for the activity logs
    const activityWhere = {
      entityType: 'resource',
      action: 'resource_viewed' // Assuming this action indicates resource access
    };

    // Define includes for joining with User and Resource tables
    const include = [
      { model: models.User, as: 'User', attributes: ['id', 'name', 'departmentId', 'teamId', 'programType'] },
      { model: models.Resource,as: 'Resource', attributes: ['id', 'title', 'type'] }
    ];

    // Add filters based on query parameters, applied to the joined User/Resource models
    if (departmentId) {
      include[0].where = { ...include[0].where, departmentId };
    }
    if (teamId) {
      include[0].where = { ...include[0].where, teamId };
    }
    if (programType) {
       include[0].where = { ...include[0].where, programType };
    }
    // If you want to filter by resource programType or stage, add similar conditions here
    // if (resourceProgramType) { include[1].where = { ...include[1].where, programType: resourceProgramType }; }
    // if (resourceStage) { include[1].where = { ...include[1].where, stage: resourceStage }; }

    // Fetch activity logs and join with User and Resource to apply filters
    const activities = await models.ActivityLog.findAll({
      where: activityWhere,
      include,
      // We need to group and count, but findAll with includes and complex grouping can be tricky
      // A raw query might be more efficient for aggregation.
      // For simplicity in Sequelize ORM, let's fetch relevant activities and process in app.
      // OR, use Sequelize aggregation methods if the grouping becomes complex.
    });

    // Process activities to generate summary data (e.g., count access by resource)
    const summaryData = {};

    activities.forEach(activity => {
      // Ensure both user and resource associations are loaded
      if (activity.User && activity.Resource) {
        const resourceId = activity.Resource.id;

        if (!summaryData[resourceId]) {
          summaryData[resourceId] = {
            resource: activity.Resource, // Include resource details
            accessCount: 0,
            // Initialize other metrics to 0, even if not calculated with current data
            completionRate: 0, 
            avgTimeSpent: 0,
            // Add grouping by department/team here if needed in the output structure
            // departments: {}, teams: {}
          };
        }

        summaryData[resourceId].accessCount++;

        // If implementing department/team grouping in the output:
        // const departmentName = activity.User.department || 'Unknown Department';
        // if (!summaryData[resourceId].departments[departmentName]) {
        //    summaryData[resourceId].departments[departmentName] = { accessCount: 0, ... };
        // }
        // summaryData[resourceId].departments[departmentName].accessCount++;
      }
    });

    // Convert summaryData object to an array of results
    const resultSummary = Object.values(summaryData);

    res.json(resultSummary);

  } catch (error) {
    console.error("Error fetching resource summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get recommended resources by role or performance data (basic implementation)
const getResourceRecommendations = async (req, res) => {
  try {
    // A simple approach: recommend resources based on the requesting user's role or programType
    const requestingUser = req.user; // Assuming user info is in req.user from auth middleware

    if (!requestingUser) {
       return res.status(401).json({ message: "Authentication required for recommendations." });
    }

    // Fetch resources that match the user's programType or are applicable to 'all'
    const recommendations = await models.Resource.findAll({
      where: {
        [Op.or]: [
          { programType: requestingUser.programType }, // Match user's program type
          { programType: 'all' }, // Include general resources
        ]
         // Add more complex filtering based on role, stage, or performance data if available and relevant
      },
      attributes: ['id', 'title', 'description', 'type', 'url'], // Return full details for recommendations
      order: [['createdAt', 'DESC']], // Order by recency
      limit: 10 // Limit the number of recommendations
    });

    res.json(recommendations);

  } catch (error) {
    console.error("Error fetching resource recommendations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new resource (HR endpoint)
const createResource = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const { title, description, url, type, stage, programType } = req.body;

    // Basic validation
    if (!title || !url || !type || !stage) {
      return res.status(400).json({ message: "Title, URL, type, and stage are required." });
    }
     // Add validation for enum types if necessary, or rely on DB constraints

    // Assuming the authenticated user's ID is available in req.user.id
    const createdBy = req.user.id;

    const newResource = await models.Resource.create({
      title,
      description,
      url,
      type,
      stage,
      programType,
      createdBy: req.user.id,
    });

    res.status(201).json(newResource); // Return the created resource

  } catch (error) {
    console.error("Error creating resource:", error);
    // Return the actual error message for debugging
    res.status(500).json({ message: "Server error", error: error.message, details: error });
  }
};

// Update resource metadata (HR endpoint)
const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, url, type, stage, programType } = req.body;

    const resource = await models.Resource.findByPk(id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    // Update fields if provided in the body
    if (title !== undefined) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (url !== undefined) resource.url = url;
    if (type !== undefined) resource.type = type;
    if (stage !== undefined) resource.stage = stage;
    if (programType !== undefined) resource.programType = programType;

    await resource.save(); // Save the updated resource

    res.json({ message: "Resource updated successfully.", resource });

  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a resource (HR endpoint)
const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await models.Resource.findByPk(id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    // Optional: Add logic to handle resource assignments before deletion (e.g., delete assignments)
    // await models.ResourceAssignment.destroy({ where: { resourceId: id } });

    await resource.destroy(); // Delete the resource

    res.json({ success: true, message: "Resource deleted successfully." });

  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get global resource access analytics (HR endpoint)
const getResourceAnalytics = async (req, res) => {
  try {
    const { resourceId, startDate, endDate } = req.query;

    // Build activity log query based on filters
    const activityWhere = {
      entityType: 'resource', // Filter for resource activities
      // We will fetch multiple actions, so don't filter by action here initially
    };

    if (resourceId) {
      activityWhere.entityId = resourceId;
    }
    if (startDate && endDate) {
      activityWhere.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
      activityWhere.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      activityWhere.createdAt = { [Op.lte]: new Date(endDate) };
    }

    // Fetch relevant activity logs, including User for role/department info
    // Fetch all relevant resource-related activities to calculate different metrics
    const activities = await models.ActivityLog.findAll({
      where: activityWhere,
      include: [
        { model: models.User, as: 'User', attributes: ['id', 'role', 'departmentId', 'teamId'] },
        // We need Resource details for the summary output
        { model: models.Resource, as: 'Resource', attributes: ['id', 'title', 'type'] },
      ],
      order: [['createdAt', 'ASC']], // Order by time for duration calculation
    });

    // --- Process data to generate analytics --- //
    const analyticsData = {}; // Structure to hold processed analytics by resourceId

    // Group activities by resource and user for processing
    const activitiesByResourceAndUser = {};
    activities.forEach(activity => {
        if (activity.Resource && activity.User) {
            const rId = activity.Resource.id;
            const uId = activity.User.id;
            if (!activitiesByResourceAndUser[rId]) activitiesByResourceAndUser[rId] = {};
            if (!activitiesByResourceAndUser[rId][uId]) activitiesByResourceAndUser[rId][uId] = [];
            activitiesByResourceAndUser[rId][uId].push(activity);

             // Initialize analytics entry for this resource if it doesn't exist
            if (!analyticsData[rId]) {
              analyticsData[rId] = {
                resource: activity.Resource,
                accessCount: 0,
                downloadCount: 0,
                completionCount: 0,
                totalViewDuration: 0, // in milliseconds
                viewSessions: 0, // To count completed view sessions
                usageByRole: {},
                usageByDepartment: {},
              };
            }

            // Update usage by role and department based on *any* activity for this user and resource
             const role = activity.User.role || 'Unknown';
             analyticsData[rId].usageByRole[role] = (analyticsData[rId].usageByRole[role] || 0) + 1;

             const departmentId = activity.User.departmentId || 'Unknown'; // Using departmentId as per schema
             analyticsData[rId].usageByDepartment[departmentId] = (analyticsData[rId].usageByDepartment[departmentId] || 0) + 1;
        }
    });

    // Process activities grouped by resource and user to calculate metrics
    Object.keys(activitiesByResourceAndUser).forEach(rId => {
      Object.keys(activitiesByResourceAndUser[rId]).forEach(uId => {
        const userActivities = activitiesByResourceAndUser[rId][uId];
        let viewingStartedTime = null;
        let lastActivityTime = null; // To help with duration calculation if stop is missing

        userActivities.forEach(activity => {
           lastActivityTime = activity.createdAt.getTime();

          if (activity.action === 'resource_viewed') {
            analyticsData[rId].accessCount++;
          } else if (activity.action === 'resource_downloaded') {
             analyticsData[rId].downloadCount++;
          } else if (activity.action === 'resource_completed') {
             analyticsData[rId].completionCount++;
          } else if (activity.action === 'resource_viewing_started') {
            viewingStartedTime = activity.createdAt.getTime();
          } else if (activity.action === 'resource_viewing_stopped') {
            if (viewingStartedTime !== null) {
              const duration = activity.createdAt.getTime() - viewingStartedTime;
              analyticsData[rId].totalViewDuration += duration;
              analyticsData[rId].viewSessions++;
              viewingStartedTime = null; // Reset for next session
            } else {
              // Handle case where stop is logged without a preceding start
              console.warn(`Resource ${rId} for user ${uId}: viewing_stopped without preceding viewing_started.`);
            }
          }
        });

        // Optional: If viewingStartedTime is not null after processing all activities for a user/resource,
        // it means the last viewing session was not explicitly stopped.
        // You could add logic here to estimate duration based on last activity time if needed.
         // if (viewingStartedTime !== null && lastActivityTime !== null) {
         //   const estimatedDuration = lastActivityTime - viewingStartedTime;
         //   analyticsData[rId].totalViewDuration += estimatedDuration;
         //   analyticsData[rId].viewSessions++; // Count as a session even if not stopped explicitly
         // }
      });
    });

    // Finalize analytics data (calculate rates and averages)
    const finalAnalytics = Object.values(analyticsData).map(item => {
      const avgTimeSpent = item.viewSessions > 0 ? item.totalViewDuration / item.viewSessions : 0;
      // Calculate completion rate: completions divided by accesses
      const completionRate = item.accessCount > 0 ? (item.completionCount / item.accessCount) * 100 : 0;

      return {
        resource: item.resource,
        accessCount: item.accessCount,
        downloadCount: item.downloadCount,
        completionRate: parseFloat(completionRate.toFixed(2)), // Format to 2 decimal places
        avgTimeSpent: parseFloat((avgTimeSpent / 1000).toFixed(2)), // Convert ms to seconds and format
        usageByRole: item.usageByRole,
        usageByDepartment: item.usageByDepartment,
        // Add other metrics as calculated
      };
    });

    res.json(finalAnalytics);

  } catch (error) {
    console.error("Error fetching resource analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Log resource completion
const completeResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await models.Resource.findByPk(id);
    
    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    // Log the completion activity
    if (req.user && req.user.id) {
      await models.ActivityLog.create({
        userId: req.user.id,
        action: 'resource_completed', // Log completion action
        entityType: 'resource',
        entityId: resource.id,
        details: `Completed resource: ${resource.title}`
      });
    }

    res.json({ message: "Resource completion logged successfully." });

  } catch (error) {
    console.error("Error logging resource completion:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Log resource viewing start
const startResourceViewing = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await models.Resource.findByPk(id);
    
    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    // Log the viewing start activity
    if (req.user && req.user.id) {
      await models.ActivityLog.create({
        userId: req.user.id,
        action: 'resource_viewing_started', // Log viewing start
        entityType: 'resource',
        entityId: resource.id,
        details: `Started viewing resource: ${resource.title}`
      });
    }

    res.json({ message: "Resource viewing start logged successfully." });

  } catch (error) {
    console.error("Error logging resource viewing start:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Log resource viewing stop
const stopResourceViewing = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await models.Resource.findByPk(id);
    
    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    // Log the viewing stop activity
    if (req.user && req.user.id) {
      await models.ActivityLog.create({
        userId: req.user.id,
        action: 'resource_viewing_stopped', // Log viewing stop
        entityType: 'resource',
        entityId: resource.id,
        details: `Stopped viewing resource: ${resource.title}`
      });
    }

    res.json({ message: "Resource viewing stop logged successfully." });

  } catch (error) {
    console.error("Error logging resource viewing stop:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all resources assigned to the current user
const getAssignedResources = async (req, res) => {
  try {
    const userId = req.user.id;
    const assignments = await models.ResourceAssignment.findAll({
      where: { userId },
      include: [{
        model: models.Resource,
        as: 'resource'
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assigned resources:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllResources,
  getResourceById,
  trackResourceDownload,
  assignResources,
  getEmployeeResources,
  getResourceSummary,
  getResourceRecommendations,
  createResource,
  updateResource,
  deleteResource,
  getResourceAnalytics,
  completeResource,
  startResourceViewing,
  stopResourceViewing,
  getAssignedResources,
}; 