# PMI Onboarding Checklist API Postman Tests

This document contains API endpoints organized by user role to facilitate testing with different authentication tokens.

## Authentication

### Login to get token

```
POST http://localhost:5000/api/auth/login
```

Headers:

```
Content-Type: application/json
```

#### Login as HR

Body:

```json
{
  "email": "hr@pmi.com",
  "password": "password"
}
```

#### Login as Supervisor

Body:

```json
{
  "email": "supervisor@pmi.com",
  "password": "password"
}
```

#### Login as Manager

Body:

```json
{
  "email": "manager@pmi.com",
  "password": "password"
}
```

#### Login as Employee

Body:

```json
{
  "email": "employee@pmi.com",
  "password": "password"
}
```

## HR Role Endpoints

### List all checklist templates

```
GET http://localhost:5000/api/checklists
```

Headers:

```
Authorization: Bearer {{hr_token}}
```

### Create a new checklist template

```
POST http://localhost:5000/api/checklists
```

Headers:

```
Authorization: Bearer {{hr_token}}
Content-Type: application/json
```

Body:

```json
{
  "title": "Onboarding Documentation",
  "description": "Initial HR tasks for new employees",
  "programType": "all",
  "stage": "prepare",
  "autoAssign": false,
  "requiresVerification": true
}
```

### Get details of a specific checklist

```
GET http://localhost:5000/api/checklists/71bf4554-35c9-11f0-97fc-f875a44d165a
```

Headers:

```
Authorization: Bearer {{hr_token}}
```

### Update a checklist template

```
PUT http://localhost:5000/api/checklists/71bf4554-35c9-11f0-97fc-f875a44d165a
```

Headers:

```
Authorization: Bearer {{hr_token}}
Content-Type: application/json
```

Body:

```json
{
  "title": "Updated Onboarding Documentation",
  "description": "Updated initial HR tasks for new employees",
  "autoAssign": true
}
```

### Delete a checklist template

```
DELETE http://localhost:5000/api/checklists/{{checklistId}}
```

Headers:

```
Authorization: Bearer {{hr_token}}
```

### Add auto-assignment rules to a checklist

```
POST http://localhost:5000/api/checklists/71bf4554-35c9-11f0-97fc-f875a44d165a/auto-assign-rules
```

Headers:

```
Authorization: Bearer {{hr_token}}
Content-Type: application/json
```

Body:

```json
{
  "programTypes": ["inkompass", "earlyTalent"],
  "departments": ["Marketing", "HR"],
  "dueInDays": 14,
  "stages": ["prepare"],
  "autoNotify": true
}
```

### Add a task to a checklist

```
POST http://localhost:5000/api/checklists/1c1678d4-2788-405f-8900-81c2c1adb301/items
```

Headers:

```
Authorization: Bearer {{hr_token}}
Content-Type: application/json
```

Body:

```json
{
  "title": "Submit ID documents",
  "description": "Upload a scanned copy of your ID",
  "isRequired": true,
  "orderIndex": 10,
  "controlledBy": "hr",
  "phase": "prepare"
}
```

### Update a checklist item

```
PUT http://localhost:5000/api/checklists/items/1c1678d4-2788-405f-8900-81c2c1adb301?checklistId=08144838-5dab-4f6c-83b5-6be09d35f735
```

Headers:

```
Authorization: Bearer {{hr_token}}
Content-Type: application/json
```

Body:

```json
{
  "title": "Updated: Submit ID documents",
  "description": "Upload a clear scanned copy of your government-issued ID",
  "isRequired": true,
  "orderIndex": 5,
  "controlledBy": "hr",
  "phase": "prepare"
}
```

### Delete a checklist item------------------------------------------ HNA

```id normal
DELETE http://localhost:5000/api/checklist-items/{{itemId}}
```

Headers:

```
Authorization: Bearer {{hr_token}}
```

### Assign checklist to a user

```
POST http://localhost:5000/api/checklist-assignments
```

Headers:

```
Authorization: Bearer {{hr_token}}
Content-Type: application/json
```

Body:

```json
{
  "userId": "3438d7b0-d4dc-45e8-a352-f51b1afd83e9",
  "checklistId": "71bf4554-35c9-11f0-97fc-f875a44d165a",
  "dueDate": "2025-06-20T00:00:00.000Z",
  "assignedBy": "e8509ac3-d82b-4c42-a647-c3094dc2c6ea",
  "isAutoAssigned": false
}
```

### Bulk assign checklists to multiple users

```
POST http://localhost:5000/api/checklist-assignments/bulk
```

Headers:

```
Authorization: Bearer {{hr_token}}
Content-Type: application/json
```

Body:

```json
{
  "checklistId": "71bf4554-35c9-11f0-97fc-f875a44d165a",
  "userIds": [
    "3438d7b0-d4dc-45e8-a352-f51b1afd83e9",
    "0ed16833-0684-4073-8246-6d2d9d4cc633",
    "ff0b0a7d-fe91-49ce-9d26-a930e5d5c2a2"
  ],
  "dueDate": "2025-06-20T00:00:00.000Z",
  "assignedBy": "e8509ac3-d82b-4c42-a647-c3094dc2c6ea",
  "isAutoAssigned": false
}
```

### Get all checklists assigned to a specific user

```
GET http://localhost:5000/api/checklist-assignments/user/3438d7b0-d4dc-45e8-a352-f51b1afd83e9
```

Headers:

```
Authorization: Bearer {{hr_token}}
```

