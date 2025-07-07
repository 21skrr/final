const { Sequelize } = require('sequelize');
const sequelize = require("../config/database");
const User = require("./User");
const OnboardingProgress = require("./OnboardingProgress");
const Task = require("./Task");
const Event = require("./Event");
const Course = require("./Course");
const Survey = require("./Survey");
const EventParticipant = require("./EventParticipant");
const CoachingSession = require("./CoachingSession");
const Evaluation = require("./Evaluation");
const Feedback = require("./Feedback");
const Team = require("./Team");
const Program = require("./Program");
const Checklist = require("./Checklist");
const ChecklistItem = require("./ChecklistItem");
const ChecklistProgress = require("./ChecklistProgress");
const ChecklistCombined = require("./ChecklistAssignment");
const NotificationSettings = require("./NotificationSettings");
const OnboardingTask = require("./OnboardingTask");
const UserTaskProgress = require("./UserTaskProgress")(sequelize);
const Notification = require("./Notification");
const FeedbackForm = require("./feedbackForm");
const FeedbackSubmission = require("./feedbackSubmission");
const FeedbackNote = require("./FeedbackNote");
const FeedbackFollowup = require("./FeedbackFollowup");
const FeedbackFollowupParticipant = require("./FeedbackFollowupParticipant");
const SurveyQuestion = require("./SurveyQuestion");
const SurveyResponse = require("./SurveyResponse");
const SurveyQuestionResponse = require("./SurveyQuestionResponse");
const SurveySchedule = require("./surveySchedule")(sequelize);
const SurveySettings = require("./SurveySettings");
const AnalyticsDashboard = require("./AnalyticsDashboard");
const AnalyticsMetric = require("./AnalyticsMetric");
const Department = require("./Department");
const EvaluationCriteria = require("./EvaluationCriteria");
const UserCourse = require("./UserCourse");
const ReportSchedule = require("./ReportSchedule")(sequelize);
const ReportTemplate = require("./ReportTemplate")(sequelize);
const Report = require("./Report")(sequelize);
const Resource = require("./Resource");
const ResourceAssignment = require("./ResourceAssignment");
const ActivityLog = require("./ActivityLog");
const UserSetting = require("./UserSetting")(sequelize);
const TeamSettings = require('./TeamSettings')(sequelize);
const ManagerPreference = require('./ManagerPreference')(sequelize);
const SystemSetting = require("./SystemSetting")(sequelize);
const Role = require("./Role");




if (ActivityLog.associate) {
  ActivityLog.associate({ User, Resource });
}


// Initialize notification models
const NotificationTemplate = require('./notificationTemplate')(sequelize, Sequelize.DataTypes);
const NotificationPreference = require('./notificationPreference')(sequelize, Sequelize.DataTypes);

// User associations
User.hasOne(OnboardingProgress);
OnboardingProgress.belongsTo(User);

// Department associations
Department.hasMany(User, { foreignKey: 'departmentId', as: 'departmentUsers' });
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentInfo' });

User.hasMany(Task, { foreignKey: "userId" });
Task.belongsTo(User, { foreignKey: "userId" });

// Event associations
User.hasMany(Event, { as: "createdEvents", foreignKey: "createdBy" });
Event.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

// Event Participant associations
Event.hasMany(EventParticipant, { as: "participants", foreignKey: "eventId" });
EventParticipant.belongsTo(Event, { as: "event", foreignKey: "eventId" });
User.hasMany(EventParticipant, {
  as: "eventParticipations",
  foreignKey: "userId",
});
EventParticipant.belongsTo(User, { as: "participant", foreignKey: "userId" });

User.hasMany(Course, { as: "createdCourses", foreignKey: "createdBy" });
Course.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

User.hasMany(Survey, { as: "createdSurveys", foreignKey: "createdBy" });
Survey.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

// Survey and SurveyQuestion associations
Survey.hasMany(SurveyQuestion, { foreignKey: "surveyId", as: "SurveyQuestions" });
SurveyQuestion.belongsTo(Survey, { foreignKey: "surveyId" });

// Survey and SurveyResponse associations
Survey.hasMany(SurveyResponse, { foreignKey: "surveyId", as: "responses" });
SurveyResponse.belongsTo(Survey, { foreignKey: "surveyId", as: "survey" });

// User and SurveyResponse associations
User.hasMany(SurveyResponse, { foreignKey: "userId", as: "surveyResponses" });
SurveyResponse.belongsTo(User, { foreignKey: "userId", as: "user" });

