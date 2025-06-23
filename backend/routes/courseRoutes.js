const express = require("express");
const { check } = require("express-validator");
const courseController = require("../controllers/courseController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

const router = express.Router();

// GET /api/courses
router.get("/", auth, courseController.getAllCourses);

// GET /api/courses/:id
router.get("/:id", auth, courseController.getCourseById);

// POST /api/courses
router.post(
  "/",
  [
    auth,
    roleCheck(["hr"]),
    check("title", "Title is required").not().isEmpty(),
    check("totalModules", "Total modules must be a positive number").isInt({
      min: 1,
    }),
    check("programType", "Program type is required").isIn([
      "inkompass",
      "earlyTalent",
      "apprenticeship",
      "academicPlacement",
      "workExperience",
      "all",
    ]),
  ],
  courseController.createCourse
);

// PUT /api/courses/:id
router.put(
  "/:id",
  [
    auth,
    roleCheck(["hr"]),
    check("title", "Title is required").optional(),
    check("totalModules", "Total modules must be a positive number")
      .optional()
      .isInt({ min: 1 }),
    check("programType", "Invalid program type")
      .optional()
      .isIn([
        "inkompass",
        "earlyTalent",
        "apprenticeship",
        "academicPlacement",
        "workExperience",
        "all",
      ]),
  ],
  courseController.updateCourse
);

// DELETE /api/courses/:id
router.delete("/:id", auth, roleCheck(["hr"]), courseController.deleteCourse);

// GET /api/courses/user
router.get("/user", auth, courseController.getUserCourses);

// POST /api/courses/assign
router.post(
  "/assign",
  [
    auth,
    roleCheck(["hr", "supervisor"]),
    check("courseId", "Course ID is required").not().isEmpty(),
    check("userId", "User ID is required").not().isEmpty(),
  ],
  courseController.assignCourse
);

// PUT /api/courses/progress/:id
router.put(
  "/progress/:id",
  [
    auth,
    check("progress", "Progress must be a number between 0 and 100")
      .optional()
      .isInt({ min: 0, max: 100 }),
    check("modulesCompleted", "Modules completed must be a positive number")
      .optional()
      .isInt({ min: 0 }),
  ],
  courseController.updateCourseProgress
);

// DELETE /api/courses/user/:id
router.delete(
  "/user/:id",
  auth,
  roleCheck(["hr"]),
  courseController.removeUserCourse
);

module.exports = router;
