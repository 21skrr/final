const express = require("express");
const { check } = require("express-validator");
const eventController = require("../controllers/eventController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

const router = express.Router();

// GET /api/events
router.get("/", auth, eventController.getAllEvents);

// GET /api/events/user
router.get("/user", auth, eventController.getUserEvents);

// GET /api/events/:id
router.get("/:id", auth, eventController.getEventById);

// POST /api/events
router.post(
  "/",
  [
    auth,
    check("title", "Title is required").not().isEmpty(),
    check("startDate", "Start date is required").isISO8601(),
    check("endDate", "End date is required").isISO8601(),
    check("type", "Type must be meeting, training, event, or planning").isIn([
      "meeting",
      "training",
      "event",
      "planning",
    ]),
  ],
  eventController.createEvent
);

// PUT /api/events/:id
router.put(
  "/:id",
  [
    auth,
    check("title", "Title is required").optional(),
    check("startDate", "Start date must be a valid date")
      .optional()
      .isISO8601(),
    check("endDate", "End date must be a valid date").optional().isISO8601(),
    check("type", "Type must be meeting, training, event, or planning")
      .optional()
      .isIn(["meeting", "training", "event", "planning"]),
  ],
  eventController.updateEvent
);

// DELETE /api/events/:id
router.delete("/:id", auth, eventController.deleteEvent);

// PUT /api/events/:eventId/participants/:userId
router.put(
  "/:eventId/participants/:userId",
  [
    auth,
    roleCheck(["hr", "supervisor"]),
    check("attended", "Attended must be a boolean").isBoolean(),
  ],
  eventController.updateAttendance
);

module.exports = router;
