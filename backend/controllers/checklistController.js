const {
  Checklist,
  User,
  ChecklistItem,
  ChecklistProgress,
  ChecklistCombined,
  sequelize,
} = require("../models");
const { DataTypes } = require("sequelize");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const uuidv4 = require("uuid").v4;
// Simulated notification service - In a real app, this would use something like websockets or email
const notificationService = {
  sendNotification: async (userId, message, type) => {
    console.log(`Notification sent to user ${userId}: ${message} (${type})`);
    // In a real app, integrate with your notification system here
    return { success: true };
  },
};

// Get all checklists
const getAllChecklists = async (req, res) => {
  try {
    // Get query params for filtering
    const { programType, stage } = req.query;

    // Setup filter conditions
    const whereConditions = {};
    if (programType) whereConditions.programType = programType;
    if (stage) whereConditions.stage = stage;

    // Use ChecklistCombined instead of Checklist
    const checklists = await ChecklistCombined.findAll({
      where: whereConditions,
      // No associations for creator or items in ChecklistCombined, so just return the raw data
      order: [["assignmentCreatedAt", "DESC"]],
    });

    res.json(checklists);
  } catch (error) {
    console.error("Error fetching checklists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get checklist by ID
const getChecklistById = async (req, res) => {
  try {
    // Find the template row in ChecklistCombined by checklistId
    const checklist = await ChecklistCombined.findOne({
      where: { checklistId: req.params.id, userId: null },
    });

    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    res.json(checklist);
  } catch (error) {
    console.error("Error fetching checklist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create checklist
const createChecklist = async (req, res) => {
  try {
    // Check if user has HR role
    if (req.user.role !== "hr") {
      return res.status(403).json({
        message: "Access denied. Only HR can create checklists.",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, programType, stage, items } = req.body;
    const checklistId = uuidv4();
    // Create checklist_combined template row (userId: null)
    const checklistCombined = await ChecklistCombined.create({
      id: uuidv4(),
      checklistId,
      userId: null,
      title,
      description,
      programType: programType || "all",
      stage: stage || "all",
      status: "assigned",
      assignmentCreatedAt: new Date(),
      assignmentUpdatedAt: new Date(),
    });

    // Create checklist items if provided
    let createdItems = [];
    if (items && Array.isArray(items) && items.length > 0) {
      const checklistItems = items.map((item, index) => ({
        checklistId,
        title: item.title,
        description: item.description || null,
        isRequired: item.isRequired !== false,
        orderIndex: index,
        controlledBy: item.controlledBy || 'hr',
        phase: item.phase || 'prepare',
      }));
      createdItems = await ChecklistItem.bulkCreate(checklistItems);
    } else {
      // Create default items as specified in requirements
      const defaultItems = [
        {
          title: "Remise de l'uniforme",
          description: "Distribution de l'uniforme à l'employé",
          isRequired: true,
        },
        {
          title: "Formation initiale",
          description: "Formation de base pour les nouveaux employés",
          isRequired: true,
        },
        {
          title: "Intégration sur le terrain",
          description:
            "Période d'adaptation et d'intégration au poste de travail",
          isRequired: true,
        },
        {
          title: "Suivi des formations obligatoires et facultatives",
          description: "Vérification de la participation aux formations",
          isRequired: true,
        },
      ];
      const checklistItems = defaultItems.map((item, index) => ({
        checklistId,
        title: item.title,
        description: item.description,
        isRequired: item.isRequired,
        orderIndex: index,
        controlledBy: 'hr',
        phase: 'prepare',
      }));
      createdItems = await ChecklistItem.bulkCreate(checklistItems);
    }

    res.status(201).json({ checklist: checklistCombined, items: createdItems });
  } catch (error) {
    console.error("Error creating checklist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update checklist
const updateChecklist = async (req, res) => {
  try {
    // Check if user has HR role
    if (req.user.role !== "hr") {
      return res.status(403).json({
        message: "Access denied. Only HR can update checklists.",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Use ChecklistCombined instead of Checklist
    const checklist = await ChecklistCombined.findByPk(req.params.id);
    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    const { title, description, programType, stage } = req.body;

    // Update checklist fields
    await checklist.update({
      title: title || checklist.title,
      description: description || checklist.description,
      programType: programType || checklist.programType,
      stage: stage || checklist.stage,
    });

    // Return updated checklist
    res.json(checklist);
  } catch (error) {
    console.error("Error updating checklist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete checklist
const deleteChecklist = async (req, res) => {
  try {
    // Check if user has HR role
    if (req.user.role !== "hr") {
      return res.status(403).json({
        message: "Access denied. Only HR can delete checklists.",
      });
    }

    const checklist = await Checklist.findByPk(req.params.id);
    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    // Delete associated items (this will cascade delete progress records)
    await ChecklistItem.destroy({
      where: { checklistId: checklist.id },
    });

    // Delete the checklist
    await checklist.destroy();
    res.json({ message: "Checklist deleted successfully" });
  } catch (error) {
    console.error("Error deleting checklist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's progress on a checklist
const getUserChecklistProgress = async (req, res) => {
  try {
    const { checklistId, userId } = req.params;

    // Check if the checklist exists
    const checklist = await Checklist.findByPk(checklistId, {
      include: [
        {
          model: ChecklistItem,
          attributes: [
            "id",
            "title",
            "description",
            "isRequired",
            "orderIndex",
          ],
          include: [
            {
              model: ChecklistProgress,
              where: { userId },
              required: false,
              attributes: [
                "id",
                "isCompleted",
                "completedAt",
                "notes",
                "verifiedBy",
                "verifiedAt",
              ],
              include: [
                {
                  model: User,
                  as: "verifier",
                  attributes: ["id", "name", "email"],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [[ChecklistItem, "orderIndex", "ASC"]],
    });

    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    res.json(checklist);
  } catch (error) {
    console.error("Error fetching user checklist progress:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update progress on a checklist item
const updateChecklistProgress = async (req, res) => {
  try {
    const { progressId } = req.params;
    const { isCompleted, notes, completedAt, userId, checklistItemId } = req.body;
    console.log('PATCH checklist-progress', progressId, req.body);

    // Try to find the progress record by primary key
    let progress = await ChecklistProgress.findByPk(progressId);
    if (!progress) {
      // If not found, try to create it if userId and checklistItemId are provided
      if (userId && checklistItemId) {
        progress = await ChecklistProgress.create({
          id: progressId,
          userId,
          checklistItemId,
          isCompleted: !!isCompleted,
          completedAt: isCompleted ? (completedAt || new Date()) : null,
          notes: notes || '',
          verificationStatus: 'pending',
        });
        console.log(`Created missing progress record with id ${progressId}`);
      } else {
        return res.status(404).json({ message: "Checklist progress not found and cannot create without userId and checklistItemId" });
      }
    } else {
      // Update the progress record
      progress.isCompleted = !!isCompleted;
      if (isCompleted) {
        progress.completedAt = completedAt || new Date();
      } else {
        progress.completedAt = null;
      }
      if (notes !== undefined) progress.notes = notes;
      await progress.save();
    }

    // If a task was completed, check if Phase 1 is completed and trigger supervisor assessment
    if (isCompleted && userId) {
      try {
        // Import the function to check and trigger supervisor assessment
        const { checkAndTriggerSupervisorAssessment } = require('./onboardingController');
        await checkAndTriggerSupervisorAssessment(userId);
      } catch (assessmentError) {
        console.error('Error checking supervisor assessment trigger:', assessmentError);
        // Don't fail the main request if assessment trigger fails
      }
    }

    res.json(progress);
  } catch (error) {
    console.error('Error updating checklist progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign checklist to user
const assignChecklistToUser = async (req, res) => {
  try {
    // Check if user has appropriate role
    if (!["hr", "manager"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Only HR or managers can assign checklists.",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { checklistId, userId, dueDate } = req.body;

    // Check if checklist exists in ChecklistCombined
    const checklist = await ChecklistCombined.findByPk(checklistId);
    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if assignment already exists
    // (Allow multiple assignments: do not block if one already exists)

    // Create assignment (new ChecklistCombined row for this user)
    const assignment = await ChecklistCombined.create({
      checklistId,
      userId,
      assignedBy: req.user.id,
      dueDate: dueDate || null,
      title: checklist.title,
      description: checklist.description,
      programType: checklist.programType,
      stage: checklist.stage,
    });

    // Create progress records for each checklist item
    const checklistItems = await ChecklistItem.findAll({ where: { checklistId } });
    const progressRecords = checklistItems.map(item => ({
      userId,
      checklistItemId: item.id,
      isCompleted: false,
      notes: '',
      verificationStatus: 'pending',
    }));
    await ChecklistProgress.bulkCreate(progressRecords);

    // Send notification to user
    await notificationService.sendNotification(
      userId,
      `Une nouvelle checklist "${checklist.title}" vous a été assignée`,
      "checklist_assigned"
    );

    // Return created assignment
    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error assigning checklist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's checklist assignments
const getUserAssignments = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    if (req.params.userId && req.params.userId !== req.user.id) {
      if (!["hr", "manager"].includes(req.user.role)) {
        return res.status(403).json({
          message: "Access denied. You can only view your own assignments.",
        });
      }
    }
    // Fetch only from ChecklistCombined, no joins
    const assignments = await ChecklistCombined.findAll({
      where: { userId },
      order: [["assignmentCreatedAt", "DESC"]],
      attributes: [
        "id",
        "checklistId",
        "userId",
        "assignedBy",
        "dueDate",
        "status",
        "isAutoAssigned",
        "completedAt",
        "assignmentCreatedAt",
        "assignmentUpdatedAt",
        "title",
        "description",
        "programType",
        "stage",
        "checklistCreatedBy",
        "checklistCreatedAt",
        "checklistUpdatedAt",
        "autoAssign",
        "requiresVerification",
        "dueInDays"
      ]
    });
    // For each assignment, calculate completionPercentage
    const assignmentsWithProgress = await Promise.all(assignments.map(async (a) => {
      const total = await ChecklistItem.count({ where: { checklistId: a.checklistId } });
      const completed = await ChecklistProgress.count({ where: { checklistItemId: (await ChecklistItem.findAll({ where: { checklistId: a.checklistId }, attributes: ["id"] })).map(i => i.id), userId: a.userId, isCompleted: true } });
      const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...a.toJSON(), completionPercentage };
    }));
    res.json(assignmentsWithProgress);
  } catch (error) {
    console.error("Error fetching user assignments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify a checklist item
const verifyChecklistItem = async (req, res) => {
  try {
    // Check if user has appropriate role
    if (!["hr", "manager", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({
        message:
          "Access denied. Only HR, managers, or supervisors can verify checklist items.",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { progressId } = req.params;
    const { verificationStatus, verificationNotes } = req.body;

    // Find the progress record
    const progress = await ChecklistProgress.findByPk(progressId, {
      include: [
        {
          model: ChecklistItem,
          include: [{ model: Checklist }],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "verifier",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!progress) {
      return res.status(404).json({ message: "Progress record not found" });
    }

    // Ensure the item is completed before verification
    if (!progress.isCompleted) {
      return res.status(400).json({
        message: "This item must be completed before it can be verified",
      });
    }

    // Update verification status
    await progress.update({
      verificationStatus,
      verificationNotes: verificationNotes || null,
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
    });

    // Send notification to the user
    const statusText =
      verificationStatus === "approved" ? "approuvée" : "rejetée";
    await notificationService.sendNotification(
      progress.userId,
      `Votre étape "${progress.ChecklistItem.title}" a été ${statusText} par ${req.user.name}`,
      "checklist_verification"
    );

    // Return updated progress
    const updatedProgress = await ChecklistProgress.findByPk(progressId, {
      include: [
        {
          model: ChecklistItem,
          attributes: ["id", "title", "isRequired"],
          include: [{ model: Checklist, attributes: ["id", "title"] }],
        },
        {
          model: User,
          as: "verifier",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.json(updatedProgress);
  } catch (error) {
    console.error("Error verifying checklist item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add an item to a checklist
const addChecklistItem = async (req, res) => {
  try {
    // Find any row in ChecklistCombined by checklistId
    const checklist = await ChecklistCombined.findOne({
      where: { checklistId: req.params.checklistId },
    });
    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }
    // Create the item in checklistitems
    const { title, description, isRequired, orderIndex, controlledBy, phase } = req.body;
    const item = await ChecklistItem.create({
      checklistId: req.params.checklistId,
      title,
      description,
      isRequired: isRequired !== false,
      orderIndex,
      controlledBy: controlledBy || 'hr',
      phase: phase || 'prepare',
    });
    res.status(201).json(item);
  } catch (error) {
    console.error("Error adding checklist item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a checklist item
const updateChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Looking for checklist item with ID:", id);
    let checklistItem = await ChecklistItem.findByPk(id);
    if (!checklistItem) {
      console.log("Checklist item not found, creating a new one with provided ID");
      const { title, description, isRequired, orderIndex, controlledBy, phase } = req.body;
      if (!title) {
        return res.status(400).json({ message: "Title is required when creating a new item" });
      }
      // Check if we have checklistId from the query
      const checklistId = req.query.checklistId;
      if (!checklistId) {
        return res.status(400).json({ message: "checklistId is required in query parameters when creating a new item" });
      }
      // Check permissions - only HR and admin roles can update items
      if (!["hr", "admin", "rh"].includes(req.user.role)) {
        return res.status(403).json({ message: "Not authorized to update checklist items" });
      }
      // Check if checklist exists in ChecklistCombined
      const checklist = await ChecklistCombined.findByPk(checklistId);
      if (!checklist) {
        return res.status(404).json({ message: "Checklist not found" });
      }
      checklistItem = await ChecklistItem.create({
        id,
        checklistId,
        title,
        description: description || "",
        isRequired: isRequired !== undefined ? isRequired : true,
        orderIndex: orderIndex || 0,
        controlledBy: controlledBy || "hr",
        phase: phase || "prepare",
      });
      return res.status(201).json(checklistItem);
    }
    console.log("Found checklist item:", checklistItem.id);
    const { title, description, isRequired, orderIndex, controlledBy, phase } = req.body;
    if (!["hr", "admin", "rh"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to update checklist items" });
    }
    await checklistItem.update({
      title: title !== undefined ? title : checklistItem.title,
      description: description !== undefined ? description : checklistItem.description,
      isRequired: isRequired !== undefined ? isRequired : checklistItem.isRequired,
      orderIndex: orderIndex !== undefined ? orderIndex : checklistItem.orderIndex,
      controlledBy: controlledBy !== undefined ? controlledBy : checklistItem.controlledBy,
      phase: phase !== undefined ? phase : checklistItem.phase,
    });
    res.status(200).json(checklistItem);
  } catch (error) {
    console.error("Error updating checklist item:", error);
    res.status(500).json({ message: "Server error", error: error.message, stack: error.stack });
  }
};

// Delete a checklist item
const deleteChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the checklist item
    const checklistItem = await ChecklistItem.findByPk(id);
    if (!checklistItem) {
      return res.status(404).json({ message: "Checklist item not found" });
    }

    // Check permissions - only HR and admin roles can delete items
    if (!["hr", "admin", "rh"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete checklist items" });
    }

    // Delete the item
    await checklistItem.destroy();

    res.status(200).json({ message: "Checklist item deleted successfully" });
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add auto-assignment rules to a checklist
const addAutoAssignRules = async (req, res) => {
  try {
    const { id } = req.params;
    const { programTypes, departments, dueInDays, stages, autoNotify } =
      req.body;

    // Debug logs
    console.log("User role:", req.user.role);
    console.log("User ID:", req.user.id);
    console.log("User details:", JSON.stringify(req.user));

    // Check if checklist exists
    const checklist = await Checklist.findByPk(id);
    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    // Check if user has appropriate role
    if (!["hr", "admin", "rh"].includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Only HR can configure auto-assignment rules. Your role: ${req.user.role}`,
      });
    }

    // Validate programTypes if provided
    if (programTypes && programTypes.length > 0) {
      const validProgramTypes = [
        "inkompass",
        "earlyTalent",
        "apprenticeship",
        "academicPlacement",
        "workExperience",
        "all",
      ];

      for (const type of programTypes) {
        if (!validProgramTypes.includes(type)) {
          return res.status(400).json({
            message: `Invalid program type: ${type}`,
          });
        }
      }
    }

    // Validate stages if provided
    if (stages && stages.length > 0) {
      const validStages = [
        "prepare",
        "orient",
        "land",
        "integrate",
        "excel",
        "all",
      ];

      for (const stage of stages) {
        if (!validStages.includes(stage)) {
          return res.status(400).json({
            message: `Invalid stage: ${stage}`,
          });
        }
      }
    }

    // Update the checklist
    await checklist.update({
      autoAssign: true,
      dueInDays: dueInDays || checklist.dueInDays,
    });

    // Store auto-assign rules in a new or existing AutoAssignRules model
    const AutoAssignRule =
      sequelize.models.AutoAssignRule ||
      sequelize.define("AutoAssignRule", {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        checklistId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        programTypes: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        departments: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        stages: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        autoNotify: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      });

    // Find or create the rule
    const [rule, created] = await AutoAssignRule.findOrCreate({
      where: { checklistId: id },
      defaults: {
        programTypes: programTypes || [],
        departments: departments || [],
        stages: stages || [],
        autoNotify: autoNotify || false,
      },
    });

    // If the rule already existed, update it
    if (!created) {
      await rule.update({
        programTypes: programTypes || rule.programTypes,
        departments: departments || rule.departments,
        stages: stages || rule.stages,
        autoNotify: autoNotify !== undefined ? autoNotify : rule.autoNotify,
      });
    }

    // Return the updated checklist and rules
    res.status(200).json({
      message: "Auto-assignment rules updated successfully",
      checklist,
      autoAssignRules: rule,
    });
  } catch (error) {
    console.error("Error setting auto-assign rules:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all checklist items
const getAllChecklistItems = async (req, res) => {
  try {
    const checklistItems = await ChecklistItem.findAll({
      include: [
        {
          model: Checklist,
          attributes: ["id", "title"],
        },
      ],
      order: [["orderIndex", "ASC"]],
    });

    res.json(checklistItems);
  } catch (error) {
    console.error("Error fetching checklist items:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a specific checklist item by ID
const getChecklistItemById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Looking for checklist item with ID:", id);

    // 1. First try the regular way with findByPk
    const checklistItem = await ChecklistItem.findByPk(id);

    // 2. If not found, try direct SQL query to checklistitems table
    if (!checklistItem) {
      console.log("Item not found with findByPk, trying direct SQL...");

      const directItems = await sequelize.query(
        `SELECT * FROM checklistitems WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (directItems && directItems.length > 0) {
        console.log("Found item with direct SQL:", directItems[0]);
        return res.json(directItems[0]);
      }

      // 3. Try looking in the userchecklistitems table if it exists
      try {
        console.log("Trying userchecklistitems table...");
        const userItems = await sequelize.query(
          `SELECT * FROM userchecklistitems WHERE id = ?`,
          {
            replacements: [id],
            type: sequelize.QueryTypes.SELECT,
          }
        );

        if (userItems && userItems.length > 0) {
          console.log("Found item in userchecklistitems:", userItems[0]);
          return res.json(userItems[0]);
        }
      } catch (error) {
        console.log("Error checking userchecklistitems:", error.message);
      }

      // 4. Try getting a sample item to see format
      const sampleItems = await ChecklistItem.findAll({
        limit: 1,
        raw: true,
      });

      console.log("Sample checklist item format:", sampleItems);

      return res.status(404).json({
        message: "Checklist item not found",
        itemId: id,
        sampleItem: sampleItems.length > 0 ? sampleItems[0] : null,
      });
    }

    res.json(checklistItem);
  } catch (error) {
    console.error("Error fetching checklist item:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};

// Get all items for a specific checklist
const getChecklistItems = async (req, res) => {
  try {
    const { checklistId } = req.params;
    // Verify the checklist exists in ChecklistCombined (any row)
    const checklist = await ChecklistCombined.findOne({
      where: { checklistId },
    });
    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }
    // Find all items for this checklist
    const checklistItems = await ChecklistItem.findAll({
      where: { checklistId },
      order: [["orderIndex", "ASC"]],
    });
    res.json(checklistItems);
  } catch (error) {
    console.error("Error fetching checklist items:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Bulk assign a checklist to multiple users
const bulkAssignChecklist = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user has HR/admin/supervisor role
    if (!["hr", "admin", "supervisor", "rh"].includes(req.user.role)) {
      return res.status(403).json({
        message:
          "Access denied. Only HR, admin, or supervisors can assign checklists.",
      });
    }

    const { checklistId, userIds, dueDate, isAutoAssigned } = req.body;

    // Verify checklist exists
    const checklist = await Checklist.findByPk(checklistId);
    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    // Verify all users exist
    const users = await User.findAll({
      where: {
        id: {
          [Op.in]: userIds,
        },
      },
    });

    if (users.length !== userIds.length) {
      return res.status(404).json({ message: "One or more users not found" });
    }

    // Create assignments for each user
    const assignments = [];
    for (const userId of userIds) {
      const assignment = await ChecklistCombined.create({
        checklistId,
        userId,
        assignedBy: req.user.id,
        dueDate: dueDate || null,
        isAutoAssigned: isAutoAssigned || false,
      });
      assignments.push(assignment);
    }

    res.status(201).json({
      message: `Checklist assigned to ${assignments.length} users successfully`,
      assignments,
    });
  } catch (error) {
    console.error("Error bulk assigning checklists:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get checklist assignments by department
const getAssignmentsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }
    // Find users in the department
    const users = await User.findAll({
      where: { department },
      attributes: ["id", "name", "email", "department"],
    });
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) {
      return res.json([]);
    }
    // Find assignments for those users
    const assignments = await ChecklistCombined.findAll({
      where: { userId: userIds },
      include: [
        {
          model: Checklist,
          attributes: ["id", "title", "description", "programType", "stage"],
        },
      ],
      order: [["assignmentCreatedAt", "DESC"]],
    });
    // For each assignment, calculate completionPercentage and attach employee name
    const result = await Promise.all(assignments.map(async (a) => {
      const checklistId = a.checklistId;
      const userId = a.userId;
      const checklist = a.Checklist;
      // Get all items for this checklist
      const total = await ChecklistItem.count({ where: { checklistId } });
      // Get completed items for this user
      const checklistItems = await ChecklistItem.findAll({ where: { checklistId }, attributes: ["id"] });
      const itemIds = checklistItems.map(i => i.id);
      const completed = await ChecklistProgress.count({ where: { checklistItemId: itemIds, userId, isCompleted: true } });
      const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: a.id,
        checklistId: a.checklistId,
        checklist: checklist ? {
          id: checklist.id,
          title: checklist.title,
          description: checklist.description,
          programType: checklist.programType,
          stage: checklist.stage,
        } : null,
        userId: a.userId,
        employeeName: userMap[a.userId]?.name || a.userId,
        dueDate: a.dueDate,
        status: a.status,
        stage: checklist?.stage || null,
        completionPercentage,
        assignmentCreatedAt: a.assignmentCreatedAt,
        assignmentUpdatedAt: a.assignmentUpdatedAt,
      };
    }));
    res.json(result);
  } catch (error) {
    console.error("Error fetching assignments by department:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get checklists grouped by stage (report)
const getChecklistsByStage = async (req, res) => {
  try {
    const checklists = await Checklist.findAll({
      attributes: [
        "stage",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["stage"],
      order: [["stage", "ASC"]],
    });
    res.json(checklists);
  } catch (error) {
    console.error("Error fetching checklists by stage:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all items for a given checklist assignment
const getAssignmentItems = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    // Find the assignment
    const assignment = await ChecklistCombined.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Checklist assignment not found" });
    }
    // Find all items for the assigned checklist
    const items = await ChecklistItem.findAll({
      where: { checklistId: assignment.checklistId },
      order: [["orderIndex", "ASC"]],
    });
    // For each item, ensure a progress record exists for the user
    const progressRecords = [];
    for (const item of items) {
      // Try to find existing progress record
      let progress = await ChecklistProgress.findOne({
        where: {
          userId: assignment.userId,
          checklistItemId: item.id,
        },
        order: [["updatedAt", "DESC"]]
      });
      // If no progress record exists, create one
      if (!progress) {
        progress = await ChecklistProgress.create({
          userId: assignment.userId,
          checklistItemId: item.id,
          isCompleted: false,
          notes: '',
          verificationStatus: 'pending',
        });
        console.log(`Created missing progress record for user ${assignment.userId}, item ${item.id}`);
      }
      // Add the progress record with item info
      progressRecords.push({
        ...progress.toJSON(),
        checklistItem: item.toJSON(),
      });
    }
    res.json(progressRecords);
  } catch (error) {
    console.error('Error fetching assignment items:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all progress records for a given checklist assignment (flattened)
const getAssignmentProgress = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    // Find the assignment
    const assignment = await ChecklistCombined.findByPk(assignmentId);
    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Checklist assignment not found" });
    }
    // Find all items for the assigned checklist
    const items = await ChecklistItem.findAll({
      where: { checklistId: assignment.checklistId },
    });
    const totalItems = items.length;
    if (totalItems === 0) {
      return res.json({ percentComplete: 0 });
    }
    // Find all completed progress records for the assigned user
    const completedCount = await ChecklistProgress.count({
      where: {
        checklistItemId: items.map((item) => item.id),
        userId: assignment.userId,
        isCompleted: true,
      },
    });
    const percentComplete = Math.round((completedCount / totalItems) * 100);
    res.json({ percentComplete });
  } catch (error) {
    console.error("Error fetching assignment progress:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get checklist assignments by team
const getAssignmentsByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!teamId) {
      return res.status(400).json({ message: "Team ID is required" });
    }
    // Find users in the team
    const users = await User.findAll({ where: { teamId }, attributes: ["id", "name", "email", "teamId"] });
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) {
      return res.json([]);
    }
    // Find assignments for those users
    const assignments = await ChecklistCombined.findAll({
      where: { userId: userIds },
      include: [
        {
          model: Checklist,
          attributes: ["id", "title", "description", "programType", "stage"],
        },
      ],
      order: [["assignmentCreatedAt", "DESC"]],
    });
    // For each assignment, calculate completionPercentage and attach employee name
    const result = await Promise.all(assignments.map(async (a) => {
      const checklistId = a.checklistId;
      const userId = a.userId;
      const checklist = a.Checklist;
      // Get all items for this checklist
      const total = await ChecklistItem.count({ where: { checklistId } });
      // Get completed items for this user
      const checklistItems = await ChecklistItem.findAll({ where: { checklistId }, attributes: ["id"] });
      const itemIds = checklistItems.map(i => i.id);
      const completed = await ChecklistProgress.count({ where: { checklistItemId: itemIds, userId, isCompleted: true } });
      const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: a.id,
        checklistId: a.checklistId,
        checklist: checklist ? {
          id: checklist.id,
          title: checklist.title,
          description: checklist.description,
          programType: checklist.programType,
          stage: checklist.stage,
        } : null,
        userId: a.userId,
        employeeName: userMap[a.userId]?.name || a.userId,
        dueDate: a.dueDate,
        status: a.status,
        stage: checklist?.stage || null,
        completionPercentage,
        assignmentCreatedAt: a.assignmentCreatedAt,
        assignmentUpdatedAt: a.assignmentUpdatedAt,
      };
    }));
    res.json(result);
  } catch (error) {
    console.error("Error fetching assignments by team:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get checklist progress for a specific user and checklist
const getChecklistProgressByUserAndChecklist = async (req, res) => {
  try {
    const { userId, checklistId } = req.params;
    // Fetch all items for the checklistId
    const items = await ChecklistItem.findAll({ where: { checklistId } });
    const progressRecords = [];
    for (const item of items) {
      let progress = await ChecklistProgress.findOne({
        where: {
          userId,
          checklistItemId: item.id,
        },
        order: [["updatedAt", "DESC"]],
      });
      if (!progress) {
        progress = await ChecklistProgress.create({
          userId,
          checklistItemId: item.id,
          isCompleted: false,
          notes: '',
          verificationStatus: 'pending',
        });
      }
      progressRecords.push({
        ...progress.toJSON(),
        checklistItem: item.toJSON(),
      });
    }
    res.json(progressRecords);
  } catch (error) {
    console.error('Error fetching checklist progress by user and checklist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific assignment by ID
const getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    if (!assignmentId) {
      return res.status(400).json({ message: "Assignment ID is required" });
    }

    const assignment = await ChecklistCombined.findByPk(assignmentId, {
      include: [
        {
          model: Checklist,
          include: [
            {
              model: ChecklistItem,
              include: [
                {
                  model: ChecklistProgress,
                  where: { userId: ChecklistCombined.sequelize.col('ChecklistCombined.userId') },
                  required: false,
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: "assignee",
          attributes: ["id", "name", "email", "department", "teamId"],
        },
        {
          model: User,
          as: "assigner",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Calculate completion percentage
    const totalItems = assignment.Checklist?.ChecklistItems?.length || 0;
    const completedItems = assignment.Checklist?.ChecklistItems?.filter(item => 
      item.ChecklistProgresses?.some(progress => progress.isCompleted)
    ).length || 0;
    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    res.json({
      ...assignment.toJSON(),
      completionPercentage,
    });
  } catch (error) {
    console.error("Error fetching assignment by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send reminder for a checklist item
const sendReminder = async (req, res) => {
  try {
    const { progressId } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ message: "Reminder note is required" });
    }

    // Find the progress record
    const progress = await ChecklistProgress.findByPk(progressId, {
      include: [
        {
          model: ChecklistItem,
          include: [{ model: Checklist }],
        },
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!progress) {
      return res.status(404).json({ message: "Progress record not found" });
    }

    // Check permissions - HR, Manager, or Supervisor can send reminders
    if (!["hr", "manager", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to send reminders" });
    }

    // For supervisors, check if they're sending to their team member
    if (req.user.role === "supervisor") {
      const teamMember = await User.findOne({
        where: { id: progress.userId, supervisorId: req.user.id },
      });
      if (!teamMember) {
        return res.status(403).json({ message: "Can only send reminders to team members" });
      }
    }

    // For managers, check if they're sending to their department
    if (req.user.role === "manager") {
      const departmentMember = await User.findOne({
        where: { id: progress.userId, department: req.user.department },
      });
      if (!departmentMember) {
        return res.status(403).json({ message: "Can only send reminders to department members" });
      }
    }

    // Send notification
    await notificationService.sendNotification(
      progress.userId,
      `Reminder: ${progress.ChecklistItem.title}`,
      "checklist_reminder",
      { note }
    );

    res.json({ message: "Reminder sent successfully" });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get department analytics for checklist assignments
const getDepartmentAnalytics = async (req, res) => {
  try {
    const { department } = req.params;

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    // Check permissions - only HR and managers can view department analytics
    if (!["hr", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to view department analytics" });
    }

    // For managers, ensure they can only view their own department
    if (req.user.role === "manager" && req.user.department !== department) {
      return res.status(403).json({ message: "Can only view analytics for your own department" });
    }

    // Find users in the department
    const users = await User.findAll({
      where: { department },
      attributes: ["id"],
    });

    const userIds = users.map(u => u.id);
    if (userIds.length === 0) {
      return res.json({
        totalAssignments: 0,
        completedAssignments: 0,
        inProgressAssignments: 0,
        overdueAssignments: 0,
        completionRate: 0,
        assignmentsByStage: {},
      });
    }

    // Get assignments for department users
    const assignments = await ChecklistCombined.findAll({
      where: { userId: userIds },
      include: [
        {
          model: Checklist,
          attributes: ["id", "title", "stage"],
        },
      ],
    });

    // Calculate analytics
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === "completed").length;
    const inProgressAssignments = assignments.filter(a => a.status === "in_progress").length;
    const overdueAssignments = assignments.filter(a => a.status === "overdue").length;
    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    // Group by stage
    const assignmentsByStage = assignments.reduce((acc, assignment) => {
      const stage = assignment.Checklist?.stage || "unknown";
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      overdueAssignments,
      completionRate,
      assignmentsByStage,
    });
  } catch (error) {
    console.error("Error fetching department analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get team analytics for checklist assignments
const getTeamAnalytics = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({ message: "Team ID is required" });
    }

    // Check permissions - only HR and supervisors can view team analytics
    if (!["hr", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to view team analytics" });
    }

    // For supervisors, ensure they can only view their own team
    if (req.user.role === "supervisor" && req.user.teamId !== teamId) {
      return res.status(403).json({ message: "Can only view analytics for your own team" });
    }

    // Find users in the team
    const users = await User.findAll({
      where: { teamId },
      attributes: ["id"],
    });

    const userIds = users.map(u => u.id);
    if (userIds.length === 0) {
      return res.json({
        totalAssignments: 0,
        completedAssignments: 0,
        inProgressAssignments: 0,
        overdueAssignments: 0,
        completionRate: 0,
        assignmentsByStage: {},
      });
    }

    // Get assignments for team users
    const assignments = await ChecklistCombined.findAll({
      where: { userId: userIds },
      include: [
        {
          model: Checklist,
          attributes: ["id", "title", "stage"],
        },
      ],
    });

    // Calculate analytics
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === "completed").length;
    const inProgressAssignments = assignments.filter(a => a.status === "in_progress").length;
    const overdueAssignments = assignments.filter(a => a.status === "overdue").length;
    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    // Group by stage
    const assignmentsByStage = assignments.reduce((acc, assignment) => {
      const stage = assignment.Checklist?.stage || "unknown";
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      overdueAssignments,
      completionRate,
      assignmentsByStage,
    });
  } catch (error) {
    console.error("Error fetching team analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update checklist_combined assignment/template by id
const updateChecklistAssignment = async (req, res) => {
  try {
    if (!['hr', 'manager', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const { assignmentId } = req.params;
    const { title, description, programType, stage } = req.body;
    const assignment = await ChecklistCombined.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Checklist assignment not found' });
    }
    await assignment.update({
      title: title !== undefined ? title : assignment.title,
      description: description !== undefined ? description : assignment.description,
      programType: programType !== undefined ? programType : assignment.programType,
      stage: stage !== undefined ? stage : assignment.stage,
    });
    res.json(assignment);
  } catch (error) {
    console.error('Error updating checklist assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update checklist_combined template by checklistId (userId is null)
const updateChecklistTemplate = async (req, res) => {
  try {
    if (!['hr', 'manager', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const { checklistId } = req.params;
    const { title, description, programType, stage } = req.body;
    // Update all rows with this checklistId (template and assignments)
    const [affectedRows] = await ChecklistCombined.update(
      {
        title,
        description,
        programType,
        stage,
      },
      {
        where: { checklistId }
      }
    );
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'No checklists found for this checklistId' });
    }
    res.json({ message: 'All checklists updated', checklistId });
  } catch (error) {
    console.error('Error updating checklist template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteChecklistByChecklistId = async (req, res) => {
  try {
    const { checklistId } = req.params;
    const deleted = await ChecklistCombined.destroy({ where: { checklistId } });
    if (deleted === 0) {
      return res.status(404).json({ message: 'No checklists found for this checklistId' });
    }
    res.json({ message: 'Checklist and all assignments deleted', checklistId });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllChecklists,
  getChecklistById,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  getUserChecklistProgress,
  updateChecklistProgress,
  assignChecklistToUser,
  getUserAssignments,
  verifyChecklistItem,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  addAutoAssignRules,
  getAllChecklistItems,
  getChecklistItemById,
  getChecklistItems,
  bulkAssignChecklist,
  getAssignmentsByDepartment,
  getChecklistsByStage,
  getAssignmentItems,
  getAssignmentProgress,
  getAssignmentsByTeam,
  getChecklistProgressByUserAndChecklist,
  getAssignmentById,
  sendReminder,
  getDepartmentAnalytics,
  getTeamAnalytics,
  updateChecklistAssignment,
  updateChecklistTemplate,
  deleteChecklistByChecklistId,
};
