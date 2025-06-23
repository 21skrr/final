const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// ✅ Validation middleware
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .isIn(["employee", "supervisor", "manager", "hr"])
    .withMessage("Invalid role"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("startDate").isDate().withMessage("Invalid start date"),
  body("programType")
    .isIn([
      "inkompass",
      "earlyTalent",
      "apprenticeship",
      "academicPlacement",
      "workExperience",
    ])
    .withMessage("Invalid program type"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const updatePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

// ✅ Routes with body parsing middleware for POST/PUT routes
router.post("/register", 
  express.json(),
  express.urlencoded({ extended: true }),
  registerValidation, 
  authController.register
);

router.post("/login", 
  express.json(),
  express.urlencoded({ extended: true }),
  loginValidation, 
  authController.login
);

router.get("/me", auth, authController.getMe);

router.put(
  "/password/:id",
  express.json(),
  express.urlencoded({ extended: true }),
  auth,
  updatePasswordValidation,
  authController.updatePassword
);

router.post("/logout", 
  express.json(),
  express.urlencoded({ extended: true }),
  auth, 
  authController.logout
);

// ✅ Export the router
module.exports = router;
