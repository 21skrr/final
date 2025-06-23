SETTINGS – Endpoints by Role

## EMPLOYEE

GET    /usersettings/:userId
→ View personal settings (theme, notifications, visibility)
  
PUT    /usersettings/:userId
→ Update personal preferences
Request Body:
{
  theme: 'light' | 'dark' | 'system',
  emailNotifications: boolean,
  pushNotifications: boolean,
  profileVisibility: 'everyone' | 'team' | 'supervisors',
  compactMode: boolean
}

---

## SUPERVISOR

GET    /teams/settings
→ View team-specific preferences (report views, coaching alert thresholds)

PUT    /teams/settings
→ Update team-level settings
Request Body:
{
  reportFilters: { ... },
  coachingAlertsEnabled: boolean
}

---

## MANAGER

GET    /managers/:id/preferences
→ View manager-level settings and alert configurations

PUT    /managers/me/preferences
→ Update alert thresholds, filters, escalation rules
Request Body:
{
  alertThresholds: {
    onboardingProgressBelow: 60
  },
  notificationFrequency: 'daily' | 'weekly'
}

---

## HR (HUMAN RESOURCES)

GET    /systemsettings
→ View all global HR-configured system settings

PUT    /systemsettings
→ Update system-wide logic or timing
Request Body:
{
  onboardingRules: {...},
  feedbackCycles: [3, 6, 12],
  surveyAnonymity: boolean,
  autoAssignChecklists: boolean,
  notificationTemplates: { ... }
}

GET    /roles
→ List all roles and their permissions

POST   /roles
→ Create a new role with custom permissions

PUT    /roles/:id
→ Update role permissions

DELETE /roles/:id
→ Delete role
