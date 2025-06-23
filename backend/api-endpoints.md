API Endpoints Reference (for Backend)

Authentication
--------------
POST /auth/login  
Request Body:
{
  "email": "string",
  "password": "string"
}
Returns: { token: string, user: { id: string, email: string, role: string, ... } }

POST /auth/logout  
Request Body: (none)  
Returns: { success: true }

GET /auth/me  
Request Body: (none)  
Returns: { id: string, email: string, role: string, ... }

User & Team Management
---------------------
GET /users  
Request Body: (none)
Returns: Array of user objects with id, name, email, role, department, startDate
Access: Private

GET /users/:id  
Request Body: (none)
Returns: User object with id, name, email, role, department, startDate
Access: Private

POST /users  
Request Body:
{
  "email": "string",
  "name": "string",
  "role": "string",
  "department": "string (optional)",
  "startDate": "string (optional)"
}
Returns: Created user object
Access: Private (Admin/HR)

PUT /users/:id  
Request Body:
{
  "name": "string (optional)",
  "role": "string (optional)",
  "department": "string (optional)",
  "startDate": "string (optional)"
}
Returns: Updated user object
Access: Private (Admin/HR)

DELETE /users/:id  
Request Body: (none)
Returns: { success: true }
Access: Private (Admin)

GET /api/teams
Request Body: (none)
Returns: Array of team objects with members
Access: Private

GET /api/teams/:id
Request Body: (none)
Returns: Team object with members
Access: Private

POST /api/teams
Request Body:
{
  "name": "string",
  "description": "string (optional)",
  "department": "string (optional)"
}
Returns: Created team object
Access: Private (HR/Admin)

PUT /api/teams/:id
Request Body:
{
  "name": "string (optional)",
  "description": "string (optional)",
  "department": "string (optional)"
}
Returns: Updated team object
Access: Private (HR/Admin)

DELETE /api/teams/:id
Request Body: (none)
Returns: { message: "Team deleted successfully" }
Access: Private (Admin)
Note: Cannot delete teams with active members

GET /api/teams/settings
Request Body: (none)
Returns: Team settings object
Access: Private (Supervisor, HR, Admin)

PUT /api/teams/settings
Request Body:
{
  "reportFilters": "object (optional)",
  "coachingAlertsEnabled": "boolean (optional)"
}
Returns: Updated team settings
Access: Private (Supervisor, HR, Admin)

Programs & Onboarding
---------------------
GET /programs  
GET /programs/:id  
DELETE /programs/:id  

Calendar & Events
----------------
GET /events  
GET /events/:id  

POST /events  
Request Body:
{
  "title": "string",
  "date": "string",
  "time": "string",
  "location": "string",
  "attendees": 0,
  "type": "string"
}

PUT /events/:id  
Request Body:
{
  "title": "string (optional)",
  "date": "string (optional)",
  "time": "string (optional)"
}

DELETE /events/:id  

Checklists & Onboarding Progress
--------------------------------
GET /api/onboarding/journey  
GET /api/onboarding/journey/:userId  
PUT /api/onboarding/journey/:userId  
DELETE /api/onboarding/journey/:userId  
GET /api/onboarding/progresses  

GET /checklists  
GET /checklists/:id  

POST /checklists  
Request Body:
{
  "title": "string",
  "items": [
    { "text": "string" }
  ]
}

PUT /checklists/:id  
Request Body:
{
  "title": "string (optional)",
  "items": [
    { "id": "string", "text": "string", "completed": true }
  ]
}

DELETE /checklists/:id  

Notifications
-------------
GET /api/notifications  
GET /api/notifications/reminders  
GET /api/notifications/feedback-availability  
GET /api/notifications/documents  
GET /api/notifications/training  
GET /api/notifications/coaching-sessions  
GET /api/notifications/team-progress  
GET /api/notifications/overdue-tasks  
GET /api/notifications/feedback-submissions  
GET /api/notifications/probation-deadlines  
GET /api/notifications/onboarding-milestones  
GET /api/notifications/pending-approvals  
GET /api/notifications/team-followups  
GET /api/notifications/summary-reports  
GET /api/notifications/system-alerts  
GET /api/notifications/new-employees  
GET /api/notifications/feedback-checkpoints  
GET /api/notifications/weekly-reports  
GET /api/notifications/compliance-alerts  
GET /api/notifications/leave-requests  

