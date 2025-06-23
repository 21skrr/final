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
