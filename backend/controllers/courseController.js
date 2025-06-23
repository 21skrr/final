const { Course, User, UserCourse } = require("../models");
const { validationResult } = require("express-validator");

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new course
const createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, totalModules, programType } = req.body;
    const course = await Course.create({
      title,
      totalModules,
      programType,
    });

    res.status(201).json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const { title, totalModules, programType } = req.body;
    await course.update({
      title: title || course.title,
      totalModules: totalModules || course.totalModules,
      programType: programType || course.programType,
    });

    res.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await course.destroy();
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's courses
const getUserCourses = async (req, res) => {
  try {
    const userCourses = await UserCourse.findAll({
      where: { userId: req.user.id },
      include: [{ model: Course }],
    });
    res.json(userCourses);
  } catch (error) {
    console.error("Error fetching user courses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Assign course to user
const assignCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, userId } = req.body;

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if course is already assigned
    const existingAssignment = await UserCourse.findOne({
      where: { courseId, userId },
    });
    if (existingAssignment) {
      return res
        .status(400)
        .json({ message: "Course already assigned to user" });
    }

    // Create assignment
    const userCourse = await UserCourse.create({
      courseId,
      userId,
      progress: 0,
      modulesCompleted: 0,
    });

    res.status(201).json(userCourse);
  } catch (error) {
    console.error("Error assigning course:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update course progress
const updateCourseProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { progress, modulesCompleted } = req.body;
    const userCourse = await UserCourse.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!userCourse) {
      return res.status(404).json({ message: "Course assignment not found" });
    }

    await userCourse.update({
      progress: progress || userCourse.progress,
      modulesCompleted: modulesCompleted || userCourse.modulesCompleted,
    });

    res.json(userCourse);
  } catch (error) {
    console.error("Error updating course progress:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove course from user
const removeUserCourse = async (req, res) => {
  try {
    const userCourse = await UserCourse.findOne({
      where: { id: req.params.id },
    });

    if (!userCourse) {
      return res.status(404).json({ message: "Course assignment not found" });
    }

    await userCourse.destroy();
    res.json({ message: "Course removed from user successfully" });
  } catch (error) {
    console.error("Error removing course from user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getUserCourses,
  assignCourse,
  updateCourseProgress,
  removeUserCourse,
};
