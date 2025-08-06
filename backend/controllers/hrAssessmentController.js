// controllers/hrAssessmentController.js
const { HRAssessment, OnboardingProgress, User, OnboardingTask, UserTaskProgress } = require("../models");
const { Op } = require("sequelize");

// Initialize HR assessment when Phase 2 is completed
const initializeHRAssessment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { hrId } = req.body;

    if (!hrId) {
      return res.status(400).json({ message: "HR ID is required" });
    }

    // Check if user has completed Phase 2
    const onboardingProgress = await OnboardingProgress.findOne({
      where: { UserId: userId },
    });

    if (!onboardingProgress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    if (onboardingProgress.stage !== "phase_2") {
      return res.status(400).json({ message: "User must be in Phase 2 to initialize HR assessment" });
    }

    // Check if all Phase 2 tasks are completed
    const phase2Tasks = await OnboardingTask.findAll({
      where: { 
        stage: "phase_2",
        journeyType: { [Op.or]: [onboardingProgress.journeyType, "both"] }
      },
    });

    const userTaskProgress = await UserTaskProgress.findAll({
      where: { 
        UserId: userId,
        OnboardingTaskId: { [Op.in]: phase2Tasks.map(task => task.id) }
      },
    });

    const allTasksCompleted = phase2Tasks.length > 0 && 
      userTaskProgress.length === phase2Tasks.length &&
      userTaskProgress.every(task => task.isCompleted);

    if (!allTasksCompleted) {
      return res.status(400).json({ message: "All Phase 2 tasks must be completed before HR assessment" });
    }

    // Check if HR assessment already exists
    const existingAssessment = await HRAssessment.findOne({
      where: { OnboardingProgressId: onboardingProgress.id }
    });

    if (existingAssessment) {
      return res.status(400).json({ message: "HR assessment already exists for this user" });
    }

    // Create HR assessment
    const hrAssessment = await HRAssessment.create({
      OnboardingProgressId: onboardingProgress.id,
      UserId: userId,
      HRId: hrId,
      status: "pending_assessment",
      phase2CompletedDate: new Date(),
      assessmentRequestedDate: new Date(),
    });

    res.status(201).json({
      message: "HR assessment initialized successfully",
      assessment: hrAssessment
    });
  } catch (error) {
    console.error("Error initializing HR assessment:", error);
    res.status(500).json({ message: "Error initializing HR assessment" });
  }
};

// Conduct HR assessment
const conductAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { assessmentNotes, assessmentScore } = req.body;

    if (!assessmentNotes) {
      return res.status(400).json({ message: "Assessment notes are required" });
    }

    const assessment = await HRAssessment.findByPk(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "HR assessment not found" });
    }

    if (assessment.status !== "pending_assessment") {
      return res.status(400).json({ message: "Assessment is not in pending status" });
    }

    await assessment.update({
      assessmentNotes,
      assessmentScore: assessmentScore || null,
      assessmentDate: new Date(),
      status: "assessment_completed",
    });

    res.json({
      message: "HR assessment completed successfully",
      assessment
    });
  } catch (error) {
    console.error("Error conducting HR assessment:", error);
    res.status(500).json({ message: "Error conducting HR assessment" });
  }
};

// Make HR decision
const makeDecision = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { hrDecision, hrDecisionComments } = req.body;

    if (!hrDecision || !["approve", "reject", "request_changes"].includes(hrDecision)) {
      return res.status(400).json({ message: "Valid HR decision is required" });
    }

    if (!hrDecisionComments) {
      return res.status(400).json({ message: "HR decision comments are required" });
    }

    const assessment = await HRAssessment.findByPk(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "HR assessment not found" });
    }

    if (assessment.status !== "assessment_completed") {
      return res.status(400).json({ message: "Assessment must be completed before making decision" });
    }

    await assessment.update({
      hrDecision,
      hrDecisionComments,
      hrDecisionDate: new Date(),
      status: "decision_made",
    });

    // If approved, mark onboarding as completed
    if (hrDecision === "approve") {
      const onboardingProgress = await OnboardingProgress.findByPk(assessment.OnboardingProgressId);
      if (onboardingProgress) {
        await onboardingProgress.update({
          status: "completed",
        });
      }
    }

    res.json({
      message: "HR decision made successfully",
      assessment
    });
  } catch (error) {
    console.error("Error making HR decision:", error);
    res.status(500).json({ message: "Error making HR decision" });
  }
};

// Get HR assessment details
const getAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await HRAssessment.findByPk(assessmentId, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: 'hr',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!assessment) {
      return res.status(404).json({ message: "HR assessment not found" });
    }

    res.json({
      assessment
    });
  } catch (error) {
    console.error("Error getting HR assessment:", error);
    res.status(500).json({ message: "Error getting HR assessment" });
  }
};

// Get HR assessments by HR user
const getHRAssessments = async (req, res) => {
  try {
    const { hrId } = req.params;

    const assessments = await HRAssessment.findAll({
      where: { HRId: hrId },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: 'hr',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      assessments
    });
  } catch (error) {
    console.error("Error getting HR assessments:", error);
    res.status(500).json({ message: "Error getting HR assessments" });
  }
};

// Get all HR assessments (for the assessment queue)
const getPendingHRAssessments = async (req, res) => {
  try {
    const assessments = await HRAssessment.findAll({
      // Remove the status filter to get ALL assessments
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: 'hr',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      assessments
    });
  } catch (error) {
    console.error("Error getting HR assessments:", error);
    res.status(500).json({ message: "Error getting HR assessments" });
  }
};

module.exports = {
  initializeHRAssessment,
  conductAssessment,
  makeDecision,
  getAssessment,
  getHRAssessments,
  getPendingHRAssessments,
}; 