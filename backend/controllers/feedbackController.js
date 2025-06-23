const { Feedback, User, FeedbackNote, FeedbackFollowup, FeedbackFollowupParticipant } = require("../models");
const { validationResult } = require("express-validator");
const { Parser } = require("json2csv");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const logActivity = require("../utils/logActivity");
const { getSystemSetting } = require("../utils/systemSettingsService");
const sequelize = require("sequelize");

// Get sent feedback
const getSentFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findAll({
      where: { fromUserId: req.user.id },
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" },
      ],
    });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching sent feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get received feedback
const getReceivedFeedback = async (req, res) => {
  try {
    // HR sees all feedback, others see only their own
    const whereClause =
      req.user.role === "hr"
        ? {} // all feedback
        : { toUserId: req.user.id };

    const feedback = await Feedback.findAll({
      where: whereClause,
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" },
      ],
    });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching received feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get department feedback
const getDepartmentFeedback = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    // Get user's department if they're a manager
    let userDepartment;
    if (req.user.role === 'manager') {
      const user = await User.findByPk(req.user.id);
      userDepartment = user.department;
    }

    // Build base where clause
    const whereClause = {};
    
    // Add date filter if provided
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Add type filter if category is provided
    if (category) {
      whereClause.type = category;
    }

    // Build receiver where clause based on role
    const receiverWhere = {};
    if (req.user.role === 'manager') {
      receiverWhere.department = userDepartment;
    }

    const feedback = await Feedback.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: "receiver",
          where: receiverWhere,
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: FeedbackNote,
          as: "notes",
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'supervisor',
            attributes: ['id', 'name', 'role']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format the response
    const formattedFeedback = feedback.map(f => {
      const plainFeedback = f.get({ plain: true });
      return {
        ...plainFeedback,
        sender_name: f.isAnonymous ? 'Anonymous' : plainFeedback.sender?.name,
        sender_email: f.isAnonymous ? null : plainFeedback.sender?.email,
        sender_department: f.isAnonymous ? null : plainFeedback.sender?.department,
        receiver_name: plainFeedback.receiver?.name,
        receiver_email: plainFeedback.receiver?.email,
        receiver_department: plainFeedback.receiver?.department,
        latest_response: plainFeedback.notes?.[0]?.note,
        response_status: plainFeedback.notes?.[0]?.status,
        response_date: plainFeedback.notes?.[0]?.created_at,
        responder_name: plainFeedback.notes?.[0]?.supervisor?.name
      };
    });

    res.json(formattedFeedback);
  } catch (error) {
    console.error("Error fetching department feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create feedback
const createFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, content, isAnonymous, shareWithSupervisor } = req.body;

    // Get the user's supervisor if shareWithSupervisor is true
    let toUserId = null;
    let toDepartment = null;
    
    if (shareWithSupervisor) {
      const user = await User.findByPk(req.user.id, {
        attributes: ['supervisorId']
      });
      toUserId = user.supervisorId;
    } else {
      // If not sharing with supervisor, send to department
      const user = await User.findByPk(req.user.id, {
        attributes: ['department']
      });
      toDepartment = user.department;
    }

   // Get feedback notification template from system settings
const notificationTemplate = await getSystemSetting("feedbackNotificationTemplate");

// Replace placeholders in the template with actual content
const finalMessage = notificationTemplate
  ?.replace("{{sender}}", req.user.name)
  ?.replace("{{message}}", content)
  || content; // Fallback to original content if template is missing

const feedback = await Feedback.create({
  fromUserId: req.user.id,
  toUserId,
  toDepartment,
  type,
  message: finalMessage,
  isAnonymous: isAnonymous ? 1 : 0
});

    await logActivity({
      userId: req.user.id,
      action: "feedback_submitted",
      entityType: "feedback",
      entityId: feedback.id,
      details: feedback,
      req
    });
    

    // Include user information in response
    const feedbackWithUser = await Feedback.findByPk(feedback.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email', 'department']
        }
      ]
    });

    res.status(201).json(feedbackWithUser);
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Edit feedback
const editFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { content } = req.body;

    const feedback = await Feedback.findByPk(feedbackId);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Ensure the user is the original sender
    if (feedback.fromUserId !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to edit this feedback." });
    }

    // Prevent editing if feedback is already being reviewed or is completed
    if (feedback.status && feedback.status !== 'pending') {
        return res.status(403).json({ message: `Cannot edit feedback with status: ${feedback.status}` });
    }

    // Update the feedback content
    feedback.message = content;
    await feedback.save();
    
    await logActivity({
      userId: req.user.id,
      action: "feedback_edited",
      entityType: "feedback",
      entityId: feedback.id,
      details: { new_content: content },
      req
    });

    res.json(feedback);
  } catch (error) {
    console.error("Error editing feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
  try {
    const { reason } = req.body; // For HR to provide a reason for audit trail
    const feedback = await Feedback.findByPk(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    const isSender = feedback.fromUserId === req.user.id;
    const isHr = req.user.role === 'hr';

    // HR can delete any feedback, but must provide a reason.
    if (isHr) {
      if (!reason) {
        return res.status(400).json({ message: "A reason is required for HR to delete feedback." });
      }
    } else {
      // Employee's original deletion logic: can only delete their own pending/anonymous feedback.
      const canEmployeeDelete = isSender && (feedback.isAnonymous || !feedback.status || feedback.status === 'pending');
      if (!canEmployeeDelete) {
        return res.status(403).json({ message: "Not authorized to delete this feedback at its current stage." });
      }
    }

    await feedback.destroy();
    
    await logActivity({
      userId: req.user.id,
      action: "feedback_deleted",
      entityType: "feedback",
      entityId: req.params.id,
      details: { reason: isHr ? `Deleted by HR: ${reason}` : "Withdrawn by employee" },
      req
    });

    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export feedback
const exportFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { format = 'csv', dateRange = 'monthly', category = 'all' } = req.query;

    // Build date filter
    const dateFilter = {};
    const now = new Date();
    switch (dateRange) {
      case 'daily':
        dateFilter.createdAt = {
          [Op.gte]: new Date(now.setHours(0, 0, 0, 0))
        };
        break;
      case 'weekly':
        dateFilter.createdAt = {
          [Op.gte]: new Date(now.setDate(now.getDate() - 7))
        };
        break;
      case 'monthly':
        dateFilter.createdAt = {
          [Op.gte]: new Date(now.setMonth(now.getMonth() - 1))
        };
        break;
      case 'yearly':
        dateFilter.createdAt = {
          [Op.gte]: new Date(now.setFullYear(now.getFullYear() - 1))
        };
        break;
    }

    // Build category filter
    const categoryFilter = category !== 'all' ? { type: category } : {};

    // Fetch feedback with filters
    const feedbacks = await Feedback.findAll({
      where: {
        ...dateFilter,
        ...categoryFilter
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: "receiver",
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: FeedbackNote,
          as: "notes",
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'supervisor',
            attributes: ['id', 'name', 'role']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format the data
    const formattedData = feedbacks.map(f => {
      const plainFeedback = f.get({ plain: true });
      return {
        id: f.id,
        type: f.type,
        message: f.message,
        sender: f.isAnonymous ? 'Anonymous' : plainFeedback.sender?.name,
        sender_department: f.isAnonymous ? null : plainFeedback.sender?.department,
        receiver: plainFeedback.receiver?.name,
        receiver_department: plainFeedback.receiver?.department,
        status: f.status,
        priority: f.priority,
        categories: f.categories,
        latest_response: plainFeedback.notes?.[0]?.note,
        response_status: plainFeedback.notes?.[0]?.status,
        created_at: f.createdAt,
        updated_at: f.updatedAt
      };
    });

    const filename = `feedback_report_${dateRange}_${category}_${new Date().toISOString().split('T')[0]}`;

    // Export based on format
    switch (format) {
      case 'csv': {
        const fields = Object.keys(formattedData[0] || {});
        const parser = new Parser({ fields });
        const csv = parser.parse(formattedData);
        
        res.header('Content-Type', 'text/csv');
        res.attachment(`${filename}.csv`);
        return res.send(csv);
      }

      case 'excel': {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Feedback Report');
        
        // Add headers
        const headers = Object.keys(formattedData[0] || {});
        worksheet.addRow(headers);
        
        // Add data
        formattedData.forEach(feedback => {
          worksheet.addRow(Object.values(feedback));
        });
        
        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment(`${filename}.xlsx`);
        return workbook.xlsx.write(res);
      }

      case 'pdf': {
        const doc = new PDFDocument();
        
        res.header('Content-Type', 'application/pdf');
        res.attachment(`${filename}.pdf`);
        
        doc.pipe(res);
        
        // Add title
        doc.fontSize(16).text('Feedback Report', { align: 'center' });
        doc.moveDown();
        
        // Add filters info
        doc.fontSize(12).text(`Date Range: ${dateRange}`);
        doc.text(`Category: ${category}`);
        doc.moveDown();
        
        // Add table headers
        const headers = Object.keys(formattedData[0] || {});
        let yPosition = doc.y;
        
        // Add data rows
        formattedData.forEach((feedback, index) => {
          if (doc.y > 700) { // Check if near page end
            doc.addPage();
            yPosition = doc.y;
          }
          
          doc.fontSize(10).text(
            Object.values(feedback).join(' | '),
            { width: 500 }
          );
          doc.moveDown(0.5);
        });
        
        doc.end();
        return;
      }

      default: {
        // JSON format
        return res.json(formattedData);
      }
    }
  } catch (error) {
    console.error("Error exporting feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get feedback for a specific user (as receiver)
const getFeedbackByUserId = async (req, res) => {
  try {
    const feedback = await Feedback.findAll({
      where: { toUserId: req.params.userId },
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" },
      ],
    });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback by userId:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get feedback history (both sent and received)
const getFeedbackHistory = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Build date filter if provided
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get both sent and received feedback
    const feedback = await Feedback.findAndCountAll({
      where: {
        [Op.or]: [
          { fromUserId: req.user.id },
          { toUserId: req.user.id }
        ],
        ...dateFilter
      },
      include: [
        { 
          model: User, 
          as: "sender",
          attributes: ['id', 'name', 'email', 'department'] 
        },
        { 
          model: User, 
          as: "receiver",
          attributes: ['id', 'name', 'email', 'department']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      feedback: feedback.rows,
      total: feedback.count,
      currentPage: page,
      totalPages: Math.ceil(feedback.count / limit)
    });
  } catch (error) {
    console.error("Error fetching feedback history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add notes to feedback
const addFeedbackNotes = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { notes, followUpDate, status } = req.body;

    // Find the feedback
    const feedback = await Feedback.findByPk(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Create feedback note
    const feedbackNote = await FeedbackNote.create({
      feedbackId,
      supervisorId: req.user.id,
      note: notes,
      followUpDate: followUpDate || null,
      status: status || 'pending'
    });

    // Include user information in response
    const noteWithUser = await FeedbackNote.findByPk(feedbackNote.id, {
      include: [{
        model: User,
        as: 'supervisor',
        attributes: ['id', 'name', 'role'],
        foreignKey: 'supervisorId'
      }]
    });

    res.status(201).json(noteWithUser);
  } catch (error) {
    console.error("Error adding feedback notes:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add follow-up to feedback
const addFeedbackFollowup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { scheduledDate, participants, notes } = req.body;

    // Find the feedback
    const feedback = await Feedback.findByPk(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Create the follow-up
    const followup = await FeedbackFollowup.create({
      feedbackId,
      scheduledDate,
      notes,
      createdBy: req.user.id,
      status: "scheduled"
    });

    // Add participants
    await Promise.all(
      participants.map(userId =>
        FeedbackFollowupParticipant.create({
          followupId: followup.id,
          userId
        })
      )
    );

    // Fetch the complete follow-up with participants
    const followupWithDetails = await FeedbackFollowup.findByPk(followup.id, {
      include: [
        {
          model: User,
          as: "participants",
          attributes: ["id", "name", "email", "role"],
          through: { attributes: [] }
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "role"]
        }
      ]
    });

    res.status(201).json(followupWithDetails);
  } catch (error) {
    console.error("Error adding feedback follow-up:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Department Feedback Analytics
const getDepartmentFeedbackAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let department;

    // Get department based on user role
    if (req.user.role === 'manager') {
      const user = await User.findByPk(req.user.id);
      department = user.department;
    } else if (req.user.role === 'hr') {
      department = req.query.department;
    }

    if (!department) {
      return res.status(400).json({ message: "Department is required for HR users" });
    }

    // Find all users in the department
    const users = await User.findAll({
      where: { department },
      attributes: ["id", "name", "email"]
    });
    const userIds = users.map(u => u.id);

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get feedback for users in department (sent or received)
    const feedbacks = await Feedback.findAll({
      where: {
        [Op.or]: [
          { fromUserId: { [Op.in]: userIds } },
          { toUserId: { [Op.in]: userIds } },
          { toDepartment: department }
        ],
        ...dateFilter
      },
      include: [
        { model: User, as: "sender", attributes: ["id", "name", "email", "department"] },
        { model: User, as: "receiver", attributes: ["id", "name", "email", "department"] },
        {
          model: FeedbackNote,
          as: "notes",
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'supervisor',
            attributes: ['id', 'name', 'role']
          }]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    // Analytics: count by type
    const byType = {};
    feedbacks.forEach(fb => {
      byType[fb.type] = (byType[fb.type] || 0) + 1;
    });

    // Analytics: trend by date
    const trend = {};
    feedbacks.forEach(fb => {
      const date = fb.createdAt.toISOString().slice(0, 10);
      trend[date] = (trend[date] || 0) + 1;
    });

    // Format the response
    const formattedFeedbacks = feedbacks.map(f => {
      const plainFeedback = f.get({ plain: true });
      return {
        ...plainFeedback,
        sender_name: f.isAnonymous ? 'Anonymous' : plainFeedback.sender?.name,
        sender_email: f.isAnonymous ? null : plainFeedback.sender?.email,
        sender_department: f.isAnonymous ? null : plainFeedback.sender?.department,
        receiver_name: plainFeedback.receiver?.name,
        receiver_email: plainFeedback.receiver?.email,
        receiver_department: plainFeedback.receiver?.department,
        latest_response: plainFeedback.notes?.[0]?.note,
        response_status: plainFeedback.notes?.[0]?.status,
        response_date: plainFeedback.notes?.[0]?.created_at,
        responder_name: plainFeedback.notes?.[0]?.supervisor?.name
      };
    });

    res.json({
      department,
      total: feedbacks.length,
      byType,
      trend,
      feedbacks: formattedFeedbacks
    });
  } catch (error) {
    console.error("Error fetching department feedback analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Respond to feedback
const respondToFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { response, status } = req.body;

    // Find the feedback
    const feedback = await Feedback.findByPk(feedbackId, {
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" }
      ]
    });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Create feedback note with the response
    const feedbackNote = await FeedbackNote.create({
      id: uuidv4(),
      feedbackId,
      supervisorId: req.user.id,
      note: response,
      status
    });

    // Update feedback status to match the note status
    await feedback.update({ status });
    await logActivity({
      userId: req.user.id,
      action: "feedback_responded",
      entityType: "feedback",
      entityId: feedback.id,
      details: { status, response },
      req
    });
    

    // Include user information in response
    const noteWithUser = await FeedbackNote.findByPk(feedbackNote.id, {
      include: [{
        model: User,
        as: 'supervisor',
        attributes: ['id', 'name', 'role']
      }]
    });

    res.json(noteWithUser);
  } catch (error) {
    console.error("Error responding to feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Acknowledge feedback as read by a supervisor
const acknowledgeFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const supervisorId = req.user.id;

        const feedback = await Feedback.findByPk(feedbackId, {
            include: [{ model: User, as: 'sender', attributes: ['supervisorId'] }]
        });

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        // Verify that the logged-in user is the supervisor of the person who sent the feedback
        if (feedback.sender.supervisorId !== supervisorId) {
            return res.status(403).json({ message: "You are not authorized to acknowledge this feedback." });
        }

        // Update the feedback status
        feedback.status = 'Acknowledged';
        await feedback.save();

        await logActivity({
            userId: supervisorId,
            action: "feedback_acknowledged",
            entityType: "feedback",
            entityId: feedback.id,
            req
        });

        res.json(feedback);
    } catch (error) {
        console.error("Error acknowledging feedback:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a summary of team feedback by category
const getTeamFeedbackSummary = async (req, res) => {
    try {
        // First, get the IDs of the supervisor's direct reports
        const teamMembers = await User.findAll({
            where: { supervisorId: req.user.id },
            attributes: ['id']
        });

        if (teamMembers.length === 0) {
            return res.json({ summary: {}, total: 0 });
        }

        const teamMemberIds = teamMembers.map(member => member.id);

        // Fetch feedback from those team members
        const feedback = await Feedback.findAll({
            where: { fromUserId: { [Op.in]: teamMemberIds } },
            attributes: ['type', [sequelize.fn('COUNT', sequelize.col('type')), 'count']],
            group: ['type']
        });

        // Format the summary
        const summary = feedback.reduce((acc, item) => {
            acc[item.get('type')] = item.get('count');
            return acc;
        }, {});
        
        const total = feedback.reduce((sum, item) => sum + item.get('count'), 0);

        res.json({ summary, total });
    } catch (error) {
        console.error("Error fetching team feedback summary:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all feedback (HR only)
const getAllFeedback = async (req, res) => {
  try {
    const { startDate, endDate, type, status } = req.query;

    // Build where clause
    const whereClause = {};
    
    // Add date filter if provided
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Add type filter if provided
    if (type) {
      whereClause.type = type;
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    const feedback = await Feedback.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: "receiver",
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: FeedbackNote,
          as: "notes",
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'supervisor',
            attributes: ['id', 'name', 'role']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format the response
    const formattedFeedback = feedback.map(f => {
      const plainFeedback = f.get({ plain: true });
      return {
        ...plainFeedback,
        sender_name: f.isAnonymous ? 'Anonymous' : plainFeedback.sender?.name,
        sender_email: f.isAnonymous ? null : plainFeedback.sender?.email,
        sender_department: f.isAnonymous ? null : plainFeedback.sender?.department,
        receiver_name: plainFeedback.receiver?.name,
        receiver_email: plainFeedback.receiver?.email,
        receiver_department: plainFeedback.receiver?.department,
        latest_response: plainFeedback.notes?.[0]?.note,
        response_status: plainFeedback.notes?.[0]?.status,
        response_date: plainFeedback.notes?.[0]?.created_at,
        responder_name: plainFeedback.notes?.[0]?.supervisor?.name
      };
    });

    res.json(formattedFeedback);
  } catch (error) {
    console.error("Error fetching all feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Categorize feedback
const categorizeFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { categories, priority, status } = req.body;

    // Find the feedback
    const feedback = await Feedback.findByPk(feedbackId, {
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" }
      ]
    });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Update feedback with new categories and status
    await feedback.update({
      categories: JSON.stringify(categories),
      priority,
      status
    });

    // Create a note about the categorization
    await FeedbackNote.create({
      id: uuidv4(),
      feedbackId,
      supervisorId: req.user.id,
      note: `Feedback categorized as [${categories.join(", ")}] with ${priority} priority`,
      status
    });

    // Get updated feedback with latest note
    const updatedFeedback = await Feedback.findByPk(feedbackId, {
      include: [
        { model: User, as: "sender", attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: "receiver", attributes: ['id', 'name', 'email', 'department'] },
        {
          model: FeedbackNote,
          as: "notes",
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'supervisor',
            attributes: ['id', 'name', 'role']
          }]
        }
      ]
    });

    // Format the response
    const plainFeedback = updatedFeedback.get({ plain: true });
    const formattedFeedback = {
      ...plainFeedback,
      categories: JSON.parse(plainFeedback.categories || '[]'),
      sender_name: updatedFeedback.isAnonymous ? 'Anonymous' : plainFeedback.sender?.name,
      sender_email: updatedFeedback.isAnonymous ? null : plainFeedback.sender?.email,
      sender_department: updatedFeedback.isAnonymous ? null : plainFeedback.sender?.department,
      receiver_name: plainFeedback.receiver?.name,
      receiver_email: plainFeedback.receiver?.email,
      receiver_department: plainFeedback.receiver?.department,
      latest_response: plainFeedback.notes?.[0]?.note,
      response_status: plainFeedback.notes?.[0]?.status,
      response_date: plainFeedback.notes?.[0]?.created_at,
      responder_name: plainFeedback.notes?.[0]?.supervisor?.name
    };

    res.json(formattedFeedback);
  } catch (error) {
    console.error("Error categorizing feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Escalate feedback
const escalateFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { escalateTo, reason, notifyParties } = req.body;

    // Find the feedback
    const feedback = await Feedback.findByPk(feedbackId, {
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" }
      ]
    });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Create a note about the escalation
    const note = await FeedbackNote.create({
      id: uuidv4(),
      feedbackId,
      supervisorId: req.user.id,
      note: `Escalated to ${escalateTo}. Reason: ${reason}`,
      status: "in-progress"
    });

    // Update feedback status
    await feedback.update({
      status: "in_progress"
    });

    // Get the note with supervisor details
    const noteWithDetails = await FeedbackNote.findByPk(note.id, {
      include: [{
        model: User,
        as: 'supervisor',
        attributes: ['id', 'name', 'role']
      }]
    });

    res.json({
      message: "Feedback escalated successfully",
      feedback,
      escalation: {
        escalateTo,
        reason,
        notifyParties,
        note: noteWithDetails
      }
    });
  } catch (error) {
    console.error("Error escalating feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get critical or repeated feedback alerts for a team
const getTeamFeedbackAlerts = async (req, res) => {
    try {
        const supervisorId = req.user.id;

        // Get the supervisor's team members
        const teamMembers = await User.findAll({
            where: { supervisorId },
            attributes: ['id']
        });

        if (teamMembers.length === 0) {
            return res.json([]);
        }

        const teamMemberIds = teamMembers.map(member => member.id);

        // Find feedback that is marked as high priority or contains alert-worthy keywords
        const alerts = await Feedback.findAll({
            where: {
                fromUserId: { [Op.in]: teamMemberIds },
                [Op.or]: [
                    { priority: 'high' },
                    { priority: 'critical' },
                    // Basic keyword matching for demonstration
                    { message: { [Op.like]: '%urgent%' } },
                    { message: { [Op.like]: '%serious%' } },
                    { message: { [Op.like]: '%complaint%' } }
                ],
                // Optionally, filter out feedback that's already resolved
                status: { [Op.notIn]: ['Resolved', 'Closed'] }
            },
            include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json(alerts);
    } catch (error) {
        console.error("Error fetching team feedback alerts:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Allows a manager to review feedback, add a note, and optionally forward it
const reviewFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const { status, note, forwardTo } = req.body; // forwardTo can be 'hr' or a specific userId
        const managerId = req.user.id;

        const feedback = await Feedback.findByPk(feedbackId, {
            include: [{ model: User, as: 'sender', attributes: ['department'] }]
        });

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        // Authorization: Allow manager of the sender's department or any HR user
        if (req.user.role !== 'hr' && req.user.department !== feedback.sender.department) {
            return res.status(403).json({ message: "You are not authorized to review this feedback." });
        }

        // Update status
        feedback.status = status;

        // Forwarding logic
        if (forwardTo === 'hr') {
            feedback.toDepartment = 'HR'; // Or find the HR department
        } else if (forwardTo) {
            feedback.toUserId = forwardTo; // Assign to a specific person
        }
        
        await feedback.save();

        // Add a review note
        await FeedbackNote.create({
            feedbackId,
            supervisorId: managerId, // The reviewer is the one adding the note
            note: `Reviewed by manager. New status: ${status}. Note: ${note}`,
            status: status
        });
        
        await logActivity({
            userId: managerId,
            action: "feedback_reviewed",
            entityType: "feedback",
            entityId: feedback.id,
            details: { new_status: status, note },
            req
        });

        res.json(feedback);
    } catch (error) {
        console.error("Error reviewing feedback:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Analyze feedback to identify potential performance-related issues
const getFeedbackPerformanceLink = async (req, res) => {
    try {
        const { employeeId } = req.params;

        // 1. Fetch all feedback for the employee
        const feedbackHistory = await Feedback.findAll({
            where: {
                [Op.or]: [{ fromUserId: employeeId }, { toUserId: employeeId }],
            },
            order: [['createdAt', 'DESC']]
        });

        if (feedbackHistory.length === 0) {
            return res.json({
                message: "No feedback history found for this employee.",
                performanceConcernLevel: 'none',
                analysis: {}
            });
        }

        // 2. Basic Sentiment and Frequency Analysis
        let negativeFeedbackCount = 0;
        const feedbackFrequency = {}; // by month
        const negativeKeywords = ['complaint', 'issue', 'poor', 'negative', 'problem', 'concern'];

        feedbackHistory.forEach(fb => {
            const month = new Date(fb.createdAt).toISOString().slice(0, 7);
            feedbackFrequency[month] = (feedbackFrequency[month] || 0) + 1;

            const message = fb.message.toLowerCase();
            if (negativeKeywords.some(keyword => message.includes(keyword))) {
                negativeFeedbackCount++;
            }
        });

        // 3. Determine Performance Concern Level
        let performanceConcernLevel = 'low';
        const negativeFeedbackRatio = negativeFeedbackCount / feedbackHistory.length;

        if (feedbackHistory.length > 10 && negativeFeedbackRatio > 0.5) {
            performanceConcernLevel = 'high';
        } else if (feedbackHistory.length > 5 && negativeFeedbackRatio > 0.3) {
            performanceConcernLevel = 'medium';
        }

        res.json({
            employeeId,
            performanceConcernLevel,
            analysis: {
                totalFeedback: feedbackHistory.length,
                negativeFeedbackCount,
                negativeFeedbackRatio,
                feedbackFrequency,
            }
        });

    } catch (error) {
        console.error("Error analyzing feedback performance link:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get feedback that has been escalated to the manager's department
const getEscalatedFeedback = async (req, res) => {
    try {
        const escalatedFeedback = await Feedback.findAll({
            where: {
                status: 'Escalated',
                [Op.or]: [
                    { toDepartment: req.user.department },
                    { toUserId: req.user.id }
                ]
            },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'department'] },
                { model: User, as: 'receiver', attributes: ['id', 'name', 'department'] }
            ],
            order: [['updatedAt', 'DESC']]
        });

        res.json(escalatedFeedback);
    } catch (error) {
        console.error("Error fetching escalated feedback:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Detect recurring feedback patterns for HR
const getFeedbackPatterns = async (req, res) => {
    try {
        const { period = 'monthly', department, category } = req.query;

        // Define date range based on period
        const endDate = new Date();
        const startDate = new Date();
        if (period === 'weekly') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'quarterly') {
            startDate.setMonth(startDate.getMonth() - 3);
        } else { // monthly is default
            startDate.setMonth(startDate.getMonth() - 1);
        }

        const whereClause = {
            createdAt: { [Op.between]: [startDate, endDate] }
        };
        if (category) {
            whereClause.type = category;
        }

        const includeClause = {
            model: User,
            as: 'sender',
            attributes: [],
            required: true
        };
        
        if (department) {
            whereClause['$sender.department$'] = department;
        }
        
        // Find top feedback types by volume
        const topFeedbackTypes = await Feedback.findAll({
            where: whereClause,
            include: [includeClause],
            attributes: ['type', [sequelize.fn('COUNT', sequelize.col('Feedback.id')), 'count']],
            group: ['type'],
            order: [[sequelize.fn('COUNT', sequelize.col('Feedback.id')), 'DESC']],
            limit: 5
        });

        // Basic keyword frequency analysis from all messages in the period
        const allFeedbackMessages = await Feedback.findAll({
            where: whereClause,
            include: [includeClause],
            attributes: ['message']
        });

        const wordFrequency = {};
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'to', 'and', 'it', 'i', 'in', 'for', 'of', 'on', 'with', 'that', 'this', 'be', 'has', 'have', 'my', 'me', 'we']);

        allFeedbackMessages.forEach(fb => {
            const words = fb.message.toLowerCase().match(/\b(\w+)\b/g) || [];
            words.forEach(word => {
                if (!stopWords.has(word) && isNaN(word)) {
                    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                }
            });
        });
        
        const topKeywords = Object.entries(wordFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));

        res.json({
            filters: { period, department, category },
            patterns: {
                topFeedbackTypes: topFeedbackTypes.map(item => ({ type: item.get('type'), count: item.get('count') })),
                topKeywords
            }
        });

    } catch (error) {
        console.error("Error detecting feedback patterns:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Auto-tag feedback based on content
const autoTagFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const feedback = await Feedback.findByPk(feedbackId);

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        const message = feedback.message.toLowerCase();
        const detectedCategories = new Set(feedback.categories || []);

        // Rule-based tagging
        const tagRules = {
            'management': [/manager/, /supervisor/, /leader/, /leadership/],
            'compensation': [/salary/, /pay/, /compensation/, /raise/],
            'onboarding': [/onboarding/, /new hire/, /orientation/],
            'training': [/training/, /course/, /develop/, /skill/],
            'workload': [/workload/, /overwhelmed/, /burnout/, /hours/],
            'culture': [/culture/, /environment/, /toxic/, /harassment/],
            'process': [/process/, /workflow/, /inefficient/, /system/]
        };

        for (const [category, keywords] of Object.entries(tagRules)) {
            if (keywords.some(keyword => keyword.test(message))) {
                detectedCategories.add(category);
            }
        }
        
        // Also, attempt to update the primary 'type' if a strong match is found
        if (detectedCategories.has('onboarding') && feedback.type !== 'onboarding') {
            feedback.type = 'onboarding';
        } else if (detectedCategories.has('training') && feedback.type !== 'training') {
            feedback.type = 'training';
        }

        feedback.categories = Array.from(detectedCategories);
        await feedback.save();
        
        await logActivity({
            userId: req.user.id,
            action: "feedback_autotagged",
            entityType: "feedback",
            entityId: feedback.id,
            details: { newCategories: feedback.categories },
            req
        });

        res.json({
            message: "Feedback auto-tagged successfully",
            feedback
        });

    } catch (error) {
        console.error("Error auto-tagging feedback:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Analyze anonymous feedback submissions
const getAnonymousFeedbackSummary = async (req, res) => {
    try {
        const { period = 'monthly', department, category } = req.query;

        // Define date range
        const endDate = new Date();
        const startDate = new Date();
        if (period === 'weekly') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'quarterly') {
            startDate.setMonth(startDate.getMonth() - 3);
        } else { // monthly
            startDate.setMonth(startDate.getMonth() - 1);
        }

        const whereClause = {
            isAnonymous: true,
            createdAt: { [Op.between]: [startDate, endDate] }
        };
        if (category) {
            whereClause.type = category;
        }

        const includeClause = {
            model: User,
            as: 'sender',
            attributes: [],
            required: true
        };

        if (department) {
            whereClause['$sender.department$'] = department;
        }

        // Get top types
        const topFeedbackTypes = await Feedback.findAll({
            where: whereClause,
            include: [includeClause],
            attributes: ['type', [sequelize.fn('COUNT', sequelize.col('Feedback.id')), 'count']],
            group: ['type'],
            order: [[sequelize.fn('COUNT', sequelize.col('Feedback.id')), 'DESC']],
            limit: 5
        });

        // Keyword analysis
        const allFeedbackMessages = await Feedback.findAll({
            where: whereClause,
            include: [includeClause],
            attributes: ['message']
        });

        const wordFrequency = {};
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'to', 'and', 'it', 'i', 'in', 'for', 'of', 'on', 'with', 'that', 'this', 'be', 'has', 'have', 'my', 'me', 'we']);

        allFeedbackMessages.forEach(fb => {
            const words = fb.message.toLowerCase().match(/\b(\w+)\b/g) || [];
            words.forEach(word => {
                if (!stopWords.has(word) && isNaN(word)) {
                    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                }
            });
        });
        
        const topKeywords = Object.entries(wordFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));

        res.json({
            filters: { period, department, category },
            summary: {
                topFeedbackTypes: topFeedbackTypes.map(item => ({ type: item.get('type'), count: item.get('count') })),
                topKeywords
            }
        });

    } catch (error) {
        console.error("Error analyzing anonymous feedback:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getSentFeedback,
    getReceivedFeedback,
    getDepartmentFeedback,
    createFeedback,
    editFeedback,
    deleteFeedback,
    exportFeedback,
    getFeedbackByUserId,
    getFeedbackHistory,
    addFeedbackNotes,
    addFeedbackFollowup,
    getDepartmentFeedbackAnalytics,
    respondToFeedback,
    acknowledgeFeedback,
    getTeamFeedbackSummary,
    getAllFeedback,
    categorizeFeedback,
    escalateFeedback,
    getTeamFeedbackAlerts,
    reviewFeedback,
    getFeedbackPerformanceLink,
    getEscalatedFeedback,
    getFeedbackPatterns,
    autoTagFeedback,
    getAnonymousFeedbackSummary
};