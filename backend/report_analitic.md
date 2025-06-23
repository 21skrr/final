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