const models = require("../models");
const { Evaluation, User, EvaluationCriteria } = models;
const { validationResult } = require("express-validator");
const { Parser } = require("json2csv");
const { Op } = require("sequelize");

// Get all evaluations
const getAllEvaluations = async (req, res) => {
  try {
    const { employeeId, status, type, departmentId, supervisorId, startDate, endDate } = req.query;
    const where = {};
    
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (type) where.type = type;

    // Add filtering for departmentId and supervisorId through associations
    const include = [
      { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
      { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
    ];

    if (departmentId) {
      // Assuming User model has a departmentId field
      include[0].where = { departmentId }; // Filter by employee's department
      // Or, if filtering by supervisor's department:
      // include[1].where = { departmentId }; // Filter by supervisor's department
      // Let's assume filtering by employee's department for now based on typical reporting needs.
      // If filtering by supervisor's department is needed, we can add another parameter or adjust.
    }

    if (supervisorId) {
        // This filter is already handled by the general where clause if supervisorId matches evaluatorId
        // However, if we want to filter by supervisor of the *employee* on the evaluation, it would be:
        // include[0].where = { ...include[0].where, supervisorId };
        // Sticking to filtering by the evaluatorId for now, as per getEvaluatorEvaluations.
        // If filtering by the employee's supervisor is needed, this logic needs adjustment.
    }

    // Add filtering for date range (assuming on createdAt)
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      where.createdAt = {
        [Op.lte]: new Date(endDate),
      };
    }

    const evaluations = await Evaluation.findAll({
      where,
      include,
    });
    res.json(evaluations);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get evaluation by ID
const getEvaluationById = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id, {
      include: [
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
        { model: EvaluationCriteria, as: "criteria" },
      ],
    });

    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    // Authorization check
    const user = req.user;
    const isOwner = user.id === evaluation.employeeId;
    const isManagerOrHr = ['manager', 'hr'].includes(user.role);
    const isSupervisorForEmployee = user.role === 'supervisor' && (user.id === evaluation.evaluatorId || user.id === evaluation.employee?.supervisorId);

    if (isOwner || isManagerOrHr || isSupervisorForEmployee) {
      return res.json(evaluation);
    }

    return res.status(403).json({ message: 'Forbidden' });

  } catch (error) {
    console.error("Error fetching evaluation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new evaluation
const createEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      employeeId,
      dueDate,
      status,
      comments,
      ratings,
      title,
      type,
      criteria = [],
    } = req.body;

    // Fetch the employee to get their supervisorId
    const User = require('../models/User');
    const employee = await User.findByPk(employeeId);
    if (!employee) {
      return res.status(400).json({ message: 'Employee not found' });
    }
    const evaluatorId = employee.supervisorId;
    if (!evaluatorId) {
      return res.status(400).json({ message: 'Employee does not have a supervisor assigned' });
    }

    // Only pass allowed fields to Evaluation.create
    const evalData = {
      employeeId,
      evaluatorId,
      type,
      dueDate,
      status,
      comments,
      ratings,
      title,
    };
    console.log('Creating evaluation with:', evalData);
    const evaluation = await Evaluation.create(evalData);

    // Create criteria if provided
    if (Array.isArray(criteria) && criteria.length > 0) {
      const EvaluationCriteria = require('../models/EvaluationCriteria');
      console.log('Creating criteria:', criteria);
      await Promise.all(criteria.map(c => EvaluationCriteria.create({
        evaluationId: evaluation.id,
        category: c.category || '',
        criteria: c.name || c.criteria || '',
        rating: c.rating ?? null,
        comments: c.comments || '',
      })));
    }

    res.status(201).json(evaluation);
  } catch (error) {
    console.error("Error creating evaluation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update evaluation
const updateEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const evaluation = await Evaluation.findByPk(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    // Authorization Check
    const user = req.user;
    const isOwner = user.id === evaluation.employeeId;
    const isSupervisorOrHr = ['supervisor', 'hr'].includes(user.role);

    if (!isOwner && !isSupervisorOrHr) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const {
      dueDate,
      status,
      comments,
      ratings,
      title,
      type,
      criteria,
    } = req.body;

    console.log('Type received in update body:', type);
    console.log('Evaluation object before update:', evaluation);

    await evaluation.update({
      type: type || evaluation.type,
      dueDate: dueDate || evaluation.dueDate,
      status: status || evaluation.status,
      comments: comments || evaluation.comments,
      ratings: ratings || evaluation.ratings,
      title: title || evaluation.title,
      criteria: criteria || evaluation.criteria,
    });

    res.json(evaluation);
  } catch (error) {
    console.error("Error updating evaluation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete evaluation
const deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    await evaluation.destroy();
    res.json({ message: "Evaluation deleted successfully" });
  } catch (error) {
    console.error("Error deleting evaluation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get employee evaluations
const getEmployeeEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      where: { employeeId: req.params.id },
      include: [
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
        { model: EvaluationCriteria, as: "criteria" }, // Include criteria in the response
      ],
    });
    res.json(evaluations);
  } catch (error) {
    console.error("Error fetching employee evaluations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get evaluator evaluations
const getEvaluatorEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      where: { evaluatorId: req.params.supervisorId },
      include: [
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
      ],
    });
    res.json(evaluations);
  } catch (error) {
    console.error("Error fetching evaluator evaluations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's evaluations
const getUserEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      where: { employeeId: req.user.id },
      include: [
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
        { model: EvaluationCriteria, as: "criteria" },
      ],
    });
    res.json(evaluations);
  } catch (error) {
    console.error("Error fetching user evaluations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get supervisor's evaluations
const getSupervisorEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      where: { evaluatorId: req.user.id },
      include: [
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
      ],
    });
    res.json(evaluations);
  } catch (error) {
    console.error("Error fetching supervisor evaluations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get review evaluations
const getReviewEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      where: { status: "pending_review" },
      include: [
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "evaluator", attributes: { exclude: ['passwordHash'] } },
      ],
    });
    res.json(evaluations);
  } catch (error) {
    console.error("Error fetching review evaluations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Review evaluation
const reviewEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    const { status, reviewComments } = req.body;
    await evaluation.update({
      status,
      reviewComments,
    });

    res.json(evaluation);
  } catch (error) {
    console.error("Error reviewing evaluation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Submit evaluation
const submitEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const evaluation = await models.Evaluation.findByPk(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    const { scores } = req.body; // Array of { criteriaId, score, comments }

    // Update individual criteria scores and comments
    if (scores && Array.isArray(scores)) {
      for (const score of scores) {
        const criteria = await models.EvaluationCriteria.findByPk(score.criteriaId);
        if (criteria) {
          await criteria.update({
            rating: score.score, // Update the 'rating' column in evaluation_criteria
            comments: score.comments, // Update the 'comments' column in evaluation_criteria
          });
        }
      }
    }

    // Update the overall evaluation status
    await evaluation.update({
      status: "in_progress", // Changed status to a valid ENUM value
      // Removed the incorrect 'scores' update here
    });

    // Fetch the updated evaluation with criteria to return in the response
    const updatedEvaluation = await models.Evaluation.findByPk(req.params.id, {
      include: [
        { model: models.User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: models.User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
        { model: models.EvaluationCriteria, as: "criteria" }, // Include criteria in the response
      ],
    });

    res.json(updatedEvaluation);
  } catch (error) {
    console.error("Error submitting evaluation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export evaluations as CSV
const exportEvaluationCSV = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll();
    const fields = [
      "employeeId",
      "evaluatorId",
      "criteria",
      "comments",
      "createdAt",
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(evaluations.map((e) => e.toJSON()));
    res.header("Content-Type", "text/csv");
    res.attachment("evaluation_report.csv");
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: "Failed to export evaluations" });
  }
};

// Add evaluation criterion
const addEvaluationCriteria = async (req, res) => {
  try {
    // Temporarily requiring model directly for debugging
    const EvaluationCriteria = require('../models/EvaluationCriteria');

    console.log('Testing EvaluationCriteria access (direct require):', EvaluationCriteria);

    // Re-enabling database interaction
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { evaluationId } = req.params;
    const { category, name, rating, comments } = req.body;

    const evaluation = await models.Evaluation.findByPk(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    const newCriteria = await EvaluationCriteria.create({
      evaluationId,
      category,
      criteria: name, // Assuming 'name' from body maps to 'criteria' in DB
      rating: rating, // Using 'rating' from body and mapping to 'rating' in DB
      comments,
    });

    res.status(201).json(newCriteria);
  } catch (error) {
    console.error("Error adding evaluation criteria:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update evaluation criterion
const updateEvaluationCriteria = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params; // Criterion ID
    const { category, name, rating, comments } = req.body;

    const criteria = await models.EvaluationCriteria.findByPk(id);
    if (!criteria) {
      return res.status(404).json({ message: "Evaluation criteria not found" });
    }

    await criteria.update({
      category,
      criteria: name, // Assuming 'name' from body maps to 'criteria' in DB
      rating, // Using 'rating' from body
      comments,
    });

    res.json(criteria);
  } catch (error) {
    console.error("Error updating evaluation criteria:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete evaluation criterion
const deleteEvaluationCriterion = async (req, res) => {
  try {
    const { id } = req.params; // Criterion ID

    const criterion = await models.EvaluationCriteria.findByPk(id);
    if (!criterion) {
      return res.status(404).json({ message: "Evaluation criterion not found" });
    }

    await criterion.destroy();
    res.json({ message: "Evaluation criterion deleted successfully" });
  } catch (error) {
    console.error("Error deleting evaluation criterion:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get evaluation criteria by evaluation ID
const getEvaluationCriteriaByEvaluationId = async (req, res) => {
  try {
    const { evaluationId } = req.params;

    const criteria = await models.EvaluationCriteria.findAll({
      where: { evaluationId: evaluationId },
      // Optionally include related data if needed, e.g., for the criterion type or category details
    });

    if (!criteria || criteria.length === 0) {
      // Return 404 if the evaluation or its criteria are not found
      // Or return an empty array if the evaluation exists but has no criteria
      // Let's return an empty array if no criteria are found, as the evaluation might exist.
      return res.json([]);
    }

    res.json(criteria);
  } catch (error) {
    console.error("Error fetching evaluation criteria by evaluation ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Validate evaluation
const validateEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }
    const { status, reviewComments, reviewNotes, comments } = req.body;
    // Use comments for review feedback
    await evaluation.update({
      status: status || evaluation.status,
      comments: comments || reviewComments || reviewNotes || evaluation.comments,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    });
    res.json(evaluation);
  } catch (error) {
    console.error("Error validating evaluation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const addEmployeeComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const evaluation = await Evaluation.findByPk(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    // Authorization: Ensure the user is the employee for this evaluation
    if (req.user.id !== evaluation.employeeId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Update the comments.
    const { comment, criteria } = req.body;
    await evaluation.update({ comments: comment });

    // If criteria ratings are provided, update them
    if (Array.isArray(criteria)) {
      const EvaluationCriteria = require('../models/EvaluationCriteria');
      for (const c of criteria) {
        if (c.id && typeof c.rating === 'number') {
          await EvaluationCriteria.update(
            { rating: c.rating },
            { where: { id: c.id, evaluationId: evaluation.id } }
          );
        }
      }
    }

    res.json({ message: 'Comment and ratings updated successfully.' });
  } catch (error) {
    console.error("Error adding employee comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send reminder for evaluation
const sendEvaluationReminder = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id, {
      include: [
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
      ],
    });

    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    // Authorization: Only HR and managers can send reminders
    const user = req.user;
    if (!['hr', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: "Not authorized to send reminders" });
    }

    // Send notification to the evaluator (supervisor)
    const { sendNotification } = require('../utils/notificationHelper');
    
    await sendNotification({
      userId: evaluation.evaluatorId,
      type: 'evaluation_reminder',
      title: 'Evaluation Reminder',
      message: `Reminder: You have a pending evaluation for ${evaluation.employee?.name || 'an employee'} due on ${evaluation.dueDate ? new Date(evaluation.dueDate).toLocaleDateString() : 'soon'}. Please complete it as soon as possible.`,
      metadata: {
        evaluationId: evaluation.id,
        employeeId: evaluation.employeeId,
        evaluationType: evaluation.type,
        dueDate: evaluation.dueDate
      }
    });

    // Also send notification to the employee if the evaluation is overdue
    const now = new Date();
    const dueDate = evaluation.dueDate ? new Date(evaluation.dueDate) : null;
    if (dueDate && dueDate < now) {
      await sendNotification({
        userId: evaluation.employeeId,
        type: 'evaluation_overdue',
        title: 'Evaluation Overdue',
        message: `Your evaluation is overdue. Please contact your supervisor to complete it as soon as possible.`,
        metadata: {
          evaluationId: evaluation.id,
          evaluatorId: evaluation.evaluatorId,
          evaluationType: evaluation.type,
          dueDate: evaluation.dueDate
        }
      });
    }

    res.json({ message: "Reminder sent successfully" });
  } catch (error) {
    console.error("Error sending evaluation reminder:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export a single evaluation as CSV
const exportSingleEvaluationCSV = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id, {
      include: [
        { model: User, as: "employee", attributes: ["id", "name", "email"] },
        { model: User, as: "supervisor", attributes: ["id", "name", "email"] },
        { model: EvaluationCriteria, as: "criteria" }
      ]
    });
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    // Flatten criteria for CSV (as JSON string)
    const criteria = evaluation.criteria?.map(c => ({
      category: c.category,
      criteria: c.criteria,
      rating: c.rating,
      comments: c.comments
    })) || [];

    const row = {
      evaluationId: evaluation.id,
      employeeName: evaluation.employee?.name || "",
      employeeEmail: evaluation.employee?.email || "",
      evaluatorName: evaluation.supervisor?.name || "",
      evaluatorEmail: evaluation.supervisor?.email || "",
      type: evaluation.type,
      status: evaluation.status,
      overallScore: evaluation.overallScore,
      comments: evaluation.comments,
      dueDate: evaluation.dueDate,
      createdAt: evaluation.createdAt,
      criteria: JSON.stringify(criteria)
    };

    const fields = Object.keys(row);
    const parser = new Parser({ fields });
    const csv = parser.parse([row]);
    res.header("Content-Type", "text/csv");
    res.attachment(`evaluation-${evaluation.id}.csv`);
    return res.send(csv);
  } catch (error) {
    console.error("Error exporting evaluation as CSV:", error);
    res.status(500).json({ error: "Failed to export evaluation" });
  }
};

module.exports = {
  getAllEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getEmployeeEvaluations,
  getEvaluatorEvaluations,
  getUserEvaluations,
  getSupervisorEvaluations,
  getReviewEvaluations,
  reviewEvaluation,
  submitEvaluation,
  exportEvaluationCSV,
  addEvaluationCriteria,
  updateEvaluationCriteria,
  deleteEvaluationCriterion,
  getEvaluationCriteriaByEvaluationId,
  validateEvaluation,
  addEmployeeComment,
  sendEvaluationReminder,
  exportSingleEvaluationCSV,
};