// SurveyResponse and SurveyQuestionResponse associations
SurveyResponse.hasMany(SurveyQuestionResponse, { foreignKey: "surveyResponseId", as: "questionResponses" });
SurveyQuestionResponse.belongsTo(SurveyQuestionResponse, { foreignKey: "surveyResponseId" });

// SurveyQuestion and SurveyQuestionResponse associations
SurveyQuestion.hasMany(SurveyQuestionResponse, { foreignKey: "questionId" });
SurveyQuestionResponse.belongsTo(SurveyQuestion, { foreignKey: "questionId", as: "question" });

// Checklist associations
User.hasMany(Checklist, { as: "createdChecklists", foreignKey: "createdBy" });
Checklist.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

// Checklist Items associations
Checklist.hasMany(ChecklistItem, { foreignKey: "checklistId" });
ChecklistItem.belongsTo(Checklist, { foreignKey: "checklistId" });

// Checklist Progress associations
User.hasMany(ChecklistProgress, {
  as: "checklistProgress",
  foreignKey: "userId",
});
ChecklistProgress.belongsTo(User, { as: "user", foreignKey: "userId" });

ChecklistItem.hasMany(ChecklistProgress, { foreignKey: "checklistItemId" });
ChecklistProgress.belongsTo(ChecklistItem, { foreignKey: "checklistItemId" });

User.hasMany(ChecklistProgress, {
  as: "verifiedChecklistItems",
  foreignKey: "verifiedBy",
});
ChecklistProgress.belongsTo(User, { as: "verifier", foreignKey: "verifiedBy" });

// Checklist Assignment associations
Checklist.hasMany(ChecklistCombined, { foreignKey: "checklistId" });
ChecklistCombined.belongsTo(Checklist, { foreignKey: "checklistId" });

User.hasMany(ChecklistCombined, {
  as: "assignedChecklists",
  foreignKey: "userId",
});
ChecklistCombined.belongsTo(User, { as: "assignee", foreignKey: "userId" });

User.hasMany(ChecklistCombined, {
  as: "checklistAssignments",
  foreignKey: "assignedBy",
});
ChecklistCombined.belongsTo(User, {
  as: "assigner",
  foreignKey: "assignedBy",
});

// Self-referential association for supervisor
User.belongsTo(User, { as: "supervisor", foreignKey: "supervisorId" });
User.hasMany(User, { as: "subordinates", foreignKey: "supervisorId" });

// Coaching Session associations
User.hasMany(CoachingSession, {
  as: "supervisorSessions",
  foreignKey: "supervisorId",
});
User.hasMany(CoachingSession, {
  as: "employeeSessions",
  foreignKey: "employeeId",
});
CoachingSession.belongsTo(User, {
  as: "supervisor",
  foreignKey: "supervisorId",
});
CoachingSession.belongsTo(User, { as: "employee", foreignKey: "employeeId" });

// Evaluation associations
User.hasMany(Evaluation, {
  as: "employeeEvaluations",
  foreignKey: "employeeId",
});
User.hasMany(Evaluation, {
  as: "supervisorEvaluations",
  foreignKey: "evaluatorId",
});
User.hasMany(Evaluation, {
  as: "reviewerEvaluations",
  foreignKey: "reviewedBy",
});
Evaluation.belongsTo(User, { as: "employee", foreignKey: "employeeId" });
Evaluation.belongsTo(User, {
  as: "supervisor",
  foreignKey: "evaluatorId",
});
Evaluation.belongsTo(User, { as: "reviewer", foreignKey: "reviewedBy" });

// Evaluation and EvaluationCriteria associations
Evaluation.hasMany(EvaluationCriteria, { foreignKey: 'evaluationId', as: 'criteria' });
EvaluationCriteria.belongsTo(Evaluation, { foreignKey: 'evaluationId', as: 'evaluation' });

// Feedback associations
User.hasMany(Feedback, { as: "sentFeedback", foreignKey: "fromUserId" });
User.hasMany(Feedback, { as: "receivedFeedback", foreignKey: "toUserId" });
Feedback.belongsTo(User, { as: "sender", foreignKey: "fromUserId" });
Feedback.belongsTo(User, { as: "receiver", foreignKey: "toUserId" });

// Team associations
User.belongsTo(Team, { foreignKey: "teamId" });
Team.hasMany(User, { foreignKey: "teamId" });

