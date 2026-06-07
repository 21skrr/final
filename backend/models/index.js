const { Sequelize } = require('sequelize');
const sequelize = require("../config/database");

// ── Core models (tables that exist in DB and are used by frontend) ──────────
const User = require("./User");
const OnboardingProgress = require("./OnboardingProgress");
const OnboardingTask = require("./OnboardingTask");
const UserTaskProgress = require("./UserTaskProgress")(sequelize);
const Department = require("./Department");
const Team = require("./Team");
const TeamSettings = require('./TeamSettings')(sequelize);

const Checklist = require("./Checklist");
const ChecklistItem = require("./ChecklistItem");
const ChecklistProgress = require("./ChecklistProgress");
const ChecklistCombined = require("./ChecklistAssignment");

const Feedback = require("./Feedback");
const FeedbackNote = require("./FeedbackNote");
const FeedbackFollowup = require("./FeedbackFollowup");
const FeedbackFollowupParticipant = require("./FeedbackFollowupParticipant");

const Notification = require("./Notification");
const NotificationTemplate = require('./notificationTemplate')(sequelize, Sequelize.DataTypes);
const NotificationPreference = require('./notificationPreference')(sequelize, Sequelize.DataTypes);

const Evaluation = require("./Evaluation");
const EvaluationCriteria = require("./EvaluationCriteria");
const SupervisorAssessment = require("./SupervisorAssessment");
const HRAssessment = require("./HRAssessment");

const CoachingSession = require("./CoachingSession");
const Event = require("./Event");
const EventParticipant = require("./EventParticipant");
const ActivityLog = require("./ActivityLog");

const Survey = require("./Survey");
const SurveyQuestion = require("./SurveyQuestion");
const SurveyResponse = require("./SurveyResponse");
const SurveyQuestionResponse = require("./SurveyQuestionResponse");
const SurveySchedule = require("./surveySchedule")(sequelize);

const Resource = require("./Resource");
const ResourceAssignment = require("./ResourceAssignment");

const Program = require("./Program");
const Role = require("./Role");
const ReportTemplate = require("./ReportTemplate")(sequelize);
const SystemSetting = require("./SystemSetting")(sequelize);
const UserSetting = require("./UserSetting")(sequelize);

// ── Associations ─────────────────────────────────────────────────────────────

// ActivityLog
if (ActivityLog.associate) {
  ActivityLog.associate({ User, Resource });
}
User.hasMany(ActivityLog, { foreignKey: 'userId' });

// Resource associations
Resource.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Resource, { foreignKey: 'createdBy', as: 'createdResources' });
Resource.hasMany(ResourceAssignment, { foreignKey: 'resourceId', as: 'assignments' });

// User / Onboarding
User.hasOne(OnboardingProgress);
OnboardingProgress.belongsTo(User);

// Department
Department.hasMany(User, { foreignKey: 'departmentId', as: 'departmentUsers' });
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentInfo' });

// Team
User.belongsTo(Team, { foreignKey: "teamId" });
Team.hasMany(User, { foreignKey: "teamId" });

// Events
User.hasMany(Event, { as: "createdEvents", foreignKey: "createdBy" });
Event.belongsTo(User, { as: "creator", foreignKey: "createdBy" });
Event.hasMany(EventParticipant, { as: "participants", foreignKey: "eventId" });
EventParticipant.belongsTo(Event, { as: "event", foreignKey: "eventId" });
User.hasMany(EventParticipant, { as: "eventParticipations", foreignKey: "userId" });
EventParticipant.belongsTo(User, { as: "participant", foreignKey: "userId" });


// Self-referential supervisor
User.belongsTo(User, { as: "supervisor", foreignKey: "supervisorId" });
User.hasMany(User, { as: "subordinates", foreignKey: "supervisorId" });

// Checklist
User.hasMany(Checklist, { as: "createdChecklists", foreignKey: "createdBy" });
Checklist.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

Checklist.hasMany(ChecklistItem, { foreignKey: "checklistId" });
ChecklistItem.belongsTo(Checklist, { foreignKey: "checklistId" });

