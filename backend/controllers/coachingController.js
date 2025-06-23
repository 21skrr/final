const { CoachingSession, User } = require("../models");
const { validationResult } = require("express-validator");

// Get supervisor's coaching sessions
const getSupervisorSessions = async (req, res) => {
  try {
    const sessions = await CoachingSession.findAll({
      where: { supervisorId: req.user.id },
      include: [
        { model: User, as: "supervisor" },
        { model: User, as: "employee" },
      ],
    });
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching supervisor sessions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get employee's coaching sessions
const getEmployeeSessions = async (req, res) => {
  try {
    const sessions = await CoachingSession.findAll({
      where: { employeeId: req.user.id },
      include: [
        { model: User, as: "supervisor" },
        { model: User, as: "employee" },
      ],
    });
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching employee sessions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get session by ID
const getSessionById = async (req, res) => {
  try {
    const session = await CoachingSession.findByPk(req.params.id, {
      include: [
        { model: User, as: "supervisor" },
        { model: User, as: "employee" },
      ],
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create coaching session
const createSession = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId, date, duration, notes, goals } = req.body;
    const session = await CoachingSession.create({
      supervisorId: req.user.id,
      employeeId,
      date,
      duration,
      notes,
      goals,
    });

    res.status(201).json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update coaching session
const updateSession = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const session = await CoachingSession.findByPk(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const { date, duration, notes, goals } = req.body;
    await session.update({
      date: date || session.date,
      duration: duration || session.duration,
      notes: notes || session.notes,
      goals: goals || session.goals,
    });

    res.json(session);
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete coaching session
const deleteSession = async (req, res) => {
  try {
    const session = await CoachingSession.findByPk(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await session.destroy();
    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getSupervisorSessions,
  getEmployeeSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
};