Notification Preferences
------------------------
GET /api/notifications/preferences  

PUT /api/notifications/preferences  
Request Body:
{
  "emailNotifications": {
    "checklistAssignments": true,
    "reminders": true,
    "feedbackForms": true,
    "documents": true,
    "coachingSessions": true
  },
  "inAppNotifications": {
    "checklistAssignments": true,
    "reminders": true,
    "feedbackForms": true,
    "documents": true,
    "coachingSessions": true
  },
  "pushNotifications": {
    "checklistAssignments": false,
    "reminders": true,
    "feedbackForms": true,
    "documents": false,
    "coachingSessions": true
  },
  "frequency": "daily",
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  }
}

PUT /api/notifications/:notificationId/read  
PUT /api/notifications/read-all  
DELETE /api/notifications/:notificationId  

Notification Templates
----------------------
GET /api/notifications/templates  
POST /api/notifications/templates  
PUT /api/notifications/templates/:templateId  
DELETE /api/notifications/templates/:templateId  

Reports & Analytics  
-------------------  

EMPLOYEE:  
GET /api/analytics/personal/dashboard  
GET /api/analytics/personal/onboarding  
GET /api/analytics/personal/checklist  
GET /api/analytics/personal/training  
GET /api/analytics/personal/feedback  

GET /api/reports/personal/tasks  
GET /api/reports/personal/sessions  
GET /api/reports/personal/feedback  
GET /api/reports/personal/performance  

SUPERVISOR:  
GET /api/analytics/team/dashboard  
GET /api/analytics/team/checklist-progress  
GET /api/analytics/team/training  
GET /api/analytics/team/feedback  
GET /api/analytics/team/coaching  

GET /api/reports/team/export  
GET /api/reports/team/bottlenecks  
GET /api/reports/team/performance  

MANAGER:  
GET /api/analytics/department/dashboard  
GET /api/analytics/department/onboarding-kpi  
GET /api/analytics/department/probation  
GET /api/analytics/department/evaluations  
GET /api/analytics/department/feedback  

GET /api/reports/supervisor-activity  
GET /api/reports/onboarding-health  

POST /api/reports/schedule/department  
Request Body:
{
  "department": "string",
  "interval": "weekly | monthly",
  "metrics": ["onboarding", "feedback"]
}

GET /api/reports/export/department  

HR:  
GET /api/analytics/organization/dashboard  
GET /api/analytics/organization/completion-rates  
GET /api/analytics/organization/feedback-participation  
GET /api/analytics/organization/survey-trends  
GET /api/analytics/organization/training-completion  
GET /api/analytics/organization/evaluation-effectiveness  

GET /api/reports/templates  

POST /api/reports/templates  
Request Body:
{
  "name": "string",
  "description": "string",
  "type": "progress",
  "configuration": {
    "reportType": "progress",
    "userFilter": "individual"
  },
  "is_system_template": false
}

PUT /api/reports/templates/:id  
DELETE /api/reports/templates/:id  

POST /api/reports/schedule  
Request Body:
{
  "templateId": "string",
  "frequency": "weekly | monthly",
  "targetRoles": ["employee", "supervisor"]
}

PUT /api/reports/schedule/:id  
DELETE /api/reports/schedule/:id  

GET /api/analytics/organization/user/:userId  
GET /api/analytics/organization/program/:programId  
GET /api/analytics/organization/kpi  

Resources – Endpoints by Role  
-----------------------------  

EMPLOYEE:  
GET /resources  
GET /resources/:id  
POST /resources/:id/download  