User.hasMany(ChecklistProgress, { as: "checklistProgress", foreignKey: "userId" });
ChecklistProgress.belongsTo(User, { as: "user", foreignKey: "userId" });

ChecklistItem.hasMany(ChecklistProgress, { foreignKey: "checklistItemId" });
ChecklistProgress.belongsTo(ChecklistItem, { foreignKey: "checklistItemId" });

User.hasMany(ChecklistProgress, { as: "verifiedChecklistItems", foreignKey: "verifiedBy" });
ChecklistProgress.belongsTo(User, { as: "verifier", foreignKey: "verifiedBy" });

// ChecklistCombined (assignments)
Checklist.hasMany(ChecklistCombined, { foreignKey: "checklistId" });
ChecklistCombined.belongsTo(Checklist, { foreignKey: "checklistId" });

User.hasMany(ChecklistCombined, { as: "assignedChecklists", foreignKey: "userId" });
ChecklistCombined.belongsTo(User, { as: "assignee", foreignKey: "userId" });

User.hasMany(ChecklistCombined, { as: "checklistAssignments", foreignKey: "assignedBy" });
ChecklistCombined.belongsTo(User, { as: "assigner", foreignKey: "assignedBy" });

// Coaching sessions
User.hasMany(CoachingSession, { as: "supervisorSessions", foreignKey: "supervisorId" });
User.hasMany(CoachingSession, { as: "employeeSessions", foreignKey: "employeeId" });
CoachingSession.belongsTo(User, { as: "supervisor", foreignKey: "supervisorId" });
CoachingSession.belongsTo(User, { as: "employee", foreignKey: "employeeId" });

// Evaluations
User.hasMany(Evaluation, { as: "employeeEvaluations", foreignKey: "employeeId" });
User.hasMany(Evaluation, { as: "supervisorEvaluations", foreignKey: "evaluatorId" });
User.hasMany(Evaluation, { as: "reviewerEvaluations", foreignKey: "reviewedBy" });
Evaluation.belongsTo(User, { as: "employee", foreignKey: "employeeId" });
Evaluation.belongsTo(User, { as: "supervisor", foreignKey: "evaluatorId" });
Evaluation.belongsTo(User, { as: "reviewer", foreignKey: "reviewedBy" });

Evaluation.hasMany(EvaluationCriteria, { foreignKey: 'evaluationId', as: 'criteria' });
EvaluationCriteria.belongsTo(Evaluation, { foreignKey: 'evaluationId', as: 'evaluation' });

// Feedback
User.hasMany(Feedback, { as: "sentFeedback", foreignKey: "fromUserId" });
User.hasMany(Feedback, { as: "receivedFeedback", foreignKey: "toUserId" });
Feedback.belongsTo(User, { as: "sender", foreignKey: "fromUserId" });
Feedback.belongsTo(User, { as: "receiver", foreignKey: "toUserId" });

FeedbackNote.belongsTo(Feedback, { foreignKey: "feedbackId", as: "feedback", onDelete: "CASCADE" });
FeedbackNote.belongsTo(User, { foreignKey: "supervisorId", as: "supervisor", onDelete: "CASCADE" });
Feedback.hasMany(FeedbackNote, { foreignKey: "feedbackId", as: "notes" });

FeedbackFollowup.belongsTo(Feedback, { foreignKey: "feedbackId", as: "feedback" });
FeedbackFollowup.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
FeedbackFollowup.belongsToMany(User, { through: FeedbackFollowupParticipant, foreignKey: "followupId", otherKey: "userId", as: "participants" });
User.belongsToMany(FeedbackFollowup, { through: FeedbackFollowupParticipant, foreignKey: "userId", otherKey: "followupId", as: "followups" });
Feedback.hasMany(FeedbackFollowup, { foreignKey: "feedbackId", as: "followups" });

// Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(NotificationPreference, { foreignKey: 'userId' });
NotificationPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(NotificationTemplate, { foreignKey: 'createdBy', as: 'createdTemplates' });
NotificationTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// OnboardingTask / UserTaskProgress
OnboardingTask.hasMany(UserTaskProgress, { foreignKey: "OnboardingTaskId" });
UserTaskProgress.belongsTo(OnboardingTask, { foreignKey: 'OnboardingTaskId', as: 'onboardingTask' });

