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
