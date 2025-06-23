const { Task, User, UserTaskProgress } = require("../models");
const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const logActivity = require("../utils/logActivity");


// Get user's tasks
const getUserTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { userId: req.user.id },
      order: [["dueDate", "ASC"]],
    });
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create task
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      dueDate,
      priority,
      onboardingStage,
      controlledBy,
    } = req.body;
    const task = await Task.create({
      userId: req.user.id,
      title,
      description,
      dueDate,
      priority,
      onboardingStage,
      controlledBy,
      isCompleted: false,
    });
    await logActivity({
      userId: req.user.id,
      action: "task_created",
      entityType: "task",
      entityId: task.id,
      details: task,
      req
    });
    

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const {
      title,
      description,
      dueDate,
      priority,
      onboardingStage,
      controlledBy,
      isCompleted,
    } = req.body;
    await task.update({
      title: title || task.title,
      description: description || task.description,
      dueDate: dueDate || task.dueDate,
      priority: priority || task.priority,
      onboardingStage: onboardingStage || task.onboardingStage,
      controlledBy: controlledBy || task.controlledBy,
      isCompleted: isCompleted !== undefined ? isCompleted : task.isCompleted,
    });
    await logActivity({
      userId: req.user.id,
      action: "task_updated",
      entityType: "task",
      entityId: task.id,
      details: req.body,
      req
    });
    

    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.destroy();
    await logActivity({
      userId: req.user.id,
      action: "task_deleted",
      entityType: "task",
      entityId: task.id,
      req
    });
    
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get employee tasks (for supervisors/managers/HR)
const getEmployeeTasks = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Allow if the requesting user is the employee, HR, or the supervisor of the employee
    const employee = await User.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    if (
      req.user.id !== employeeId &&
      req.user.role !== "hr" &&
      !(req.user.role === "supervisor" && employee.supervisorId === req.user.id)
    ) {
      return res.status(403).json({ error: "Access denied." });
    }

    const tasks = await Task.findAll({
      where: { userId: employeeId },
      order: [["dueDate", "ASC"]],
    });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching employee tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// NEW METHODS

// Update task progress
// PUT /api/onboarding/tasks/:taskId/progress
const updateTaskProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const { isCompleted, notes } = req.body;
    const userId = req.user.id;
    
    // Find the task to check if it's HR-controlled
    const task = await OnboardingTask.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    // Check if user has permission to update this task
    if (task.controlledBy === 'hr' && req.user.role !== 'hr' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        message: "This task can only be completed by HR personnel" 
      });
    }

    // Find or create task progress
    const [taskProgress, created] = await UserTaskProgress.findOrCreate({
      where: {
        UserId: userId,
        OnboardingTaskId: taskId,
      },
      defaults: {
        isCompleted: false,
        notes: "",
      },
    });

    // Update the task progress
    await taskProgress.update({
      isCompleted:
        isCompleted !== undefined ? isCompleted : taskProgress.isCompleted,
      notes: notes || taskProgress.notes,
      completedAt: isCompleted ? new Date() : null,
    });
    await logActivity({
      userId,
      action: "task_progress_updated",
      entityType: "task",
      entityId: taskId,
      details: req.body,
      req
    });
    

    res.json(taskProgress);
  } catch (error) {
    console.error("Error updating task progress:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add supervisor notes to task
// PUT /api/onboarding/tasks/:taskId/notes
const addSupervisorNotes = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const { supervisorNotes } = req.body;
    const supervisorId = req.user.id;

    // Find the task
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Verify supervisor relationship with the task owner
    const taskOwner = await User.findByPk(task.userId);
    if (!taskOwner) {
      return res.status(404).json({ message: "Task owner not found" });
    }

    // Check if supervisor has permission
    if (
      req.user.role === "supervisor" &&
      taskOwner.supervisorId !== supervisorId &&
      req.user.role !== "hr" &&
      req.user.role !== "manager"
    ) {
      return res.status(403).json({
        message: "Not authorized to add notes to this employee's tasks",
      });
    }

    // Update the task with supervisor notes
    await task.update({
      supervisorNotes: supervisorNotes,
    });

    res.json({
      task,
    });
  } catch (error) {
    console.error("Error adding supervisor notes:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getUserTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getEmployeeTasks,
  updateTaskProgress,
  addSupervisorNotes,
};