// Surveys
User.hasMany(Survey, { as: "createdSurveys", foreignKey: "createdBy" });
Survey.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

Survey.hasMany(SurveyQuestion, { foreignKey: "surveyId", as: "SurveyQuestions" });
SurveyQuestion.belongsTo(Survey, { foreignKey: "surveyId" });

Survey.hasMany(SurveyResponse, { foreignKey: "surveyId", as: "responses" });
SurveyResponse.belongsTo(Survey, { foreignKey: "surveyId", as: "survey" });

User.hasMany(SurveyResponse, { foreignKey: "userId", as: "surveyResponses" });
SurveyResponse.belongsTo(User, { foreignKey: "userId", as: "user" });

SurveyResponse.hasMany(SurveyQuestionResponse, { foreignKey: "surveyResponseId", as: "questionResponses" });
SurveyQuestionResponse.belongsTo(SurveyResponse, { foreignKey: "surveyResponseId", as: "surveyResponse" });

SurveyQuestion.hasMany(SurveyQuestionResponse, { foreignKey: "questionId" });
SurveyQuestionResponse.belongsTo(SurveyQuestion, { foreignKey: "questionId", as: "question" });

Survey.hasMany(SurveySchedule, { foreignKey: 'surveyId', as: 'schedules' });
SurveySchedule.belongsTo(Survey, { foreignKey: 'surveyId', as: 'survey' });

// SupervisorAssessment
OnboardingProgress.hasOne(SupervisorAssessment, { foreignKey: 'OnboardingProgressId' });
SupervisorAssessment.belongsTo(OnboardingProgress, { foreignKey: 'OnboardingProgressId' });

User.hasMany(SupervisorAssessment, { foreignKey: 'UserId', as: 'employeeAssessments' });
SupervisorAssessment.belongsTo(User, { foreignKey: 'UserId', as: 'employee' });

User.hasMany(SupervisorAssessment, { foreignKey: 'SupervisorId', as: 'supervisorAssessments' });
SupervisorAssessment.belongsTo(User, { foreignKey: 'SupervisorId', as: 'supervisor' });

User.hasMany(SupervisorAssessment, { foreignKey: 'hrValidatorId', as: 'hrValidations' });
SupervisorAssessment.belongsTo(User, { foreignKey: 'hrValidatorId', as: 'hrValidator' });

// HRAssessment
OnboardingProgress.hasOne(HRAssessment, { foreignKey: 'OnboardingProgressId' });
HRAssessment.belongsTo(OnboardingProgress, { foreignKey: 'OnboardingProgressId' });

User.hasMany(HRAssessment, { foreignKey: 'UserId', as: 'employeeHRAssessments' });
HRAssessment.belongsTo(User, { foreignKey: 'UserId', as: 'employee' });

User.hasMany(HRAssessment, { foreignKey: 'HRId', as: 'hrAssessments' });
HRAssessment.belongsTo(User, { foreignKey: 'HRId', as: 'hr' });

// TeamSettings
if (TeamSettings.associate) {
  TeamSettings.associate({ Team });
}

// UserSetting
if (UserSetting.associate) {
  UserSetting.associate({ User });
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  sequelize,
  User,
  OnboardingProgress,
  OnboardingTask,
  UserTaskProgress,
  Department,
  Team,
  TeamSettings,
  Checklist,
  ChecklistItem,
  ChecklistProgress,
  ChecklistCombined,
  Feedback,
  FeedbackNote,
  FeedbackFollowup,
  FeedbackFollowupParticipant,
  Notification,
  NotificationTemplate,
  notification_preferences: NotificationPreference,
  Evaluation,
  EvaluationCriteria,
  SupervisorAssessment,
  HRAssessment,
  CoachingSession,
  Event,
  EventParticipant,
  ActivityLog,
  Survey,
  SurveyQuestion,
  SurveyResponse,
  SurveyQuestionResponse,
  SurveySchedule,
  Resource,
  ResourceAssignment,
  Program,
  Role,
  ReportTemplate,
  SystemSetting,
  UserSetting,
};