SUPERVISOR:  
GET /resources  
GET /resources/usage?employeeId=...  

POST /resources/assign  
Request Body:
{
  "userId": "string",
  "resourceId": "string",
  "reason": "string (optional)"
}

MANAGER:  
GET /resources/summary  
GET /resources/recommendations  

HR:  
POST /resources  
Request Body:
{
  "title": "string",
  "description": "string",
  "url": "string",
  "type": "document | link | video | other",
  "stage": "prepare | orient | land | integrate | excel",
  "programType": "string (optional)"
}

PUT /resources/:id  
Request Body:
{
  "title": "string",
  "description": "string",
  "url": "string",
  "stage": "string",
  "programType": "string"
}

DELETE /resources/:id  
GET /resources  
GET /resources/analytics  

Settings – Endpoints by Role  
----------------------------  

EMPLOYEE:  
GET /usersettings/:userId  

PUT /usersettings/:userId  
Request Body:
{
  "theme": "light | dark | system",
  "emailNotifications": true,
  "pushNotifications": true,
  "profileVisibility": "everyone | team | supervisors",
  "compactMode": true
}

SUPERVISOR:  
GET /teams/settings  

PUT /teams/settings  
Request Body:
{
  "reportFilters": { },
  "coachingAlertsEnabled": true
}

MANAGER:  
GET /managers/:id/preferences  

PUT /managers/me/preferences  
Request Body:
{
  "alertThresholds": {
    "onboardingProgressBelow": 60
  },
  "notificationFrequency": "daily | weekly"
}

HR:  
GET /systemsettings  

PUT /systemsettings  
Request Body:
{
  "onboardingRules": { },
  "feedbackCycles": [3, 6, 12],
  "surveyAnonymity": true,
  "autoAssignChecklists": true,
  "notificationTemplates": { }
}

GET /roles  
POST /roles  
PUT /roles/:id  
DELETE /roles/:id  

Survey API Endpoints  
--------------------

EMPLOYEE:  
GET /api/surveys/available  

POST /api/surveys/:surveyId/respond  
Request Body:
{
  "responses": [
    {
      "questionId": "string",
      "rating": 4
    },
    {
      "questionId": "string",
      "selectedOption": "string"
    },
    {
      "questionId": "string",
      "answer": "string"
    }
  ]
}

GET /api/surveys/history  

SUPERVISOR:  
GET /api/surveys/team/results  
GET /api/surveys/team/completion-status  

MANAGER:  
GET /api/surveys/department/analytics  
GET /api/surveys/department/insights  

HR:  
POST /api/surveys/templates  
Request Body:
{
  "title": "string",
  "description": "string",
  "type": "6-month",
  "targetRole": "employee",
  "targetProgram": "inkompass",
  "questions": [
    {
      "question": "string",
      "type": "rating | multiple_choice | text",
      "required": true,
      "options": ["string"]
    }
  ]
}

