const express = require("express");
const { body } = require("express-validator");
const taskController = require("../controllers/taskController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// Validation middleware
const taskValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("dueDate").isISO8601().withMessage("Invalid due date"),
  body("priority")
    .isIn(["low", "medium", "high"])
    .withMessage("Invalid priority level"),
  body("onboardingStage")
    .isIn(["prepare", "orient", "land", "integrate", "excel"])
    .withMessage("Invalid onboarding stage"),
  body("controlledBy")
    .isIn(["employee", "supervisor", "hr"])
    .withMessage("Invalid controller"),
];

// Routes
router.get("/", auth, taskController.getUserTasks);
router.get("/:id", auth, taskController.getTaskById);
router.post("/", auth, taskValidation, taskController.createTask);
router.put("/:id", auth, taskValidation, taskController.updateTask);
router.delete("/:id", auth, taskController.deleteTask);
router.get(
  "/employee/:employeeId",
  auth,
  taskController.getEmployeeTasks
);

// New Endpoints
// Employee: Mark Task as Completed
// PUT /api/onboarding/tasks/:taskId/progress
router.put(
  "/:taskId/progress",
  auth,
  body("isCompleted").isBoolean(),
  body("notes").optional().isString(),
  taskController.updateTaskProgress
);

// Supervisor: Add Notes to Tasks
// PUT /api/onboarding/tasks/:taskId/notes
router.put(
  "/:taskId/notes",
  auth,
  checkRole("supervisor", "manager", "hr"),
  body("supervisorNotes").isString().notEmpty(),
  taskController.addSupervisorNotes
);

module.exports = router;
