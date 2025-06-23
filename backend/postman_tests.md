# Postman Test Data for Onboarding API Endpoints

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

## EMPLOYEE ENDPOINTS

### View Onboarding Journey & Tasks

**GET {{baseUrl}}/api/onboarding/journey**

Headers:

```
Authorization: Bearer {{token}}
```

### Mark Task as Completed

**PUT {{baseUrl}}/api/onboarding/tasks/:taskId/progress**

Replace `:taskId` with a valid task ID (e.g., `0f57d230-523a-4b52-8f84-57f2402eece6`)

Headers:

```
Authorization: Bearer {{token}}
```

Body:

```json
{
  "isCompleted": true,
  "notes": "I have completed this task and wanted to share some feedback"
}
```

### View Notifications

**GET {{baseUrl}}/api/notifications**

Headers:

```
Authorization: Bearer {{token}}
```

## SUPERVISOR ENDPOINTS

### View Team Members' Progress

**GET {{baseUrl}}/api/supervisor/team/onboarding**

Headers:

```
Authorization: Bearer {{token}}
```

### View Specific Employee Journey

**GET {{baseUrl}}/api/onboarding/journey/:userId**

Replace `:userId` with a valid user ID (e.g., `3438d7b0-d4dc-45e8-a352-f51b1afd83e9`)

Headers:

```
Authorization: Bearer {{token}}
```

### Add Notes to Tasks

**PUT {{baseUrl}}/api/onboarding/tasks/:taskId/notes**

Replace `:taskId` with a valid task ID (e.g., `0f57d230-523a-4b52-8f84-57f2402eece6`)

Headers:

```
Authorization: Bearer {{token}}
```

Body:

```json
{
  "supervisorNotes": "Good progress on this task. Make sure to also consider the additional requirements we discussed."
}
```

### Review Dashboard

**GET {{baseUrl}}/api/supervisor/dashboard/onboarding**

Headers:

```
Authorization: Bearer {{token}}
```

## HR ENDPOINTS

### View All Employees' Progress

**GET {{baseUrl}}/api/onboarding/progresses**

Headers:

```
Authorization: Bearer {{token}}
```

### Assign Checklist to Employee

**POST {{baseUrl}}/api/onboarding/checklists/assign**

Headers:

```
Authorization: Bearer {{token}}
```

Body:

```json
{
  "userId": "3438d7b0-d4dc-45e8-a352-f51b1afd83e9",
  "checklistIds": ["71bf4554-35c9-11f0-97fc-f875a44d165a"]
}
```

### Edit Onboarding Progress

**PUT {{baseUrl}}/api/onboarding/journey/:userId**

Replace `:userId` with a valid user ID (e.g., `3438d7b0-d4dc-45e8-a352-f51b1afd83e9`)

Headers:

```
Authorization: Bearer {{token}}
```

Body:

```json
{
  "stage": "land",
  "progress": 50,
  "resetTasks": false
}
```

### Reset Employee Progress

**POST {{baseUrl}}/api/onboarding/journey/:userId/reset**

Replace `:userId` with a valid user ID (e.g., `3438d7b0-d4dc-45e8-a352-f51b1afd83e9`)

Headers:

```
Authorization: Bearer {{token}}
```

Body:

```json
{
  "resetToStage": "prepare",
  "keepCompletedTasks": false
}
```

### Generate Reports

**GET {{baseUrl}}/api/reports/onboarding**

Headers:

```
Authorization: Bearer {{token}}
```

Query params (optional):

```
department=Marketing
role=employee
startDate=2025-01-01
endDate=2025-05-21
```

### Configure Notifications

**PUT {{baseUrl}}/api/settings/notifications/onboarding**

Headers:

```
Authorization: Bearer {{token}}
```

Body:

```json
{
  "settings": {
    "onTaskCompletion": true,
    "onStageChange": true,
    "onChecklistAssignment": true,
    "reminderFrequency": "weekly"
  }
}
```

## SHARED FUNCTIONALITY ENDPOINTS

### Create Task

**POST {{baseUrl}}/api/onboarding/tasks**------------------

Headers:

```
Authorization: Bearer {{token}}
```

Body:

```json
{
  "title": "Complete compliance training",
  "description": "Complete all required compliance training modules",
  "dueDate": "2025-06-15T00:00:00.000Z",
  "priority": "high",
  "onboardingStage": "orient",
  "controlledBy": "hr",
  "userId": "3438d7b0-d4dc-45e8-a352-f51b1afd83e9"
}
```

### Update Task

**PUT {{baseUrl}}/api/onboarding/tasks/:taskId**

Replace `:taskId` with a valid task ID (e.g., `0f57d230-523a-4b52-8f84-57f2402eece6`)

Headers:

```
Authorization: Bearer {{token}}
```

Body:

```json
{
  "title": "Updated task title",
  "description": "Updated task description",
  "dueDate": "2025-06-30T00:00:00.000Z",
  "priority": "medium",
  "onboardingStage": "orient", // <-- required, must be one of: prepare, orient, land, integrate, excel
  "controlledBy": "hr" // <-- required, must be one of: employee, supervisor, hr
}
```

### Delete Task

**DELETE {{baseUrl}}/api/onboarding/tasks/:taskId**

Replace `:taskId` with a valid task ID (e.g., `0f57d230-523a-4b52-8f84-57f2402eece6`)

Headers:

```
Authorization: Bearer {{token}}
```

### Get Notification Settings

**GET {{baseUrl}}/api/settings/notifications**

Headers:

```
Authorization: Bearer {{token}}
```

### Update Notification Settings

**PUT {{baseUrl}}/api/settings/notifications**

Headers:

```
Authorization: Bearer {{token}}
```

Body:

```json
{
  "emailNotifications": true,
  "pushNotifications": false,
  "frequency": "daily"
}
```