POST /api/surveys/schedule  
Request Body:
{
  "surveyTemplateId": "template123",
  "schedule": {
    "triggerType": "timeAfterJoining",
    "triggerValue": 90,
    "reminderDays": [7, 3, 1]
  },
  "targetAudience": {
    "departments": ["all"],
    "roles": ["new_employees"],
    "joiningDateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  }
}

GET /api/surveys/monitoring  
GET /api/surveys/export  

PUT /api/surveys/templates/:templateId  
PUT /api/surveys/settings  
Request Body:
{
  "autoScheduling": true,
  "reminderSettings": {
    "enabled": true,
    "frequency": "weekly",
    "maxReminders": 3
  },
  "anonymityRules": {
    "defaultIsAnonymous": true,
    "allowResponderChoice": false
  },
  "dataRetention": {
    "keepResponsesForDays": 365,
    "archiveAfterDays": 90
  }
}

Evaluation Endpoints  
--------------------

EMPLOYEE:  
GET /api/evaluations/user  
GET /evaluations/:id  

SUPERVISOR:  
GET /evaluations  

POST /evaluations  
Request Body:
{
  "employeeId": "string",
  "evaluatorId": "string",
  "type": "performance",
  "evaluationDate": "2023-10-27T10:00:00Z",
  "status": "pending",
  "comments": "string",
  "ratings": {},
  "title": "string",
  "criteria": [
    {
      "category": "string",
      "name": "string",
      "weight": 0.3,
      "description": "string",
      "rating": 4,
      "comments": "string"
    }
  ]
}

POST /evaluations/:evaluationId/criteria  
Request Body:
{
  "category": "string",
  "name": "string",
  "rating": 4,
  "comments": "string"
}

PUT /api/evaluationcriteria/:id  
Request Body:
{
  "category": "string",
  "name": "string",
  "rating": 5,
  "comments": "string"
}

PATCH /api/evaluations/:id/submit  
Request Body:
{
  "scores": [
    {
      "criteriaId": "string",
      "score": 4,
      "comments": "string"
    }
  ]
}

GET /supervisors/:id/evaluations  

MANAGER:  
GET /evaluations  
GET /evaluations/:id  

PATCH /evaluations/:id/validate  
Request Body:
{
  "status": "completed",
  "reviewComments": "Evaluation reviewed and validated by HR department."
}

GET /reports/evaluations  

HR:  
GET /evaluations  
POST /evaluations (same as above)  
PUT /evaluations/:id  
DELETE /evaluations/:id  

GET /reports/evaluations  
GET /evaluations/:evaluationId/criteria  
DELETE /evaluationcriteria/:id  
PATCH /evaluations/:id/validate (same as above)  
GET /employees/:id/evaluations  

Feedback API Endpoints  
----------------------

EMPLOYEE:  
POST /api/feedback  
Request Body:
{
  "type": "onboarding",
  "content": "string",
  "isAnonymous": false,
  "shareWithSupervisor": true,
  "category": "training"
}

GET /api/feedback/history  

SUPERVISOR:  
GET /api/team/feedback  

POST /api/feedback/:feedbackId/response  
Request Body:
{
  "response": "Thank you for your feedback. We will implement your suggestions in the next training session.",
  "status": "addressed"
}

MANAGER:  
GET /api/feedback/department  
GET /api/feedback/analytics  

HR:  
GET /api/feedback/all  

PUT /api/feedback/:feedbackId/categorize  
Request Body:
{
  "categories": ["training", "supervisor", "process"],
  "priority": "high",
  "status": "under_review"
}

POST /api/feedback/:feedbackId/escalate  
Request Body:
{
  "escalateTo": "manager",
  "reason": "Requires immediate attention",
  "notifyParties": ["supervisor", "hr"]
}

GET /api/feedback/export  

Admin Panel Endpoints  
---------------------

USER MANAGEMENT:  
GET /users  
POST /users  
PUT /users/:id  
DELETE /users/:id  
PATCH /users/:id/status  

TEAM MANAGEMENT:  
GET /teams  
POST /teams  
PUT /teams/:id  
DELETE /teams/:id  

ROLE & PERMISSION MANAGEMENT:  
GET /roles  
POST /roles  
PUT /roles/:id  
DELETE /roles/:id  

PROGRAMS & STRUCTURE:  
GET /programs  
POST /programs  
PUT /programs/:id  
DELETE /programs/:id  

SYSTEM SETTINGS:  
GET /systemsettings  
PUT /systemsettings (see above for request body)  

ACTIVITY LOGS:  
GET /activitylogs  

EVALUATIONS:  
GET /evaluations  
POST /evaluations  
PUT /evaluations/:id  

FEEDBACK & SURVEYS:  
GET /feedback  
GET /surveys  
POST /surveys  
PUT /surveys/:id  

REPORTING & ANALYTICS:  
GET /reports  
POST /reports/run  
GET /analytics/overview  

NOTIFICATIONS:  
GET /notifications  
POST /notifications  
PUT /notificationtemplates/:id  
