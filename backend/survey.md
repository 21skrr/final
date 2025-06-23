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
