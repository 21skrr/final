const express = require("express");
const cors = require("cors");
const path = require("path");
const { sequelize } = require("./models");
const errorHandler = require("./middleware/errorHandler");
const session = require('express-session');

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const eventRoutes = require("./routes/eventRoutes");
const courseRoutes = require("./routes/courseRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const coachingRoutes = require("./routes/coachingRoutes");
const documentRoutes = require("./routes/documentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const surveyRoutes = require("./routes/surveyRoutes");
const teamRoutes = require("./routes/teamRoutes");
const programRoutes = require("./routes/programRoutes");
const checklistRoutes = require("./routes/checklistRoutes");
const checklistItemRoutes = require("./routes/checklistItemRoutes");
const checklistAssignmentRoutes = require("./routes/checklistAssignmentRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const supervisorRoutes = require("./routes/supervisorRoutes");
const organizationAnalyticsRoutes = require('./routes/organizationAnalyticsRoutes');
const personalAnalyticsRoutes = require('./routes/personalAnalyticsRoutes');
const teamAnalyticsRoutes = require('./routes/teamAnalyticsRoutes');
const departmentAnalyticsRoutes = require('./routes/departmentAnalyticsRoutes');
const personalReportsRoutes = require('./routes/personalReportsRoutes');
const teamReportsRoutes = require("./routes/teamReportsRoutes");
const managerReportsRoutes = require("./routes/managerReportsRoutes");
const departmentReportsRoutes = require("./routes/departmentReportsRoutes");
const reportTemplateRoutes = require("./routes/reportTemplateRoutes");
const reportScheduleRoutes = require("./routes/reportScheduleRoutes");
const evaluationCriteriaRoutes = require("./routes/evaluationCriteriaRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const hrRoutes = require("./routes/hrRoutes");
const activityLogRoutes = require('./routes/activityLogRoutes');

const app = express();

// Middleware - MUST be before routes
app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend origin
  credentials: true // Allow cookies/auth headers
}));

// Session middleware (must be before routes)
app.use(session({
  secret: 'your-secret-key', // Change to a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'none', // Allow cross-origin
    secure: false     // false for localhost, true for HTTPS/production
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware to log query parameters after parsing
app.use((req, res, next) => {
    console.log('Query parameters after middleware:', req.query);
    next();
});

// Dedicated test route for query parameters - placed early
app.get('/test-query', (req, res) => {
    console.log('Received query parameters in /test-query:', req.query);
    res.status(200).json({ receivedQuery: req.query });
});

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Simple test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Test route is working!" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/coaching", coachingRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/checklists", checklistRoutes);
app.use("/api/checklist-items", checklistItemRoutes);
app.use("/api/checklist-assignments", checklistAssignmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/supervisor", supervisorRoutes);
app.use("/api/onboarding/tasks", taskRoutes);
app.use('/api/analytics/organization', organizationAnalyticsRoutes);
app.use('/api/analytics/personal', personalAnalyticsRoutes);
app.use('/api/analytics/team', teamAnalyticsRoutes);
app.use('/api/analytics/department', departmentAnalyticsRoutes);
app.use('/api/reports/personal', personalReportsRoutes);
app.use("/api/reports/team", teamReportsRoutes);
app.use("/api/reports", managerReportsRoutes);
app.use("/api/reports", departmentReportsRoutes);
app.use("/api/reports", reportTemplateRoutes);
app.use("/api/reports", reportScheduleRoutes);
app.use("/api/evaluationcriteria", evaluationCriteriaRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api", hrRoutes);
app.use('/api/activitylogs', activityLogRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// 2. Check Content-Type Header

// Make sure you have the correct header:
// - **Key**: `Content-Type`
// - **Value**: `application/json`

// 3. Fix the App.js File

// The main issue is still in your app.js file. You need to remove the problematic middleware at the end. Here's the corrected version:
// app.use((req, res, next) => {
//   if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
//     express.json()(req, res, next);
//   } else {
//     next();
//   }
// });

module.exports = app;
