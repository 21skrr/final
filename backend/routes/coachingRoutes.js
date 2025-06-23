const express = require("express");
const { check } = require("express-validator");
const coachingController = require("../controllers/coachingController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// Validation middleware
const sessionValidation = [
  check("date", "Date is required").isISO8601(),
  check("duration", "Duration is required").isInt({ min: 15 }),
  check("notes", "Notes are required").not().isEmpty(),
  check("goals", "Goals must be an array").isArray(),
  check("goals.*", "Goal text is required").not().isEmpty(),
];

// GET /api/coaching/supervisor
router.get(
  "/supervisor",
  auth,
  checkRole("supervisor", "hr"),
  coachingController.getSupervisorSessions
);

// GET /api/coaching/employee
router.get("/employee", auth, coachingController.getEmployeeSessions);

// GET /api/coaching/:id
router.get("/:id", auth, coachingController.getSessionById);

// POST /api/coaching
router.post(
  "/",
  [auth, checkRole("supervisor"), sessionValidation],
  coachingController.createSession
);

// PUT /api/coaching/:id
router.put(
  "/:id",
  [auth, checkRole("supervisor"), sessionValidation],
  coachingController.updateSession
);

// DELETE /api/coaching/:id
router.delete(
  "/:id",
  [auth, checkRole("supervisor")],
  coachingController.deleteSession
);

module.exports = router;
