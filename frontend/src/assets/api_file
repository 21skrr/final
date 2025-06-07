# API Endpoints Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Role-Based Endpoints](#role-based-endpoints)
   - [HR & Admin](#hr--admin)
   - [Manager](#manager)
   - [Supervisor](#supervisor)
   - [Employee](#employee)
4. [Common Features](#common-features)
5. [Notes](#notes)

## Authentication

### Base Authentication
- `POST /api/auth/login`
  - Request: `{ email: string, password: string }`
  - Response: `{ token: string, user: { id, email, role, ... } }`
- `POST /api/auth/logout`
  - Response: `{ success: true }`
- `GET /api/auth/me`
  - Response: `{ id, email, role, ... }`

## User Management

### User Operations
- `GET /api/users` - List all users (HR/Admin only)
- `POST /api/users` - Create new user (HR/Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (HR only)
- `GET /api/users/me` - Get current user info
- `GET /api/users/team/members` - Get team members (Supervisor/Manager only)

### User Settings
- `GET /api/users/usersettings/me` - View personal settings
- `PUT /api/users/usersettings/me` - Update personal settings
- `GET /api/users/managers/me/preferences` - View manager preferences
- `PUT /api/users/managers/me/preferences` - Update manager preferences

## Role-Based Endpoints

### HR & Admin

#### System Settings
- `GET /api/systemsettings` - Get global system settings
- `PUT /api/systemsettings` - Update global system settings

#### Role Management
- `GET /api/roles` - List all roles and permissions
- `POST /api/roles` - Create new role
- `PUT /api/roles/:id` - Update role permissions
- `DELETE /api/roles/:id` - Delete role

#### Survey Management
- `GET /api/surveys` - Get all surveys
- `POST /api/surveys` - Create new survey
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey
- `POST /api/surveys/templates` - Create survey template
- `PUT /api/surveys/templates/:templateId` - Update survey template
- `POST /api/surveys/schedule` - Schedule survey
- `PUT /api/surveys/settings` - Update survey settings
- `GET /api/surveys/export` - Export survey results
- `GET /api/surveys/monitoring` - Monitor survey participation
- `GET /api/surveys/department/analytics` - Get department analytics
- `GET /api/surveys/department/insights` - Get department insights

#### Feedback Management
- `GET /api/feedback/all` - View all feedback
- `PUT /api/feedback/:feedbackId/categorize` - Categorize feedback
- `POST /api/feedback/:feedbackId/escalate` - Escalate feedback
- `GET /api/feedback/export` - Export feedback report

#### Analytics & Reports
- `GET /api/analytics/organization/dashboard` - Organization-wide dashboard
- `GET /api/analytics/organization/completion-rates` - Completion rates by department
- `GET /api/analytics/organization/feedback-participation` - Feedback participation metrics
- `GET /api/analytics/organization/survey-trends` - Survey response trends
- `GET /api/analytics/organization/training-completion` - Training completion metrics
- `GET /api/analytics/organization/evaluation-effectiveness` - Evaluation effectiveness
- `GET /api/analytics/organization/kpi` - HR KPI metrics

#### Report Management
- `GET /api/reports/templates` - Get report templates
- `POST /api/reports/templates` - Create report template
- `PUT /api/reports/templates/:id` - Update report template
- `DELETE /api/reports/templates/:id` - Delete report template
- `POST /api/reports/schedule` - Schedule report delivery
- `PUT /api/reports/schedule/:id` - Update report schedule
- `DELETE /api/reports/schedule/:id` - Delete report schedule

### Manager

#### Team Management
- `GET /api/users/team/members` - Get team members
- `GET /api/surveys/team/results` - Get team survey results
- `GET /api/surveys/team/completion-status` - Get team survey completion status
- `GET /api/surveys/monitoring` - Monitor survey participation
- `GET /api/surveys/export` - Export survey results
- `GET /api/surveys/department/analytics` - Get department analytics
- `GET /api/surveys/department/insights` - Get department insights

#### Analytics & Reports
- `GET /api/analytics/department/dashboard` - Department-wide dashboard
- `GET /api/analytics/department/onboarding-kpi` - Onboarding KPIs
- `GET /api/analytics/department/probation` - Probation milestone tracking
- `GET /api/analytics/department/evaluations` - Evaluation results comparison
- `GET /api/analytics/department/feedback` - Feedback trends
- `GET /api/reports/supervisor-activity` - Supervisor activity reports
- `GET /api/reports/onboarding-health` - Onboarding health metrics
- `POST /api/reports/schedule/department` - Schedule department reports
- `GET /api/reports/export/department` - Export department reports

### Supervisor

#### Team Management
- `GET /api/users/team/members` - Get team members
- `GET /api/surveys/team/results` - Get team survey results
- `GET /api/surveys/team/completion-status` - Get team survey completion status
- `GET /api/surveys/monitoring` - Monitor survey participation
- `GET /api/surveys/export` - Export survey results

#### Analytics & Reports
- `GET /api/analytics/team/dashboard` - Team-level analytics dashboard
- `GET /api/analytics/team/checklist-progress` - Checklist progress per employee
- `GET /api/analytics/team/training` - Training participation and completion
- `GET /api/analytics/team/feedback` - Feedback trends
- `GET /api/analytics/team/coaching` - Coaching session tracking
- `GET /api/reports/team/export` - Export team reports
- `GET /api/reports/team/bottlenecks` - Onboarding bottlenecks analysis
- `GET /api/reports/team/performance` - Team performance reports

### Employee

#### Personal Management
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `GET /api/users/me` - Get current user info
- `GET /api/users/usersettings/me` - View personal settings
- `PUT /api/users/usersettings/me` - Update personal settings

#### Survey Management
- `GET /api/surveys/available` - Get available surveys
- `GET /api/surveys/user` - Get user's surveys
- `GET /api/surveys/history` - Get survey history
- `GET /api/surveys/:id` - Get survey by ID

#### Analytics & Reports
- `GET /api/analytics/personal/dashboard` - Personal analytics dashboard
- `GET /api/analytics/personal/onboarding` - Personal onboarding analytics
- `GET /api/analytics/personal/checklist` - Checklist completion percentage
- `GET /api/analytics/personal/training` - Training progress
- `GET /api/analytics/personal/feedback` - Feedback history
- `GET /api/reports/personal/tasks` - Completed tasks report
- `GET /api/reports/personal/sessions` - Attended sessions report
- `GET /api/reports/personal/feedback` - Submitted feedback report
- `GET /api/reports/personal/performance` - Individual performance summary

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

## Notes
1. All endpoints are prefixed with `/api`
2. Role hierarchy: HR > Manager > Supervisor > Employee
3. Higher roles inherit access to lower role endpoints
4. All endpoints require authentication
5. Role-based access control is implemented
6. Data access is restricted based on role hierarchy
7. Audit logging for sensitive data access
8. Pagination implemented for large datasets
9. Caching implemented for frequently accessed reports
10. Real-time analytics available where applicable
11. Custom date ranges supported for all reports
