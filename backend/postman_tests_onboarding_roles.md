# Postman Test Suite: Role-Based Onboarding Permissions

## Setup Instructions

1. Import this collection into Postman
2. Set up environment variables:
   - `baseUrl`: Your API base URL (e.g., http://localhost:5000)
   - `employeeToken`: Token for employee@pmi.com
   - `supervisorToken`: Token for supervisor@pmi.com
   - `managerToken`: Token for manager@pmi.com
   - `hrToken`: Token for hr@pmi.com
   - `testUserId`: A test user ID for testing permissions

## Authentication Tests

### 1. Login Tests

**POST {{baseUrl}}/api/auth/login - Employee Login**
```json
{
  "email": "employee@pmi.com",
  "password": "password"
}
```

**POST {{baseUrl}}/api/auth/login - Supervisor Login**
```json
{
  "email": "supervisor@pmi.com",
  "password": "password"
}
```

**POST {{baseUrl}}/api/auth/login - Manager Login**
```json
{
  "email": "manager@pmi.com",
  "password": "password"
}
```

**POST {{baseUrl}}/api/auth/login - HR Login**
```json
{
  "email": "hr@pmi.com",
  "password": "password"
}
```

## Employee Permission Tests

### 2. Employee Read-Only Access

**GET {{baseUrl}}/api/onboarding/progress/me**
Headers: `Authorization: Bearer {{employeeToken}}`
Expected: 200 OK - Employee can view their own progress

**GET {{baseUrl}}/api/onboarding/phase/prepare/tasks**
Headers: `Authorization: Bearer {{employeeToken}}`
Expected: 200 OK - Employee can view phase-specific tasks

**GET {{baseUrl}}/api/onboarding/progress/detailed**
Headers: `Authorization: Bearer {{employeeToken}}`
Expected: 200 OK - Employee can view detailed progress

### 3. Employee Write Access Denied

**PUT {{baseUrl}}/api/onboarding/tasks/{{taskId}}/status**
Headers: `Authorization: Bearer {{employeeToken}}`
Body:
```json
{
  "completed": true
}
```
Expected: 403 Forbidden - Employee cannot edit tasks

**PUT {{baseUrl}}/api/onboarding/tasks/{{taskId}}/complete**
Headers: `Authorization: Bearer {{employeeToken}}`
Body:
```json
{
  "completed": true
}
```
Expected: 403 Forbidden - Employee cannot complete tasks

**PUT {{baseUrl}}/api/onboarding/progress/{{testUserId}}/advance**
Headers: `Authorization: Bearer {{employeeToken}}`
Expected: 403 Forbidden - Employee cannot advance phases

## Supervisor Permission Tests

### 4. Supervisor Direct Report Access

**GET {{baseUrl}}/api/onboarding/progress/{{testUserId}}**
Headers: `Authorization: Bearer {{supervisorToken}}`
Expected: 200 OK - Supervisor can view direct report's progress

**PUT {{baseUrl}}/api/onboarding/progress/{{testUserId}}**
Headers: `Authorization: Bearer {{supervisorToken}}`
Body:
```json
{
  "stage": "orient",
  "progress": 50
}
```
Expected: 200 OK - Supervisor can update direct report's progress

**PUT {{baseUrl}}/api/onboarding/tasks/{{taskId}}/status**
Headers: `Authorization: Bearer {{supervisorToken}}`
Body:
```json
{
  "completed": true
}
```
Expected: 200 OK - Supervisor can edit direct report's tasks

**PUT {{baseUrl}}/api/onboarding/progress/{{testUserId}}/advance**
Headers: `Authorization: Bearer {{supervisorToken}}`
Expected: 200 OK - Supervisor can advance direct report's phase

### 5. Supervisor Cross-Department Access Denied

**GET {{baseUrl}}/api/onboarding/progress/{{otherDeptUserId}}**
Headers: `Authorization: Bearer {{supervisorToken}}`
Expected: 403 Forbidden - Supervisor cannot view other department users

**PUT {{baseUrl}}/api/onboarding/progress/{{otherDeptUserId}}**
Headers: `Authorization: Bearer {{supervisorToken}}`
Body:
```json
{
  "stage": "orient"
}
```
Expected: 403 Forbidden - Supervisor cannot update other department users

### 6. Supervisor HR-Only Actions Denied

**PUT {{baseUrl}}/api/onboarding/tasks/{{taskId}}/validate**
Headers: `Authorization: Bearer {{supervisorToken}}`
Expected: 403 Forbidden - Only HR can validate tasks

**GET {{baseUrl}}/api/onboarding/progress**
Headers: `Authorization: Bearer {{supervisorToken}}`
Expected: 403 Forbidden - Only HR can view all progresses

## Manager Permission Tests

### 7. Manager Read-Only Access

**GET {{baseUrl}}/api/onboarding/progress/{{testUserId}}/manager**
Headers: `Authorization: Bearer {{managerToken}}`
Expected: 200 OK - Manager can view department member's progress (read-only)

**GET {{baseUrl}}/api/onboarding/progress/{{otherDeptUserId}}/manager**
Headers: `Authorization: Bearer {{managerToken}}`
Expected: 403 Forbidden - Manager cannot view other department users

### 8. Manager Write Access Denied

**PUT {{baseUrl}}/api/onboarding/progress/{{testUserId}}/manager**
Headers: `Authorization: Bearer {{managerToken}}`
Body:
```json
{
  "stage": "orient"
}
```
Expected: 403 Forbidden - Managers have read-only access

**PUT {{baseUrl}}/api/onboarding/tasks/{{taskId}}/status**
Headers: `Authorization: Bearer {{managerToken}}`
Body:
```json
{
  "completed": true
}
```
Expected: 403 Forbidden - Managers cannot edit tasks

## HR Permission Tests

### 9. HR Full Access

**GET {{baseUrl}}/api/onboarding/progress**
Headers: `Authorization: Bearer {{hrToken}}`
Expected: 200 OK - HR can view all progresses

**GET {{baseUrl}}/api/onboarding/progress/{{testUserId}}/hr**
Headers: `Authorization: Bearer {{hrToken}}`
Expected: 200 OK - HR can view any user's progress

**PUT {{baseUrl}}/api/onboarding/progress/{{testUserId}}/hr**
Headers: `Authorization: Bearer {{hrToken}}`
Body:
```json
{
  "stage": "orient",
  "progress": 75
}
```
Expected: 200 OK - HR can update any user's progress

**PUT {{baseUrl}}/api/onboarding/tasks/{{taskId}}/validate**
Headers: `Authorization: Bearer {{hrToken}}`
Expected: 200 OK - HR can validate tasks

**POST {{baseUrl}}/api/onboarding/assign**
Headers: `Authorization: Bearer {{hrToken}}`
Body:
```json
{
  "userId": "{{testUserId}}",
  "checklistIds": ["checklist1", "checklist2"]
}
```
Expected: 200 OK - HR can assign checklists

**POST {{baseUrl}}/api/onboarding/{{testUserId}}/reset**
Headers: `Authorization: Bearer {{hrToken}}`
Body:
```json
{
  "resetToStage": "prepare"
}
```
Expected: 200 OK - HR can reset journeys

**DELETE {{baseUrl}}/api/onboarding/{{testUserId}}**
Headers: `Authorization: Bearer {{hrToken}}`
Expected: 200 OK - HR can delete user progress

**GET {{baseUrl}}/api/onboarding/export/csv**
Headers: `Authorization: Bearer {{hrToken}}`
Expected: 200 OK - HR can export data

**POST {{baseUrl}}/api/onboarding/create**
Headers: `Authorization: Bearer {{hrToken}}`
Body:
```json
{
  "userId": "{{testUserId}}",
  "templateId": "template1"
}
```
Expected: 200 OK - HR can create journeys

**GET {{baseUrl}}/api/onboarding/tasks/default**
Headers: `Authorization: Bearer {{hrToken}}`
Expected: 200 OK - HR can access default tasks

## Template Management Tests (HR Only)

### 10. Onboarding Template Tests

**GET {{baseUrl}}/api/onboarding-templates**
Headers: `Authorization: Bearer {{hrToken}}`
Expected: 200 OK - HR can view templates

**POST {{baseUrl}}/api/onboarding-templates**
Headers: `Authorization: Bearer {{hrToken}}`
Body:
```json
{
  "name": "Test Template",
  "description": "Test template description",
  "programType": "inkompass",
  "stages": [
    {
      "name": "prepare",
      "description": "Preparation stage",
      "duration": 7,
      "tasks": [
        {
          "title": "Complete paperwork",
          "description": "Submit required documents",
          "dueDate": "2024-01-15",
          "priority": "high"
        }
      ]
    }
  ]
}
```
Expected: 201 Created - HR can create templates

**POST {{baseUrl}}/api/onboarding-templates/apply**
Headers: `Authorization: Bearer {{hrToken}}`
Body:
```json
{
  "templateId": "{{templateId}}",
  "userId": "{{testUserId}}"
}
```
Expected: 200 OK - HR can apply templates

## Cross-Role Access Tests

### 11. Unauthorized Access Tests

**GET {{baseUrl}}/api/onboarding/progress/{{testUserId}}**
Headers: `Authorization: Bearer {{employeeToken}}`
Expected: 403 Forbidden - Employee cannot view other users

**PUT {{baseUrl}}/api/onboarding/tasks/{{taskId}}/validate**
Headers: `Authorization: Bearer {{supervisorToken}}`
Expected: 403 Forbidden - Only HR can validate

**GET {{baseUrl}}/api/onboarding/progress**
Headers: `Authorization: Bearer {{managerToken}}`
Expected: 403 Forbidden - Only HR can view all progresses

## Test Scripts

### Pre-request Script (for each test)
```javascript
// Set up test data
pm.environment.set("testUserId", "test-user-id");
pm.environment.set("taskId", "test-task-id");
```

### Test Script (for each test)
```javascript
// Verify response status
pm.test("Status code is correct", function () {
    pm.response.to.have.status(200); // or expected status
});

// Verify response structure
pm.test("Response has correct structure", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('data');
});

// Verify permissions
pm.test("User has correct permissions", function () {
    const response = pm.response.json();
    if (pm.environment.get("userRole") === "employee") {
        pm.expect(response.canEdit).to.be.false;
        pm.expect(response.canAdvance).to.be.false;
        pm.expect(response.canValidate).to.be.false;
    }
});
```

## Environment Variables

```json
{
  "baseUrl": "http://localhost:5000",
  "employeeToken": "",
  "supervisorToken": "",
  "managerToken": "",
  "hrToken": "",
  "testUserId": "",
  "taskId": "",
  "templateId": "",
  "otherDeptUserId": ""
}
```

## Test Execution Order

1. Run authentication tests to get tokens
2. Run employee permission tests
3. Run supervisor permission tests
4. Run manager permission tests
5. Run HR permission tests
6. Run template management tests
7. Run cross-role access tests

## Expected Results Summary

| Role | Read Own | Read Others | Edit Tasks | Advance Phases | Validate Tasks | Full Access |
|------|----------|-------------|------------|----------------|----------------|-------------|
| Employee | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Supervisor | ✅ | ✅ (Direct Reports) | ✅ (Direct Reports) | ✅ (Direct Reports) | ❌ | ❌ |
| Manager | ✅ | ✅ (Department) | ❌ | ❌ | ❌ | ❌ |
| HR | ✅ | ✅ (All) | ✅ (All) | ✅ (All) | ✅ | ✅ |

This test suite ensures that all role-based permissions are properly enforced across the onboarding system. 