// Notification settings association
User.hasMany(NotificationSettings);
NotificationSettings.belongsTo(User);

// OnboardingTask associations
OnboardingTask.hasMany(UserTaskProgress, { foreignKey: "OnboardingTaskId" });

// UserTaskProgress associations
UserTaskProgress.belongsTo(OnboardingTask, { foreignKey: 'OnboardingTaskId', as: 'onboardingTask' });

// UserCourse associations
UserCourse.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Course.hasMany(UserCourse, { foreignKey: 'courseId', as: 'userCourses' });

// Feedback Form and Submission associations
FeedbackForm.hasMany(FeedbackSubmission, {
  foreignKey: 'formId',
  as: 'submissions'
});

FeedbackSubmission.belongsTo(FeedbackForm, {
  foreignKey: 'formId',
  as: 'form'
});

FeedbackSubmission.belongsTo(User, {
  foreignKey: 'submitterId',
  as: 'submitter'
});

FeedbackSubmission.belongsTo(User, {
  foreignKey: 'reviewerId',
  as: 'reviewer'
});

// Notification associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Notification Preference associations
User.hasOne(NotificationPreference, { foreignKey: 'userId' });
NotificationPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Notification Template associations
User.hasMany(NotificationTemplate, { foreignKey: 'createdBy', as: 'createdTemplates' });
NotificationTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Feedback Note associations
FeedbackNote.belongsTo(Feedback, { 
  foreignKey: "feedbackId",
  as: "feedback",
  onDelete: "CASCADE"
});
FeedbackNote.belongsTo(User, { 
  foreignKey: "supervisorId",
  as: "supervisor",
  onDelete: "CASCADE"
});
Feedback.hasMany(FeedbackNote, { 
  foreignKey: "feedbackId",
  as: "notes"
});

// Feedback Followup associations
FeedbackFollowup.belongsTo(Feedback, {
  foreignKey: "feedbackId",
  as: "feedback"
});
FeedbackFollowup.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator"
});
FeedbackFollowup.belongsToMany(User, {
  through: FeedbackFollowupParticipant,
  foreignKey: "followupId",
  otherKey: "userId",
  as: "participants"
});
User.belongsToMany(FeedbackFollowup, {
  through: FeedbackFollowupParticipant,
  foreignKey: "userId",
  otherKey: "followupId",
  as: "followups"
});
Feedback.hasMany(FeedbackFollowup, {
  foreignKey: "feedbackId",
  as: "followups"
});

// Add Survey Schedule associations
Survey.hasMany(SurveySchedule, { foreignKey: 'surveyId', as: 'schedules' });
SurveySchedule.belongsTo(Survey, { foreignKey: 'surveyId', as: 'survey' });

// Add association from User to ActivityLog
User.hasMany(ActivityLog, { foreignKey: 'userId' });

// Initialize associations
Object.keys(module.exports).forEach((modelName) => {
  if (module.exports[modelName].associate) {
    module.exports[modelName].associate(module.exports);
  }
});
if (UserSetting.associate) {
  UserSetting.associate({ User });
}
if (TeamSettings.associate) {
  TeamSettings.associate({ Team });
}
if (ManagerPreference.associate) {
  ManagerPreference.associate({ User });
}

// Export models and connection
module.exports = {
  sequelize,
  User,
  OnboardingProgress,
  Task,
  Event,
  EventParticipant,
  Course,
  Survey,
  SurveyQuestion,
  SurveyResponse,
  SurveyQuestionResponse,
  SurveySchedule,
  SurveySettings,
  CoachingSession,
  Evaluation,
  Feedback,
  Team,
  Program,
  Checklist,
  ChecklistItem,
  ChecklistProgress,
  ChecklistCombined,
  NotificationSettings,
  OnboardingTask,
  UserTaskProgress,
  Notification,
  FeedbackForm,
  FeedbackSubmission,
  FeedbackNote,
  FeedbackFollowup,
  FeedbackFollowupParticipant,
  NotificationTemplate,
  notification_preferences: NotificationPreference,
  analytics_dashboards: AnalyticsDashboard,
  analytics_metrics: AnalyticsMetric,
  Department,
  EvaluationCriteria,
  UserCourse,
  ReportSchedule,
  ReportTemplate,
  Report,
  Resource,
  ResourceAssignment,
  ActivityLog,
  UserSetting,
  TeamSettings,
  ManagerPreference,
  SystemSetting,
  Role,
};