### Send notification to user about checklist update

```
POST http://localhost:5000/api/notifications
```

Headers:

```
Authorization: Bearer {{hr_token}}
Content-Type: application/json
```

Body:

```json
{
  "userId": "3438d7b0-d4dc-45e8-a352-f51b1afd83e9",
  "title": "Checklist Updated",
  "message": "You have new tasks in your onboarding checklist",
  "type": "system"
}
```

### View feedback history for a specific user

```
GET http://localhost:5000/api/feedback?userId=3438d7b0-d4dc-45e8-a352-f51b1afd83e9
```

Headers:

```
Authorization: Bearer {{hr_token}}
```

## Manager Role Endpoints

### Get department's assigned checklists

```
GET http://localhost:5000/api/checklist-assignments/department/Marketing
```

Headers:

```
Authorization: Bearer {{manager_token}}
```

### Get strategic checklist progress by stage

```
GET http://localhost:5000/api/reports/checklists/by-stage
```

Headers:

```
Authorization: Bearer {{manager_token}}
```

Query parameters:

```
department=Marketing
startDate=2025-01-01
endDate=2025-06-30
programType=all
```

1. Get All Assignments for a User

http://localhost:5000/api/checklist-assignments/user/0ed16833-0684-4073-8246-6d2d9d4cc633

### Get checklist items with their status

```
GET http://localhost:5000/api/checklist-assignments/7fcf6b04-da8c-4ff9-a6b3-945292643001/items
```

Headers:

```
Authorization: Bearer {{manager_token}}
```

### Get % completion of checklist

```
GET http://localhost:5000/api/checklist-assignments/7fcf6b04-da8c-4ff9-a6b3-945292643001/progress
```

Headers:

```
Authorization: Bearer {{manager_token}}
```

## Supervisor Role Endpoints

### Get team's assigned checklists

```
GET http://localhost:5000/api/checklist-assignments/team/teamid
```

Headers:

```
Authorization: Bearer {{supervisor_token}}
```

### Verify checklist task completion

```
PATCH http://localhost:5000/api/checklist-assignments/checklist-progress/22222222-2222-2222-2222-222222222222/verify
```

Headers:

```
Authorization: Bearer {{supervisor_token}}
Content-Type: application/json
```

Body:

```json
{
  "userId": "3438d7b0-d4dc-45e8-a352-f51b1afd83e9",
  "verificationStatus": "approved",
  "verificationNotes": "Verified and approved ID documents",
  "verifiedBy": "f3d204a0-8cac-44fe-99b8-7ed7006eabc3"
}
```

### Get checklist items with their status

```
GET http://localhost:5000/api/checklist-assignments/7fcf6b04-da8c-4ff9-a6b3-945292643001/items
```

Headers:

```
Authorization: Bearer {{supervisor_token}}
```

### Get % completion of checklist

```
GET http://localhost:5000/api/checklist-assignments/7fcf6b04-da8c-4ff9-a6b3-945292643001/progress
```

Headers:

```
Authorization: Bearer {{supervisor_token}}
```

## Employee Role Endpoints

### Get my assigned checklists

```
GET http://localhost:5000/api/checklist-assignments/my
```

Headers:

```
Authorization: Bearer {{employee_token}}
```

### Mark checklist task as complete/incomplete

```
PATCH http://localhost:5000/api/checklist-progress/71c0acca-35c9-11f0-97fc-f875a44d165a
```

ATCH http://localhost:5000/api/checklist-assignments/checklist-progress/71c0cacca-35c9-11f0-97fc-f875a44d165a
PATCH /api/checklist-assignments/checklist-progress/:progressId

Headers:

```
Authorization: Bearer {{employee_token}}
Content-Type: application/json
```

Body:

```json
{
  "userId": "3438d7b0-d4dc-45e8-a352-f51b1afd83e9",
  "isCompleted": true,
  "notes": "Submitted during onboarding session",
  "completedAt": "2025-05-22T12:00:00.000Z"
}
```

### Get % completion of checklist

```
GET http://localhost:5000/api/checklist-assignments/7fcf6b04-da8c-4ff9-a6b3-945292643001/progress
```

Headers:

```
Authorization: Bearer {{employee_token}}
```

### Get checklist items with their status

```
GET http://localhost:5000/api/checklist-assignments/7fcf6b04-da8c-4ff9-a6b3-945292643001/items
```

Headers:

```
Authorization: Bearer {{employee_token}}
```

## Environment Variables Setup

In Postman, set up these environment variables:

1. `hr_token`: (JWT token from HR login)
2. `manager_token`: (JWT token from Manager login)
3. `supervisor_token`: (JWT token from Supervisor login)
4. `employee_token`: (JWT token from Employee login)

## Testing Tips

1. First run the login endpoint to get the appropriate token for each role
2. Store each token in its respective Postman environment variable
3. When testing, use the token that matches the role needed for the endpoint
4. Some endpoints may be accessible by multiple roles with different permissions

## Implementation Considerations

### Role-Based Access Control

- Implement middleware that checks the user's role before allowing access to endpoints
- Example: `checkRole("hr", "manager")` middleware for HR/Manager-only endpoints
- Use the user's token to determine their role, team, and department

### Database Relations

- These endpoints match your database schema (`checklists`, `checklistitems`, `checklistassignments`, etc.)
- All UUIDs used in examples match real records in your database
- Ensure proper foreign key constraints as already implemented in your database

For all endpoints requiring authentication, make sure to include the Authorization header with the Bearer token.
