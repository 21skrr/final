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
