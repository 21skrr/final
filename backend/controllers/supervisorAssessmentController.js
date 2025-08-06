// controllers/supervisorAssessmentController.js
const { SupervisorAssessment, OnboardingProgress, User, OnboardingTask, UserTaskProgress } = require("../models");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/certificates");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image, PDF, and document files are allowed!"));
    }
  },
});

// Initialize assessment when Phase 1 is completed
const initializeAssessment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { supervisorId } = req.body;

    if (!supervisorId) {
      return res.status(400).json({ message: "Supervisor ID is required" });
    }

    // Check if user has completed Phase 1
    const onboardingProgress = await OnboardingProgress.findOne({
      where: { UserId: userId },
      include: [
        {
          model: OnboardingTask,
          through: { model: UserTaskProgress },
          where: { stage: "phase_1" },
        },
      ],
    });

    if (!onboardingProgress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Check if all Phase 1 tasks are completed
    const phase1Tasks = await OnboardingTask.findAll({
      where: { 
        stage: "phase_1",
        journeyType: { [Op.or]: [onboardingProgress.journeyType, "both"] }
      },
    });

    const userTaskProgress = await UserTaskProgress.findAll({
      where: { 
        UserId: userId,
        OnboardingTaskId: { [Op.in]: phase1Tasks.map(task => task.id) }
      },
    });

    const allTasksCompleted = phase1Tasks.length > 0 && 
      userTaskProgress.length === phase1Tasks.length &&
      userTaskProgress.every(task => task.isCompleted);

    if (!allTasksCompleted) {
      return res.status(400).json({ 
        message: "All Phase 1 tasks must be completed before starting assessment" 
      });
    }

    // Check if assessment already exists
    const existingAssessment = await SupervisorAssessment.findOne({
      where: { OnboardingProgressId: onboardingProgress.id }
    });

    if (existingAssessment) {
      return res.status(400).json({ 
        message: "Assessment already exists for this user" 
      });
    }

    // Create new assessment
    const assessment = await SupervisorAssessment.create({
      OnboardingProgressId: onboardingProgress.id,
      UserId: userId,
      SupervisorId: supervisorId,
      status: "pending_certificate",
      phase1CompletedDate: new Date(),
    });

    res.status(201).json({
      message: "Assessment initialized successfully",
      assessment: {
        id: assessment.id,
        status: assessment.status,
        phase1CompletedDate: assessment.phase1CompletedDate,
      },
    });
  } catch (error) {
    console.error("Error initializing assessment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Upload certificate
const uploadCertificate = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "Certificate file is required" });
    }

    const assessment = await SupervisorAssessment.findByPk(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Update assessment with certificate file
    await assessment.update({
      certificateFile: req.file.filename,
      certificateUploadDate: new Date(),
      status: "certificate_uploaded",
    });

    res.json({
      message: "Certificate uploaded successfully",
      certificateFile: req.file.filename,
    });
  } catch (error) {
    console.error("Error uploading certificate:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Conduct assessment
const conductAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { assessmentNotes, assessmentScore } = req.body;

    if (!assessmentNotes) {
      return res.status(400).json({ message: "Assessment notes are required" });
    }

    if (assessmentScore && (assessmentScore < 0 || assessmentScore > 100)) {
      return res.status(400).json({ message: "Assessment score must be between 0 and 100" });
    }

    const assessment = await SupervisorAssessment.findByPk(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    if (assessment.status !== "certificate_uploaded") {
      return res.status(400).json({ 
        message: "Certificate must be uploaded before conducting assessment" 
      });
    }

    await assessment.update({
      assessmentNotes,
      assessmentScore: assessmentScore || null,
      assessmentDate: new Date(),
      status: "assessment_completed",
    });

    res.json({
      message: "Assessment completed successfully",
      assessment: {
        id: assessment.id,
        assessmentNotes: assessment.assessmentNotes,
        assessmentScore: assessment.assessmentScore,
        assessmentDate: assessment.assessmentDate,
        status: assessment.status,
      },
    });
  } catch (error) {
    console.error("Error conducting assessment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Make supervisor decision
const makeDecision = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { decision, comments } = req.body;

    if (!decision || !["proceed_to_phase_2", "terminate", "put_on_hold"].includes(decision)) {
      return res.status(400).json({ 
        message: "Valid decision is required (proceed_to_phase_2, terminate, or put_on_hold)" 
      });
    }

    if (!comments) {
      return res.status(400).json({ message: "Comments are required for the decision" });
    }

    const assessment = await SupervisorAssessment.findByPk(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    if (assessment.status !== "assessment_completed") {
      return res.status(400).json({ 
        message: "Assessment must be completed before making a decision" 
      });
    }

    await assessment.update({
      supervisorDecision: decision,
      supervisorComments: comments,
      decisionDate: new Date(),
      status: "hr_approval_pending",
    });

    // If decision is to proceed to Phase 2, update onboarding progress
    if (decision === "proceed_to_phase_2") {
      const onboardingProgress = await OnboardingProgress.findByPk(assessment.OnboardingProgressId);
      if (onboardingProgress) {
        await onboardingProgress.update({
          stage: "phase_2",
          stageStartDate: new Date(),
        });
      }
    }

    res.json({
      message: "Decision made successfully",
      decision: {
        supervisorDecision: assessment.supervisorDecision,
        supervisorComments: assessment.supervisorComments,
        decisionDate: assessment.decisionDate,
        status: assessment.status,
      },
    });
  } catch (error) {
    console.error("Error making decision:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// HR approval
const hrApprove = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { decision, comments } = req.body;

    if (!decision || !["approve", "reject", "request_changes"].includes(decision)) {
      return res.status(400).json({ 
        message: "Valid HR decision is required (approve, reject, or request_changes)" 
      });
    }

    if (!comments) {
      return res.status(400).json({ message: "HR decision comments are required" });
    }

    const assessment = await SupervisorAssessment.findByPk(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    if (assessment.status !== "hr_approval_pending") {
      return res.status(400).json({ 
        message: "Assessment must be pending HR approval" 
      });
    }

    let newStatus = "hr_approved";
    if (decision === "reject") {
      newStatus = "hr_rejected";
    } else if (decision === "request_changes") {
      newStatus = "assessment_pending"; // Go back to assessment stage
    }

    await assessment.update({
      hrDecision: decision,
      hrDecisionComments: comments,
      hrDecisionDate: new Date(),
      hrValidatorId: req.user.id,
      status: newStatus,
    });

    // If approved and supervisor decision was to proceed, advance to Phase 2
    if (decision === "approve" && assessment.supervisorDecision === "proceed_to_phase_2") {
      const onboardingProgress = await OnboardingProgress.findByPk(assessment.OnboardingProgressId);
      if (onboardingProgress) {
        await onboardingProgress.update({
          stage: "phase_2",
          stageStartDate: new Date(),
        });
      }
    }

    res.json({
      message: "HR decision completed successfully",
      decision: {
        hrDecision: assessment.hrDecision,
        hrDecisionComments: assessment.hrDecisionComments,
        hrDecisionDate: assessment.hrDecisionDate,
        status: assessment.status,
      },
    });
  } catch (error) {
    console.error("Error in HR approval:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get assessment details
const getAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await SupervisorAssessment.findByPk(assessmentId, {
      include: [
        {
          model: User,
          as: "employee",
          attributes: ["id", "name", "email", "department"],
        },
        {
          model: User,
          as: "supervisor",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "hrValidator",
          attributes: ["id", "name", "email"],
        },
        {
          model: OnboardingProgress,
          attributes: ["id", "stage", "progress", "journeyType"],
        },
      ],
    });

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    res.json({
      assessment,
    });
  } catch (error) {
    console.error("Error getting assessment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get assessments by supervisor
const getSupervisorAssessments = async (req, res) => {
  try {
    const { supervisorId } = req.params;

    const assessments = await SupervisorAssessment.findAll({
      where: { SupervisorId: supervisorId },
      include: [
        {
          model: User,
          as: "employee",
          attributes: ["id", "name", "email", "department"],
        },
        {
          model: OnboardingProgress,
          attributes: ["id", "stage", "progress", "journeyType"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      assessments,
    });
  } catch (error) {
    console.error("Error getting supervisor assessments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all supervisor assessments (for the HR approval queue)
const getPendingHRApproval = async (req, res) => {
  try {
    const assessments = await SupervisorAssessment.findAll({
      // Remove the status filter to get ALL supervisor assessments
      include: [
        {
          model: User,
          as: "employee",
          attributes: ["id", "name", "email", "department"],
        },
        {
          model: User,
          as: "supervisor",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "hrValidator",
          attributes: ["id", "name", "email"],
        },
        {
          model: OnboardingProgress,
          attributes: ["id", "stage", "progress", "journeyType"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      assessments,
    });
  } catch (error) {
    console.error("Error getting supervisor assessments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  initializeAssessment,
  uploadCertificate,
  conductAssessment,
  makeDecision,
  hrApprove,
  getAssessment,
  getSupervisorAssessments,
  getPendingHRApproval,
  upload, // Export multer upload for use in routes
}; 