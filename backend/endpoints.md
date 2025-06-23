endpoint
/*
 * API Endpoints Reference (for Backend)
 *
 * This file lists the endpoints that should be built (or replaced) in your backend API
 * to replace the demo (mock) data used in the frontend.
 *
 * Authentication
 * --------------
 * POST /auth/login
 *    Request body: { email: string, password: string }
 *    Returns: { token: string, user: { id: string, email: string, role: string, ... } }
 *
 * POST /auth/logout
 *    Request body: (none) (or { token: string } if you invalidate tokens)
 *    Returns: { success: true }
 *
 *
 *
 * GET /auth/me
 *    Request body: (none) (uses auth header)
 *    Returns: { id: string, email: string, role: string, ... }
 *
 * User & Team Management
 * ---------------------
 * GET /users
 *    Request body: (none) (or query params for filtering)
 *    Returns: [ { id: string, name: string, role: string, ... }, ... ]
 *
 * GET /users/:id
 *    Request body: (none)
 *    Returns: { id: string, name: string, role: string, ... }
 *
 * POST /users (admin)
 *    Request body: { email: string, name: string, role: string, ... }
 *    Returns: { id: string, email: string, name: string, role: string, ... }
 *
 * PUT /users/:id
 *    Request body: { name?: string, role?: string, ... }
 *    Returns: { id: string, email: string, name: string, role: string, ... }
 *
 * DELETE /users/:id (admin)
 *    Request body: (none)
 *    Returns: { success: true }
 *
 * GET /team
 *    Request body: (none) (or query params for filtering)
 *    Returns: [ { id: string, name: string, role: string, program: string, stage: string, progress: number, daysInProgram: number, avatar: string, ... }, ... ]
 *
 * Programs & Onboarding
 * ---------------------
 * GET /programs
 *    Request body: (none) (or query params for filtering)
 *    Returns: [ { id: string, title: string, description: string, duration: string, objective: string, ... }, ... ]
 *
 * GET /programs/:id
 *    Request body: (none)
 *    Returns: { id: string, title: string, description: string, duration: string, objective: string, ... }
 *
 * maybe update program ----------------
 * 
 * 
 * DELETE /programs/:id (admin)
 *    Request body: (none)
 *    Returns: { success: true }
 *
 * Calendar & Events
 * ----------------
 * GET /events
 *    Request body: (none) (or query params for filtering, e.g. by date)
 *    Returns: [ { id: number, title: string, date: string, time: string, location: string, attendees: number, type: string, ... }, ... ]
 *
 * GET /events/:id
 *    Request body: (none)
 *    Returns: { id: number, title: string, date: string, time: string, location: string, attendees: number, type: string, ... }
 *
 * POST /events (HR/manager)
 *    Request body: { title: string, date: string, time: string, location: string, attendees: number, type: string, ... }
 *    Returns: { id: number, title: string, date: string, ... }
 *
 * DELETE /events/:id
 *    Request body: (none)
 *    Returns: { success: true }
 * 
 * PUT /events/:id
 *    Request body: { title?: string, date?: string, time?: string, ... }
 *    Returns: { id: number, title: string, date: string, ... }
 *
 * Checklists------------------------------------<><><><><>
 * 
 * ------ onboarding process--------
 * | /api/onboarding/journey | GET | Employee | Get my onboarding progress |
| /api/onboarding/journey/:userId | GET | HR/Admin | Get onboarding progress for an employee |
| /api/onboarding/progresses | GET | HR/Admin | Get all onboarding progresses |
| /api/onboarding/journey/:userId | PUT | HR/Admin | Update onboarding progress for employee |
| /api/onboarding/journey/:userId | DELETE | HR/Admin | Delete onboarding progress (optional) |
 * ----------
 * GET /checklists
 *    Request body: (none) (or query params for filtering)
 *    Returns: [ { id: string, title: string, items: [ { id: string, text: string, completed: boolean, ... }, ... ], ... }, ... ]
 *
 * GET /checklists/:id
 *    Request body: (none)
 *    Returns: { id: string, title: string, items: [ { id: string, text: string, completed: boolean, ... }, ... ], ... }
 *
 * POST /checklists
 *    Request body: { title: string, items: [ { text: string, ... }, ... ], ... }
 *    Returns: { id: string, title: string, items: [ { id: string, text: string, completed: boolean, ... }, ... ], ... }
 *
 * PUT /checklists/:id
 *    Request body: { title?: string, items?: [ { id?: string, text?: string, completed?: boolean, ... }, ... ], ... }
 *    Returns: { id: string, title: string, items: [ { id: string, text: string, completed: boolean, ... }, ... ], ... }
 *
 * DELETE /checklists/:id
 *    Request body: (none)
 *    Returns: { success: true }

 # Postman Test Data for Notification API Endpoints

## Setup

1. Import the API endpoints into Postman
2. Setup an environment with:
   - `baseUrl`: Your API base URL (e.g., http://localhost:5000)
   - `token`: Authentication token obtained from login

## Authentication

### Login to get a token

**POST {{baseUrl}}/api/auth/login**

```json
{
  "email": "hr@pmi.com",
  "password": "password123"
}
```

## EMPLOYEE NOTIFICATION ENDPOINTS

### Get All Notifications

**GET {{baseUrl}}/api/notifications**

Headers:

```
Authorization: Bearer {{token}}
```

Query params (optional):

```
type=checklist
isRead=false
limit=10
page=1
```

### Get Reminders for Upcoming/Overdue Items

**GET {{baseUrl}}/api/notifications/reminders**

Headers:

```
Authorization: Bearer {{token}}
```

Query params (optional):

```
status=upcoming
days=7
```

### Get Feedback Form Availability

**GET {{baseUrl}}/api/notifications/feedback-availability**

Headers:

```
Authorization: Bearer {{token}}
```

### Get New Documents/Training Notifications

**GET {{baseUrl}}/api/notifications/documents**

Headers:

```
Authorization: Bearer {{token}}
```

**GET {{baseUrl}}/api/notifications/training**

Headers:

```
Authorization: Bearer {{token}}
```

### Get Coaching Session Notifications

**GET {{baseUrl}}/api/notifications/coaching-sessions**

Headers:

```
Authorization: Bearer {{token}}
```

## SUPERVISOR NOTIFICATION ENDPOINTS

### Get Team Progress Notifications

**GET {{baseUrl}}/api/notifications/team-progress**

Headers:

```
Authorization: Bearer {{token}}
```

Query params (optional):

```
teamId=123
status=pending
```

### Get Overdue Tasks Alerts

**GET {{baseUrl}}/api/notifications/overdue-tasks**

Headers:

```
Authorization: Bearer {{token}}
```

Query params (optional):

```
severity=high
daysOverdue=7
```

### Get Feedback Submissions

**GET {{baseUrl}}/api/notifications/feedback-submissions**

Headers:

```
Authorization: Bearer {{token}}
```

### Get Probation Deadlines

GET /api/notifications/probation-deadlines - Shows all deadlines in next 3 months
GET /api/notifications/probation-deadlines?daysUntil=30 - Shows deadlines in next 30 days

Headers:

```
Authorization: Bearer {{token}}
```

Query params (optional):

```
daysUntil=30
status=pending
```

## MANAGER NOTIFICATION ENDPOINTS

### Get Onboarding Milestones

**GET {{baseUrl}}/api/notifications/onboarding-milestones**

Headers:

```
Authorization: Bearer {{token}}
```

Query params (optional):

```
department=IT
stage=orient
```

### Get Pending Approvals

**GET {{baseUrl}}/api/notifications/pending-approvals**

Headers:

```
Authorization: Bearer {{token}}
```

### Get Team Follow-ups

**GET {{baseUrl}}/api/notifications/team-followups**

Headers:

```
Authorization: Bearer {{token}}
```



## HR NOTIFICATION ENDPOINTS

### Get Summary Reports
/api/notifications/summary-reports?period=weekly
/api/notifications/summary-reports?period=monthly&department=Sales

**GET {{baseUrl}}/api/notifications/summary-reports**

Headers:

```
Authorization: Bearer {{token}}
```

Query params (optional):

```
period=weekly
department=Sales
```

### Get System Alerts

**GET {{baseUrl}}/api/notifications/system-alerts**

Headers:

```
Authorization: Bearer {{token}}
```

Query params (optional):

```
severity=high
type=error
```

### Get New Employee Alerts

**GET {{baseUrl}}/api/notifications/new-employees**
GET /api/notifications/new-employees?days=30&department=engineering


Headers:

```
Authorization: Bearer {{token}}
```

### Get Feedback Checkpoints

**GET {{baseUrl}}/api/notifications/feedback-checkpoints**

Headers:

```
Authorization: Bearer {{token}}
```

Query params (optional):

```
checkpointType=3month
status=pending
```

### Get Weekly Progress Reports

**GET {{baseUrl}}/api/notifications/weekly-reports**
/api/notifications/weekly-reports
/api/notifications/weekly-reports?department=HR
/api/notifications/weekly-reports?week=2025-W20
/api/notifications/weekly-reports?department=HR&week=2025-W20

Headers:

```
Authorization: Bearer {{token}}
```

Query params (optional):

```
department=HR
week=2025-W20
```

### Get Compliance Alerts

**GET {{baseUrl}}/api/notifications/compliance-alerts**

Headers:

```
Authorization: Bearer {{token}}
```

### Get Leave Request Notifications

**GET {{baseUrl}}/api/notifications/leave-requests**

Headers:

```
Authorization: Bearer {{token}}
```

## NOTIFICATION SETTINGS ENDPOINTS

### Get Notification Preferences

**GET {{baseUrl}}/api/notifications/preferences**

Headers:

```
Authorization: Bearer {{token}}
```

### Update Notification Preferences

**PUT {{baseUrl}}/api/notifications/preferences**

Headers:

```
Authorization: Bearer {{token}}
```

Body:

```json
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
```

### Mark Notification as Read

**PUT {{baseUrl}}/api/notifications/:notificationId/read**

Headers:

```
Authorization: Bearer {{token}}
```

### Mark All Notifications as Read

**PUT {{baseUrl}}/api/notifications/read-all**

Headers:

```
Authorization: Bearer {{token}}
```

### Delete Notification

**DELETE {{baseUrl}}/api/notifications/:notificationId**

Headers:

```
Authorization: Bearer {{token}}
```

## NOTIFICATION TEMPLATES (HR Only)

### Get Notification Templates

**GET {{baseUrl}}/api/notifications/templates**

Headers:

```
Authorization: Bearer {{token}}
```

### Create Notification Template

**POST {{baseUrl}}/api/notifications/templates**

Headers:

```
Authorization: Bearer {{token}}
```

Body:

```json
{
  "name": "Checklist Assignment",
  "type": "checklist_assignment",
  "subject": "New Checklist Assigned",
  "body": "A new checklist has been assigned to you: {{checklistName}}",
  "variables": ["checklistName", "dueDate"],
  "channels": ["email", "inApp"]
}
```

### Update Notification Template

**PUT {{baseUrl}}/api/notifications/templates/:templateId**

Headers:

```
Authorization: Bearer {{token}}
```

Body:

```json
{
  "name": "Updated Checklist Assignment",
  "subject": "New Checklist Assignment",
  "body": "You have been assigned a new checklist: {{checklistName}}. Due date: {{dueDate}}",
  "variables": ["checklistName", "dueDate"],
  "channels": ["email", "inApp", "push"]
}
```

### Delete Notification Template

**DELETE {{baseUrl}}/api/notifications/templates/:templateId**

Headers:

```
Authorization: Bearer {{token}}
```
# Reports & Analytics API Endpoints Documentation
## Employee Role Endpoints

### Personal Analytics
- `GET /api/analytics/personal/dashboard` - Get personal analytics dashboard
- `GET /api/analytics/personal/onboarding` - Get personal onboarding analytics
- `GET /api/analytics/personal/checklist` - Get checklist completion percentage
- `GET /api/analytics/personal/training` - Get training progress
- `GET /api/analytics/personal/feedback` - Get feedback history

### Personal Reports
- `GET /api/reports/personal/tasks` - Get completed tasks report
- `GET /api/reports/personal/sessions` - Get attended sessions report
- `GET /api/reports/personal/feedback` - Get submitted feedback report
- `GET /api/reports/personal/performance` - Get individual performance summary (if permitted)## ma khedamach o ghaaa kat 3seb waste of time db

## Supervisor Role Endpoints

### Team Analytics
- `GET /api/analytics/team/dashboard` - Get team-level analytics dashboard
- `GET /api/analytics/team/checklist-progress` - Get checklist progress per employee
- `GET /api/analytics/team/training` - Get training participation and completion
- `GET /api/analytics/team/feedback` - Get feedback trends (non-anonymous)
- `GET /api/analytics/team/coaching` - Get coaching session tracking and notes

### Report Generation
- `GET /api/reports/team/export` - Export team reports
- `GET /api/reports/team/bottlenecks` - Get onboarding bottlenecks analysis
- `GET /api/reports/team/performance` - Get team performance reports

## Manager Role Endpoints

### Department Analytics
- `GET /api/analytics/department/dashboard` - Get department-wide analytics dashboard
- `GET /api/analytics/department/onboarding-kpi` - Get onboarding KPIs per team/supervisor
- `GET /api/analytics/department/probation` - Get probation milestone tracking and task adherence
- `GET /api/analytics/department/evaluations` - Get evaluation results comparison across teams
- `GET /api/analytics/department/feedback` - Get feedback and satisfaction trends

### Monitoring & Reports
- `GET /api/reports/supervisor-activity` - Get supervisor activity reports
- `GET /api/reports/onboarding-health` - Get employee onboarding health metrics
- `POST /api/reports/schedule/department` - Schedule department-specific reports
- `GET /api/reports/export/department` - Export department reports

## HR Role Endpoints

### Organization-wide Analytics
- `GET /api/analytics/organization/dashboard` - Get organization-wide analytics dashboard
- `GET /api/analytics/organization/completion-rates` - Get completion rates by department/program
- `GET /api/analytics/organization/feedback-participation` - Get feedback participation at 3, 6, 12 months
- `GET /api/analytics/organization/survey-trends` - Get survey response quality and trends
- `GET /api/analytics/organization/training-completion` - Get training completion vs. role expectations
- `GET /api/analytics/organization/evaluation-effectiveness` - Get evaluation and coaching effectiveness

### Report Management
- `GET /api/reports/templates` - Get all report templates
- `POST /api/reports/templates` - Create a new report template
{
  "name": "Personal Progress Report change test",
  "description": "Individual progress tracking report",
  "type": "progress",
  "configuration": {
    "reportType": "progress",
    "userFilter": "individual"
  },
  "is_system_template": false 
}
- `PUT /api/reports/templates/:id` - Update a report template
- `DELETE /api/reports/templates/:id` - Delete a report template
- `POST /api/reports/schedule` - Schedule automatic report delivery
- `PUT /api/reports/schedule/:id` - Update report schedule
- `DELETE /api/reports/schedule/:id` - Delete report schedule

### Data Export
- `GET /api/reports/export 

### Detailed Analytics
- `GET /api/analytics/organization/user/:userId` - Get detailed user-level data
- `GET /api/analytics/organization/program/:programId` - Get aggregated program insights
- `GET /api/analytics/organization/kpi` - Get HR KPI metrics and trends
http://localhost:5000/api/analytics/organization/kpi?fields=trainingCompletion,surveyParticipation




## Common Features

### Export Formats
- JSON (default)
- CSV
- Excel (.xlsx)
- PDF

### Filtering Options
- Date range
- Department
- Team
- Program type
- Role
- Status
- Custom metrics

### Report Scheduling Options
- Daily
- Weekly
- Monthly
- Quarterly
- Custom intervals

## Authentication and Authorization
- All endpoints require authentication
- Role-based access control implemented
- Data access restricted based on role hierarchy
- Audit logging for sensitive data access

## Notes
1. All endpoints are prefixed with `/api`
2. Role hierarchy: HR > Manager > Supervisor > Employee
3. Higher roles inherit access to lower role endpoints
4. All endpoints support proper error handling and validation
5. Pagination implemented for large datasets
6. Caching implemented for frequently accessed reports
7. Real-time analytics available where applicable
8. Custom date ranges supported for all reports 
### Resources – Endpoints by Role

---

## EMPLOYEE

#### GET /resources
* Description: List all accessible resources (based on stage, role, or program).
* Query Params: stage, type, programType
* Returns: [ { id, title, type, url, createdAt }, ... ]

#### GET /resources/:id
* Description: View specific resource details.
* Returns: { id, title, description, type, url, createdAt, updatedAt }

#### POST /resources/:id/download
* Description: Track and initiate resource download.
* Returns: download link or success acknowledgment.

---

## SUPERVISOR

#### GET /resources
* Description: Browse all available resources.

#### GET /resources/usage?employeeId=...
* Description: View resource usage by a specific employee (if tracking is enabled).
* Returns: [ { resourceId, accessedAt, completed }, ... ]

#### POST /resources/assign
* Description: Recommend or assign specific resources to an employee.
* Request Body:
  {
    userId: string,
    resourceId: string,
    reason?: string
  }

---

## MANAGER

#### GET /resources/summary
* Description: View usage summary across teams or departments.
* Query Params: departmentId, teamId, stage
* Returns: { resourceId, accessCount, completionRate, avgTimeSpent }

#### GET /resources/recommendations
* Description: View recommended resources by role or performance data.

---

## HR (HUMAN RESOURCES)

#### POST /resources
* Description: Upload or create a new resource.
* Request Body:
  {
    title: string,
    description: string,
    url: string,
    type: 'document' | 'link' | 'video' | 'other',
    stage: 'prepare' | 'orient' | 'land' | 'integrate' | 'excel',
    programType?: string
  }

#### PUT /resources/:id
* Description: Update resource metadata.
* Request Body: { title, description, url, stage, programType }

#### DELETE /resources/:id
* Description: Delete a resource.
* Returns: { success: true }

#### GET /resources
* Description: View all resources with advanced filtering and management controls.

#### GET /resources/analytics
* Description: Get global resource access analytics.
* Query Params: resourceId, dateRange
* Returns: { accessStats, downloadStats, usageByRole }
SETTINGS – Endpoints by Role

## EMPLOYEE

GET    /usersettings/:userId
→ View personal settings (theme, notifications, visibility)
  
PUT    /usersettings/:userId
→ Update personal preferences
Request Body:
{
  theme: 'light' | 'dark' | 'system',
  emailNotifications: boolean,
  pushNotifications: boolean,
  profileVisibility: 'everyone' | 'team' | 'supervisors',
  compactMode: boolean
}

---

## SUPERVISOR

GET    /teams/settings
→ View team-specific preferences (report views, coaching alert thresholds)

PUT    /teams/settings
→ Update team-level settings
Request Body:
{
  reportFilters: { ... },
  coachingAlertsEnabled: boolean
}

---

## MANAGER

GET    /managers/:id/preferences
→ View manager-level settings and alert configurations

PUT    /managers/me/preferences
→ Update alert thresholds, filters, escalation rules
Request Body:
{
  alertThresholds: {
    onboardingProgressBelow: 60
  },
  notificationFrequency: 'daily' | 'weekly'
}

---

## HR (HUMAN RESOURCES)

GET    /systemsettings
→ View all global HR-configured system settings

PUT    /systemsettings
→ Update system-wide logic or timing
Request Body:
{
  onboardingRules: {...},
  feedbackCycles: [3, 6, 12],
  surveyAnonymity: boolean,
  autoAssignChecklists: boolean,
  notificationTemplates: { ... }
}

GET    /roles
→ List all roles and their permissions

POST   /roles
→ Create a new role with custom permissions

PUT    /roles/:id
→ Update role permissions

DELETE /roles/:id
→ Delete role
# Postman Test Data for Survey API Endpoints

## Setup

1. Import the API endpoints into Postman
2. Setup an environment with:
   - `baseUrl`: Your API base URL (e.g., http://localhost:5000)
   - `token`: Authentication token obtained from login

## EMPLOYEE ENDPOINTS

### View Available Surveys

**GET {{baseUrl}}/api/surveys/available**

Headers:
```
Authorization: Bearer {{token}}
```

### Submit Survey Response

**POST {{baseUrl}}/api/surveys/:surveyId/respond**
http://localhost:5000/api/surveys/71a31cd7-e3c1-4218-a30d-1d1fe4c22a1c/respond
Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "responses": [
    {
      "questionId": "a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f",
      "rating": 4
    },
    {
      "questionId": "b2c3d4e5-f6g7-5432-8765-2b3c4d5e6f7g",
      "selectedOption": "Technical Training"
    },
    {
      "questionId": "c3d4e5f6-g7h8-6543-8765-3c4d5e6f7g8h",
      "answer": "More pair programming sessions would have been helpful."
    }
  ]
}
```

### View Survey History

**GET {{baseUrl}}/api/surveys/history**

Headers:
```
Authorization: Bearer {{token}}
```

## SUPERVISOR ENDPOINTS

### View Team Survey Results

**GET {{baseUrl}}/api/surveys/team/results**
GET /api/surveys/team/results?view=individual&employeeId=123
GET /api/surveys/team/results?startDate=2024-01-01&endDate=2024-03-31

Headers:
```
Authorization: Bearer {{token}}
```

### Track Survey Completion Status

**GET {{baseUrl}}/api/surveys/team/completion-status**
GET /api/surveys/team/completion-status?status=active



Headers:
```
Authorization: Bearer {{token}}
```

## MANAGER ENDPOINTS

### View Department Survey Analytics

**GET {{baseUrl}}/api/surveys/department/analytics**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
startDate=2024-01-01
endDate=2024-12-31
surveyType=onboarding
```

### Generate Survey Insights

**GET {{baseUrl}}/api/surveys/department/insights**

Headers:
```
Authorization: Bearer {{token}}
```

## HR ENDPOINTS

### Create Survey Template

**POST {{baseUrl}}/api/surveys/templates**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "title": "6-Month Performance Review Template",
  "description": "Standard template for conducting 6-month performance reviews",
  "type": "6-month",
  "targetRole": "employee",
  "targetProgram": "inkompass",
  "questions": [
    {
      "question": "How would you rate your overall performance in the last 6 months?",
      "type": "rating",
      "required": true
    },
    {
      "question": "Which areas do you feel you've shown the most growth?",
      "type": "multiple_choice",
      "required": true,
      "options": [
        "Technical Skills",
        "Communication",
        "Leadership",
        "Problem Solving",
        "Team Collaboration"
      ]
    },
    {
      "question": "What are your key achievements in this period?",
      "type": "text",
      "required": true
    }
  ]
}
```

### Schedule Survey Distribution

**POST {{baseUrl}}/api/surveys/schedule**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
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
```

### Monitor Survey Participation

**GET {{baseUrl}}/api/surveys/monitoring**
**http://localhost:5000/api/surveys/monitoring?department=Engineering&programType=inkompass**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
surveyId=survey123
department=Engineering
startDate=2024-01-01
```

### Export Survey Results

**GET {{baseUrl}}/api/surveys/export**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
format=xlsx
surveyId=survey123
dateRange=quarterly
includeComments=true
```

### Update Survey Template

**PUT {{baseUrl}}/api/surveys/templates/:templateId**
19775352-0eeb-4465-92d9-736c7a1e8522

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json

{
  "title": "Updated 6-Month Performance Review Template",
  "description": "Standard template for conducting performance reviews",
  "type": "6-month",
  "targetRole": "employee",
  "targetProgram": "all",
  "status": "draft",
  "questions": [
    {
      "id": "07346656-b876-46c1-9e2d-3f87fad58889",
      "question": "How would you rate your overall performance?",
      "type": "rating",
      "required": 1,
      "options": [1, 2, 3, 4, 5],
      "questionOrder": 1
    },
    {
      "id": "60c97763-25a1-4744-9bee-58c7e53ac550",
      "question": "Please describe your goals for the next 6 months",
      "type": "text",
      "required": 1,
      "questionOrder": 2
    },
    {
      "question": "Which areas have you improved the most?",
      "type": "multiple_choice",
      "required": 1,
      "options": ["Technical Skills", "Communication", "Leadership", "Project Management"],
      "questionOrder": 3
    }
  ]
}
```

### Configure Survey Rules

**PUT {{baseUrl}}/api/surveys/settings**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
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
```
### Evaluations – Endpoints by Role

---

## EMPLOYEE

#### GET /api/evaluations/user
* Description: List all evaluations for a specific employee.
* Returns: [ { id, type, status, completedAt }, ... ]

#### GET /evaluations/:id
* Description: View personal evaluation details.
* Returns: { id, employeeId, evaluatorId, status, type, criteria: [...], comments, createdAt }

---

## SUPERVISOR

#### GET /evaluations
* Description: List all evaluations (can filter by evaluatorId or employeeId).
* Query Params: employeeId, status, type
* Returns: [ { id, employeeId, status, createdAt }, ... ]

#### POST /evaluations
* Description: Create a new evaluation for an employee.
* Request Body:
       {
  "employeeId": "b0d033a6-d9a5-43dd-8986-9ce074aca89e",
  "evaluatorId": "f3d204a0-8cac-44fe-99b8-7ed7006eabc3",
  "type": "performance",
  "evaluationDate": "2023-10-27T10:00:00Z",
  "status": "pending",
  "comments": "Overall comments for the evaluation.",
  "ratings": {},
  "title": "Performance Review Q4 2023",
  "criteria": [
    {
      "category": "Technical Skills",
      "name": "Problem Solving",
      "weight": 0.4,
      "description": "Ability to solve complex technical issues.",
      "rating": 4,
      "comments": "Shows strong problem-solving skills."
    },
    {
      "category": "Communication",
      "name": "Team Collaboration",
      "weight": 0.3,
      "description": "Effectively works with team members.",
      "rating": 5,
      "comments": "Excellent collaboration."
    }
  ]
}
#### POST /evaluations/:evaluationId/criteria
        {
          "category": "Performance",
          "name": "Problem Solving Ability",
          "rating": 4,
          "comments": "Employee demonstrates strong problem-solving skills."
        }
#### PUT /api/evaluationcriteria/56a073a8-3bef-11f0-ba41-f875a44d165a
        {
          "category": "Performance",
          "name": "Problem Solving Ability",
          "rating": 5,
          "comments": "Employee demonstrates strong problem-solving skills."
        }

#### PATCH http://localhost:5000/api/evaluations/3af7ca7f-3bed-11f0-ba41-f875a44d165a/submit
        {
          "scores": [
            {
              "criteriaId": "56a073a8-3bef-11f0-ba41-f875a44d165a",
              "score": 4,
              "comments": "Final comments on criterion 1."
            },
            {
              "criteriaId": "c4b7863a-ebfc-4d1a-b0a7-f96e22b870ed",
              "score": 5,
              "comments": "Final comments on criterion 2."
            }
          ]
        }

#### GET /supervisors/:id/evaluations
http://localhost:5000/api/supervisor/f3d204a0-8cac-44fe-99b8-7ed7006eabc3/evaluations
* Description: List evaluations created by this supervisor.

---

## MANAGER

#### GET /evaluations
* Description: View all evaluations within managed teams.
* Query Params: departmentId, supervisorId, dateRange

#### GET /evaluations/:id
* Description: View full evaluation detail.

#### PATCH /evaluations/:id/validate
* Description: Validate or approve an evaluation.

#### GET /reports/evaluations
* Description: View team-level or supervisor-level evaluation reports.

---

## HR (HUMAN RESOURCES)

#### GET /evaluations
* Description: View and manage all evaluations across the company.

#### POST /evaluations
* Description: Create evaluations directly or on behalf of supervisors.

#### PUT /evaluations/:id
* Description: Update or correct evaluation entries.

#### DELETE /evaluations/:id
* Description: Delete an evaluation.

#### GET /reports/evaluations
* Description: Generate global evaluation reports.
* Query Params: departmentId, programType, dateRange

#### GET /evaluations/:evaluationId/criteria
* Description: View evaluation criteria entries.

#### DELETE /evaluationcriteria/:id
* Description: Remove a specific criterion.

#### PATCH /evaluations/:id/validate
* Description: HR-level validation of evaluations.
{
  "status": "completed", // Set the status to indicate validation (e.g., 'completed', 'approved')
  "reviewComments": "Evaluation reviewed and validated by HR department." // Add any relevant comments
}

#### GET /employees/:id/evaluations

http://localhost:5000/api/reports/evaluations?departmentId=some-department-id&endDate=2024-06-01
* Description: View all evaluations related to one employee for audit or review.

---
# Postman Test Data for Feedback API Endpoints

## Setup

1. Import the API endpoints into Postman
2. Setup an environment with:
   - `baseUrl`: Your API base URL (e.g., http://localhost:5000)
   - `token`: Authentication token obtained from login

## EMPLOYEE ENDPOINTS

### Submit Feedback

**POST {{baseUrl}}/api/feedback**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "type": "onboarding",
  "content": "The training materials were very helpful and well-organized",
  "isAnonymous": false,
  "shareWithSupervisor": true,
  "category": "training"
}
```

### View Personal Feedback History

**GET {{baseUrl}}/api/feedback/history**

Headers:
```
Authorization: Bearer {{token}}
```

## SUPERVISOR ENDPOINTS

### View Team Feedback

**GET {{baseUrl}}/api/team/feedback**

Headers:
```
Authorization: Bearer {{token}}
```

Response:
```json
[
  {
    "id": "uuid",
    "type": "onboarding|training|support|general",
    "message": "Feedback content",
    "isAnonymous": false,
    "createdAt": "timestamp",
    "sender": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "employee"
    },
    "receiver": {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "employee"
    }
  }
]
```

### Respond to Feedback

**POST {{baseUrl}}/api/feedback/:feedbackId/response**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "response": "Thank you for your feedback. We will implement your suggestions in the next training session.",
  "status": "addressed"
}
```

## MANAGER ENDPOINTS

### View Department Feedback

**GET {{baseUrl}}/api/feedback/department**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
startDate=2024-01-01
endDate=2024-12-31
category=training
```

### Track Feedback Trends

**GET {{baseUrl}}/api/feedback/analytics**

Headers:
```
Authorization: Bearer {{token}}
```

## HR ENDPOINTS

### View All Feedback

**GET {{baseUrl}}/api/feedback/all**

Headers:
```
Authorization: Bearer {{token}}



With filters: http://localhost:5000/api/feedback/all?type=onboarding&status=pending&startDate=2024-01-01&endDate=2024-12-31
```

### Categorize Feedback

**PUT {{baseUrl}}/api/feedback/:feedbackId/categorize**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "categories": ["training", "supervisor", "process"],
  "priority": "high",
  "status": "under_review"
}
```

### Escalate Feedback

**POST {{baseUrl}}/api/feedback/:feedbackId/escalate**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "escalateTo": "manager",
  "reason": "Requires immediate attention",
  "notifyParties": ["supervisor", "hr"]
}
```

### Export Feedback Report

**GET {{baseUrl}}/api/feedback/export**

?format=csv

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
format=csv
dateRange=monthly
category=all
ADMIN PANEL – Endpoints Overview

## USER MANAGEMENT

GET    /users
→ List all users

POST   /users
→ Create a new user

PUT    /users/:id
→ Update user details (name, email, role, supervisorId, teamId)

DELETE /users/:id
→ Delete or deactivate a user

---

## TEAM MANAGEMENT

GET    /teams
→ View all teams

POST   /teams
→ Create a team

PUT    /teams/:id
→ Update team details or assign members

---

## ROLE & PERMISSION CONTROL

GET    /roles
→ List all roles and their permissions

POST   /roles
→ Create a new role

PUT    /roles/:id
→ Modify permissions or role metadata

DELETE /roles/:id
→ Remove role (if not system-critical)

---

## SYSTEM CONFIGURATION

GET    /systemsettings
→ View all global settings (onboarding logic, survey timing, feedback policies)

PUT    /systemsettings
→ Update or toggle automation features, defaults, alert settings

---

## REPORT & AUDIT ACCESS

GET    /activitylogs
→ View user action logs (searchable by user/date/entity)

GET    /reports
→ Access and run pre-configured reports or templates

GET    /reports/:id/export
→ Export report (PDF/Excel)

---

## NOTIFICATION MANAGEMENT

GET    /notifications
→ View all platform-generated notifications (filterable by user/type/date)

POST   /notifications
→ Send a manual broadcast/alert

PUT    /notificationtemplates/:id
→ Update predefined templates for onboarding, reminders, evaluations

---

These endpoints support the full admin panel functionality for managing users, teams, roles, system logic, and platform settings.
ADMIN PANEL – Core Endpoints
============================

## USER MANAGEMENT

GET    /users
→ List all users with filtering (by role, department, status)

POST   /users
→ Create a new user (employee, supervisor, HR, manager)

GET    /users/:id
→ Get detailed user profile

PUT    /users/:id
→ Update user data (name, email, role, supervisorId, teamId, etc.)

DELETE /users/:id
→ Deactivate or delete user

PATCH  /users/:id/status
→ Change user status (active, archived, probation, etc.)

---

## ROLE & PERMISSION MANAGEMENT

GET    /roles
→ List all roles and their permissions

POST   /roles
→ Create a new role

PUT    /roles/:id
→ Update existing role (permissions, name)

DELETE /roles/:id
→ Delete a role (if not protected)

---

## TEAM MANAGEMENT

GET    /teams
→ View list of all teams

POST   /teams
→ Create a new team

PUT    /teams/:id
→ Update team name, department, or members

DELETE /teams/:id
→ Delete a team (optional)

---

## PROGRAMS & STRUCTURE

GET    /programs
→ List all onboarding/training programs

POST   /programs
→ Create a new program

PUT    /programs/:id
→ Edit program details

DELETE /programs/:id
→ Remove program

---

## SYSTEM SETTINGS

GET    /systemsettings
→ View global system config (auto-assign, survey cycles, etc.)

PUT    /systemsettings
→ Update global platform settings

---

## ACTIVITY LOGS

GET    /activitylogs
→ View all system actions (filter by user, date, action type)

---

## EVALUATIONS

GET    /evaluations
→ View all evaluations

POST   /evaluations
→ Manually trigger/create evaluation

PUT    /evaluations/:id
→ Edit evaluation

---

## FEEDBACK & SURVEYS

GET    /feedback
→ List all feedback (filterable by department/user/type)

GET    /surveys
→ List active, scheduled, and completed surveys

POST   /surveys
→ Create new survey

PUT    /surveys/:id
→ Update survey content/schedule

---

## REPORTING & ANALYTICS

GET    /reports
→ List predefined reports

POST   /reports/run
→ Generate on-demand report

GET    /analytics/overview
→ View summarized metrics: onboarding rate, feedback rate, performance

---

## NOTIFICATIONS

GET    /notifications
→ List all global/system notifications

POST   /notifications
→ Send system-wide or role-targeted notification

PUT    /notificationtemplates/:id
→ Update predefined templates

---

These endpoints support full functionality for your admin panel to manage users, teams, programs, feedback cycles, analytics, and platform-wide settings.
