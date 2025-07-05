// controllers/authController.js
const jwt = require("jsonwebtoken");
const { User, OnboardingProgress } = require("../models");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto"); // Add crypto module for SHA256
const logActivity = require("../utils/logActivity");

// Function to hash password with SHA256
const hashPasswordSHA256 = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "2020h" }
  );
};

// Authentication Controllers
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, department, startDate, programType } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password using SHA256
    const hashedPassword = hashPasswordSHA256(password);

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role,
      department,
      startDate,
      programType,
    });

    // Create JWT token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.passwordHash;

    res.status(201).json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log("Login attempt for email:", email);

    // Find user (excluding soft deleted users)
    const user = await User.findOne({ 
      where: { 
        email,
        deletedAt: null // Only allow non-deleted users to login
      } 
    });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    console.log("User found:", user.email, user.role);

    // Check password using SHA256
    const hashedPassword = hashPasswordSHA256(password);
    const isMatch = hashedPassword === user.passwordHash;
    console.log("Hashed password:");
    console.log("Password matche:", isMatch);

    if (!isMatch) {
      console.log("Password mismatch for user:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = generateToken(user);
    console.log("Token generated successfully");
    await logActivity({
      userId: user.id,
      action: "user_logged_in",
      entityType: "user",
      entityId: user.id,
      req
    });
    

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.passwordHash;

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["passwordHash"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// User Management Controllers
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { deletedAt: null }, // Only show non-deleted users
      attributes: { exclude: ["passwordHash"] },
      include: [
        {
          model: OnboardingProgress,
          attributes: ["stage", "progress"],
        },
      ],
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["passwordHash"] },
      include: [
        {
          model: OnboardingProgress,
          attributes: [
            "stage",
            "progress",
            "stageStartDate",
            "estimatedCompletionDate",
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, department, startDate, programType } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role,
      department,
      startDate,
      programType,
    })
    await logActivity({
      userId: user.id,
      action: "user_registered",
      entityType: "user",
      entityId: user.id,
      details: { email, role },
      req
    });
    

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      startDate: user.startDate,
      programType: user.programType,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, role, department, startDate, programType } = req.body;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user
    await user.update({
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      department: department || user.department,
      startDate: startDate || user.startDate,
      programType: programType || user.programType,
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      startDate: user.startDate,
      programType: user.programType,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user
    await user.destroy();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getTeamMembers = async (req, res) => {
  try {
    const { department } = req.params;

    const users = await User.findAll({
      where: { department },
      attributes: { exclude: ["passwordHash"] },
      include: [
        {
          model: OnboardingProgress,
          attributes: ["stage", "progress"],
        },
      ],
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has permission to update password
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this user's password" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await user.update({ passwordHash: hashedPassword });
    await logActivity({
      userId: req.user.id,
      action: "password_updated",
      entityType: "user",
      entityId: req.user.id,
      req
    });    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Clear the token from localStorage (handled by frontend)
    // Backend just needs to return success
   await logActivity({
  userId: req.user.id,
  action: "user_logged_out",
  entityType: "user",
  entityId: req.user.id,
  req
});

res.status(200).json({ message: "Logged out successfully" });

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

module.exports = {
  register,
  login,
  getMe,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getTeamMembers,
  updatePassword,
  logout,
};
