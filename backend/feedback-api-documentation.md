# 📬 Feedback API Endpoint Responsibilities

This document outlines all Feedback API endpoints, their responsibilities, and who should use them.

---

## 👤 EMPLOYEE ENDPOINTS

### POST /api/feedback
**Who uses it?** Employee  
**Usage:** Submit feedback related to onboarding, training, support, etc. Can choose to remain anonymous or share with supervisor.  
**Purpose:** Express concerns, suggestions, or praise to HR/supervisors.

**Request Body:**
```json
{
  "content": "string",
  "type": "onboarding|training|support|general",
  "isAnonymous": boolean,
  "shareWithSupervisor": boolean
}
```

---

### GET /api/feedback/history
**Who uses it?** Employee  
**Usage:** View previously submitted feedback and their statuses.  
**Purpose:** Track what feedback they've submitted and whether it has been addressed.

---

## 🧑‍🏫 SUPERVISOR ENDPOINTS

### GET /api/team/feedback
**Who uses it?** Supervisor  
**Usage:** Retrieve feedback submitted by team members that is shared with them.  
**Purpose:** Monitor team sentiment and proactively respond to feedback.

---

### POST /api/feedback/:feedbackId/response
**Who uses it?** Supervisor  
**Usage:** Reply to feedback with a formal response and mark the status as "addressed", "pending", or "in-progress".  
**Purpose:** Close the feedback loop and show acknowledgment of team input.

**Request Body:**
```json
{
  "response": "string",
  "status": "addressed|pending|in-progress"
}
```

---

## 👔 MANAGER ENDPOINTS

### GET /api/feedback/department
**Who uses it?** Manager  
**Usage:** Access all feedback within their department with optional filters.  
**Purpose:** Identify systemic issues, performance trends, or improvement opportunities.

**Query Parameters:**
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date  
- `category` (optional): Filter by feedback type

---

### GET /api/feedback/analytics
**Who uses it?** Manager  
**Usage:** View graphical and statistical insights across feedback categories and timelines.  
**Purpose:** Discover trends in employee experience or training effectiveness.

---

## 👩‍💼 HR ENDPOINTS

### GET /api/feedback/all
**Who uses it?** HR  
**Usage:** Access all feedback from all users with support for filters (e.g., by type, date, status).  
**Purpose:** Perform centralized feedback analysis and quality monitoring.

---

### PUT /api/feedback/:feedbackId/categorize
**Who uses it?** HR  
**Usage:** Categorize feedback into relevant tags like "training", "supervisor", "process". Also assign a priority and status.  
**Purpose:** Organize and prioritize feedback handling efficiently.

**Request Body:**
```json
{
  "categories": ["training", "supervisor", "process"],
  "priority": "low|medium|high",
  "status": "pending|in-progress|addressed"
}
```

---

### POST /api/feedback/:feedbackId/escalate
**Who uses it?** HR  
**Usage:** Escalate critical feedback to managers or other parties for resolution.  
**Purpose:** Ensure urgent or unresolved feedback gets immediate visibility and action.

**Request Body:**
```json
{
  "escalateTo": "manager|hr",
  "reason": "string",
  "notifyParties": ["supervisor", "hr"]
}
```

---

### GET /api/feedback/export
**Who uses it?** HR  
**Usage:** Export feedback data in CSV or other formats, with optional filters.  
**Purpose:** Archive, analyze, or report feedback externally (e.g., for compliance or executive review).

**Query Parameters:**
- `format` (optional): "csv" | "excel" | "pdf" | "json"
- `dateRange` (optional): "daily" | "weekly" | "monthly" | "yearly"
- `category` (optional): "all" | "onboarding" | "training" | "support" | "general"

---

## 🔧 ADDITIONAL ENDPOINTS

### GET /api/feedback/sent
**Who uses it?** All users  
**Usage:** View feedback sent by the current user.

### GET /api/feedback/received  
**Who uses it?** All users  
**Usage:** View feedback received by the current user.

### GET /api/feedback/user/:userId
**Who uses it?** All users  
**Usage:** View feedback for a specific user.

### PUT /api/feedback/:feedbackId/edit
**Who uses it?** Employee  
**Usage:** Edit own feedback before it's responded to.

### DELETE /api/feedback/:id
**Who uses it?** Employee  
**Usage:** Delete own feedback.

### POST /api/feedback/:feedbackId/notes
**Who uses it?** Supervisor, HR  
**Usage:** Add notes to feedback.

### POST /api/feedback/:feedbackId/followup
**Who uses it?** Supervisor, HR  
**Usage:** Schedule follow-up for feedback.

---

## 🔐 AUTHENTICATION & AUTHORIZATION

All endpoints require authentication via JWT token. Role-based access control is enforced:

- **Employee**: Can submit feedback, view history, edit/delete own feedback
- **Supervisor**: Can view team feedback shared with them, respond to feedback
- **Manager**: Can view department feedback and analytics
- **HR**: Can view all feedback, categorize, escalate, and export

---

## 📊 FEEDBACK STATUS FLOW

1. **Pending** - Initial state when feedback is submitted
2. **In-Progress** - Being worked on by supervisor/HR
3. **Addressed** - Feedback has been responded to and resolved

---

## 🏷️ FEEDBACK CATEGORIES

- **Training** - Related to learning and development
- **Supervisor** - Related to management and leadership
- **Process** - Related to workflows and procedures

---

## 📈 FEEDBACK TYPES

- **Onboarding** - New employee experience
- **Training** - Learning and development
- **Support** - Technical or operational support
- **General** - Other feedback

---

## 🔄 FEEDBACK PRIORITIES

- **Low** - Minor issues or suggestions
- **Medium** - Important but not urgent
- **High** - Critical issues requiring immediate attention 