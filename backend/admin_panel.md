ADMIN PANEL – Endpoints Overview

## USER MANAGEMENT

GET    /users
→ List all users

POST   /users
→ Create a new user

PUT    /users/:id
→ Update user details (name, email, role, supervisorId, teamId)

DELETE /users/:id
→ Delete or deactivate a user

---

## TEAM MANAGEMENT

GET    /teams
→ View all teams

POST   /teams
→ Create a team

PUT    /teams/:id
→ Update team details or assign members

---

## ROLE & PERMISSION CONTROL

GET    /roles
→ List all roles and their permissions

POST   /roles
→ Create a new role

PUT    /roles/:id
→ Modify permissions or role metadata

DELETE /roles/:id
→ Remove role (if not system-critical)

---

## SYSTEM CONFIGURATION

GET    /systemsettings
→ View all global settings (onboarding logic, survey timing, feedback policies)

PUT    /systemsettings
→ Update or toggle automation features, defaults, alert settings

---

## REPORT & AUDIT ACCESS

GET    /activitylogs
→ View user action logs (searchable by user/date/entity)

GET    /reports
→ Access and run pre-configured reports or templates

GET    /reports/:id/export
→ Export report (PDF/Excel)

---

## NOTIFICATION MANAGEMENT

GET    /notifications
→ View all platform-generated notifications (filterable by user/type/date)

POST   /notifications
→ Send a manual broadcast/alert

PUT    /notificationtemplates/:id
→ Update predefined templates for onboarding, reminders, evaluations

---

These endpoints support the full admin panel functionality for managing users, teams, roles, system logic, and platform settings.
ADMIN PANEL – Core Endpoints
============================

## USER MANAGEMENT

GET    /users
→ List all users with filtering (by role, department, status)

POST   /users
→ Create a new user (employee, supervisor, HR, manager)

GET    /users/:id
→ Get detailed user profile

PUT    /users/:id
→ Update user data (name, email, role, supervisorId, teamId, etc.)

DELETE /users/:id
→ Deactivate or delete user

PATCH  /users/:id/status
→ Change user status (active, archived, probation, etc.)

---

## ROLE & PERMISSION MANAGEMENT

GET    /roles
→ List all roles and their permissions

POST   /roles
→ Create a new role

PUT    /roles/:id
→ Update existing role (permissions, name)

DELETE /roles/:id
→ Delete a role (if not protected)

---

## TEAM MANAGEMENT

GET    /teams
→ View list of all teams

POST   /teams
→ Create a new team

PUT    /teams/:id
→ Update team name, department, or members

DELETE /teams/:id
→ Delete a team (optional)

---

## PROGRAMS & STRUCTURE

GET    /programs
→ List all onboarding/training programs

POST   /programs
→ Create a new program

PUT    /programs/:id
→ Edit program details

DELETE /programs/:id
→ Remove program

---

## SYSTEM SETTINGS

GET    /systemsettings
→ View global system config (auto-assign, survey cycles, etc.)

PUT    /systemsettings
→ Update global platform settings

---

## ACTIVITY LOGS

GET    /activitylogs
→ View all system actions (filter by user, date, action type)

---

## EVALUATIONS

GET    /evaluations
→ View all evaluations

POST   /evaluations
→ Manually trigger/create evaluation

PUT    /evaluations/:id
→ Edit evaluation

---

## FEEDBACK & SURVEYS

GET    /feedback
→ List all feedback (filterable by department/user/type)

GET    /surveys
→ List active, scheduled, and completed surveys

POST   /surveys
→ Create new survey

PUT    /surveys/:id
→ Update survey content/schedule

---

## REPORTING & ANALYTICS

GET    /reports
→ List predefined reports

POST   /reports/run
→ Generate on-demand report

GET    /analytics/overview
→ View summarized metrics: onboarding rate, feedback rate, performance

---

## NOTIFICATIONS

GET    /notifications
→ List all global/system notifications

POST   /notifications
→ Send system-wide or role-targeted notification

PUT    /notificationtemplates/:id
→ Update predefined templates

---

These endpoints support full functionality for your admin panel to manage users, teams, programs, feedback cycles, analytics, and platform-wide settings.
