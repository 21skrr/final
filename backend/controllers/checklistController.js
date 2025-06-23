const {
  Checklist,
  User,
  ChecklistItem,
  ChecklistProgress,
  ChecklistAssignment,
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

    const checklists = await Checklist.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
        {
          model: ChecklistItem,
          attributes: [
            "id",
            "title",
            "description",
            "isRequired",
            "orderIndex",
          ],
        },
      ],
      order: [
        ["createdAt", "DESC"],
        [ChecklistItem, "orderIndex", "ASC"],
      ],
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
    const checklist = await Checklist.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
        {
          model: ChecklistItem,
          attributes: [
            "id",
            "title",
            "description",
            "isRequired",
            "orderIndex",
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

    // Create checklist
    const checklist = await Checklist.create({
      title,
      description,
      programType: programType || "all",
      stage: stage || "all",
      createdBy: req.user.id,
    });

    // Create checklist items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const checklistItems = items.map((item, index) => ({
        checklistId: checklist.id,
        title: item.title,
        description: item.description || null,
        isRequired: item.isRequired !== false,
        orderIndex: index,
      }));

      await ChecklistItem.bulkCreate(checklistItems);
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
        checklistId: checklist.id,
        title: item.title,
        description: item.description,
        isRequired: item.isRequired,
        orderIndex: index,
      }));

      await ChecklistItem.bulkCreate(checklistItems);
    }

    // Get created checklist with items
    const createdChecklist = await Checklist.findByPk(checklist.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
        {
          model: ChecklistItem,
          attributes: [
            "id",
            "title",
            "description",
            "isRequired",
            "orderIndex",
          ],
        },
      ],
      order: [[ChecklistItem, "orderIndex", "ASC"]],
    });

    res.status(201).json(createdChecklist);
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

    const checklist = await Checklist.findByPk(req.params.id);
    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    const { title, description, programType, stage, items } = req.body;

    // Update checklist
    await checklist.update({
      title: title || checklist.title,
      description: description || checklist.description,
      programType: programType || checklist.programType,
      stage: stage || checklist.stage,
    });

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await ChecklistItem.destroy({
        where: { checklistId: checklist.id },
      });

      // Create new items
      const checklistItems = items.map((item, index) => ({
        checklistId: checklist.id,
        title: item.title,
        description: item.description || null,
        isRequired: item.isRequired !== false,
        orderIndex: index,
      }));

      await ChecklistItem.bulkCreate(checklistItems);
    }

    // Get updated checklist with items
    const updatedChecklist = await Checklist.findByPk(checklist.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
        {
          model: ChecklistItem,
          attributes: [
            "id",
            "title",
            "description",
            "isRequired",
            "orderIndex",
          ],
        },
      ],
      order: [[ChecklistItem, "orderIndex", "ASC"]],
    });

    res.json(updatedChecklist);
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
    const { isCompleted, notes, completedAt } = req.body;

    // Find the progress record by primary key
    let progress = await ChecklistProgress.findByPk(progressId);
    if (!progress) {
      return res.status(404).json({ message: "Checklist progress not found" });
    }

    // Find the checklist item for notification (optional)
    const checklistItem = await ChecklistItem.findByPk(
      progress.checklistItemId,
      {
        include: [{ model: Checklist }],
      }
    );

    // Update progress
    const completionChanged = progress.isCompleted !== isCompleted;

    await progress.update({
      isCompleted,
      completedAt: isCompleted ? completedAt || new Date() : null,
      notes: notes || progress.notes,
      // Keep verifiedBy/verifiedAt unchanged here
    });

    // Send notifications if status changed to completed
    if (completionChanged && isCompleted && checklistItem) {
      // Find HR users to notify
      const hrUsers = await User.findAll({ where: { role: "hr" } });
      for (const hrUser of hrUsers) {
        await notificationService.sendNotification(
          hrUser.id,
          `L'étape "${checklistItem.title}" a été complétée pour l'utilisateur ${progress.userId}`,
          "checklist_progress"
        );
      }
      // Notify the employee
      await notificationService.sendNotification(
        progress.userId,
        `Vous avez complété l'étape "${checklistItem.title}" de la checklist "${
          checklistItem.Checklist ? checklistItem.Checklist.title : ""
        }"`,
        "checklist_progress"
      );
    }

    // Return updated progress
    const updatedProgress = await ChecklistProgress.findByPk(progress.id, {
      include: [
        {
          model: ChecklistItem,
          attributes: ["id", "title", "isRequired"],
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
    console.error("Error updating checklist progress:", error);
    res.status(500).json({ message: "Server error" });
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

    // Check if checklist exists
    const checklist = await Checklist.findByPk(checklistId);
    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if assignment already exists
    const existingAssignment = await ChecklistAssignment.findOne({
      where: { checklistId, userId },
    });

    if (existingAssignment) {
      return res.status(400).json({
        message: "This checklist is already assigned to the user",
      });
    }

    // Create assignment
    const assignment = await ChecklistAssignment.create({
      checklistId,
      userId,
      assignedBy: req.user.id,
      dueDate: dueDate || null,
    });

    // Send notification to user
    await notificationService.sendNotification(
      userId,
      `Une nouvelle checklist "${checklist.title}" vous a été assignée`,
      "checklist_assigned"
    );

    // Return created assignment with related data
    const createdAssignment = await ChecklistAssignment.findByPk(
      assignment.id,
      {
        include: [
          {
            model: Checklist,
            attributes: ["id", "title", "description"],
            include: [
              {
                model: ChecklistItem,
                attributes: ["id", "title", "isRequired"],
              },
            ],
          },
          {
            model: User,
            as: "assigner",
            attributes: ["id", "name", "email"],
          },
        ],
      }
    );

    res.status(201).json(createdAssignment);
  } catch (error) {
    console.error("Error assigning checklist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's checklist assignments
const getUserAssignments = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // If requesting other user's assignments, check permissions
    if (req.params.userId && req.params.userId !== req.user.id) {
      // Only HR and managers can see other users' assignments
      if (!["hr", "manager"].includes(req.user.role)) {
        return res.status(403).json({
          message: "Access denied. You can only view your own assignments.",
        });
      }
    }

    // Get assignments
    const assignments = await ChecklistAssignment.findAll({
      where: { userId },
      include: [
        {
          model: Checklist,
          attributes: ["id", "title", "description", "programType", "stage"],
          include: [
            {
              model: ChecklistItem,
              attributes: ["id", "title", "isRequired", "orderIndex"],
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
                    "verificationStatus",
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
        },
        {
          model: User,
          as: "assigner",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [
        ["createdAt", "DESC"],
        [Checklist, ChecklistItem, "orderIndex", "ASC"],
      ],
    });

    res.json(assignments);
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
    const { checklistId } = req.params;
    const { title, description, isRequired, orderIndex, controlledBy, phase } =
      req.body;

    // Check if checklist exists
    const checklist = await Checklist.findByPk(checklistId);
    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    // Check permissions - only HR and admin roles can add items
    if (!["hr", "admin", "rh"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to add checklist items" });
    }

    // Create a new checklist item
    const newItem = await ChecklistItem.create({
      id: uuidv4(), // Make sure to require uuid at the top of the file
      checklistId,
      title,
      description: description || "",
      isRequired: isRequired !== undefined ? isRequired : true,
      orderIndex: orderIndex || 0,
      controlledBy: controlledBy || "hr",
      phase: phase || "prepare",
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error adding checklist item:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a checklist item
const updateChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Looking for checklist item with ID:", id);

    // Find the checklist item
    let checklistItem = await ChecklistItem.findByPk(id);

    // If not found, create a new one with this ID
    if (!checklistItem) {
      console.log(
        "Checklist item not found, creating a new one with provided ID"
      );

      const {
        title,
        description,
        isRequired,
        orderIndex,
        controlledBy,
        phase,
      } = req.body;

      if (!title) {
        return res
          .status(400)
          .json({ message: "Title is required when creating a new item" });
      }

      // Check if we have checklistId from the query
      const checklistId = req.query.checklistId;
      if (!checklistId) {
        return res.status(400).json({
          message:
            "checklistId is required in query parameters when creating a new item",
        });
      }

      // Check permissions - only HR and admin roles can update items
      if (!["hr", "admin", "rh"].includes(req.user.role)) {
        return res
          .status(403)
          .json({ message: "Not authorized to update checklist items" });
      }

      // Create the item with the specified ID
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

    const { title, description, isRequired, orderIndex, controlledBy, phase } =
      req.body;

    // Check permissions - only HR and admin roles can update items
    if (!["hr", "admin", "rh"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to update checklist items" });
    }

    // Update the checklist item
    await checklistItem.update({
      title: title !== undefined ? title : checklistItem.title,
      description:
        description !== undefined ? description : checklistItem.description,
      isRequired:
        isRequired !== undefined ? isRequired : checklistItem.isRequired,
      orderIndex:
        orderIndex !== undefined ? orderIndex : checklistItem.orderIndex,
      controlledBy:
        controlledBy !== undefined ? controlledBy : checklistItem.controlledBy,
      phase: phase !== undefined ? phase : checklistItem.phase,
    });

    res.status(200).json(checklistItem);
  } catch (error) {
    console.error("Error updating checklist item:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
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

    // Verify the checklist exists
    const checklist = await Checklist.findByPk(checklistId);
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
      const assignment = await ChecklistAssignment.create({
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
      attributes: ["id"],
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) {
      return res.json([]);
    }
    // Find assignments for those users
    const assignments = await ChecklistAssignment.findAll({
      where: { userId: userIds },
      include: [
        {
          model: Checklist,
          attributes: ["id", "title", "description", "programType", "stage"],
        },
        {
          model: User,
          as: "assignee",
          attributes: ["id", "name", "email", "department"],
        },
        {
          model: User,
          as: "assigner",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(assignments);
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
    const assignment = await ChecklistAssignment.findByPk(assignmentId);
    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Checklist assignment not found" });
    }
    // Find all items for the assigned checklist, including progress for the assigned user
    const items = await ChecklistItem.findAll({
      where: { checklistId: assignment.checklistId },
      order: [["orderIndex", "ASC"]],
      include: [
        {
          model: ChecklistProgress,
          where: { userId: assignment.userId },
          required: false,
        },
      ],
    });
    res.json(items);
  } catch (error) {
    console.error("Error fetching assignment items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all progress records for a given checklist assignment (flattened)
const getAssignmentProgress = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    // Find the assignment
    const assignment = await ChecklistAssignment.findByPk(assignmentId);
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
    const users = await User.findAll({ where: { teamId }, attributes: ["id"] });
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) {
      return res.json([]);
    }
    // Find assignments for those users
    const assignments = await ChecklistAssignment.findAll({
      where: { userId: userIds },
      include: [
        {
          model: Checklist,
          attributes: ["id", "title", "description", "programType", "stage"],
        },
        {
          model: User,
          as: "assignee",
          attributes: ["id", "name", "email", "teamId"],
        },
        {
          model: User,
          as: "assigner",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments by team:", error);
    res.status(500).json({ message: "Server error" });
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
};
