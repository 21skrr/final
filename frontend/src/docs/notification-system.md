# 🔔 Role-Based Notification System

This document describes the complete implementation of the role-based notification system for the onboarding platform.

## 📋 Overview

The notification system provides role-specific notification types and endpoints for different user roles:
- **Employee**: Personal notifications, reminders, training alerts
- **Supervisor**: Team progress, feedback submissions, probation deadlines
- **Manager**: Department milestones, pending approvals, team followups
- **HR**: System alerts, new employees, compliance issues, templates

## 🏗️ Architecture

### Backend Components

#### Routes (`backend/routes/notificationRoutes.js`)
- **General endpoints**: `/notifications`, `/notifications/:id/read`, `/notifications/read-all`
- **Role-specific endpoints**: Each role has dedicated endpoints for their notification types
- **Settings**: `/notifications/preferences` for user preferences
- **Templates**: `/notifications/templates/*` for HR template management

#### Controller (`backend/controllers/notificationController.js`)
- **Role-based access control**: Each method checks user role before processing
- **Comprehensive error handling**: All methods include try-catch blocks
- **Data validation**: Ensures proper data types and required fields
- **Metadata support**: Flexible metadata for additional notification context

### Frontend Components

#### Service Layer (`frontend/src/services/notificationService.ts`)
```typescript
// Role-based notification parameters
export interface TeamFollowupParams {
  department?: string;
  status?: string;
}

export interface ProbationDeadlineParams {
  daysUntil?: number;
  department?: string;
}

// Service methods organized by role
const notificationService = {
  // Employee endpoints
  getReminders: async (): Promise<Notification[]>
  getFeedbackAvailability: async (): Promise<Notification[]>
  
  // Supervisor endpoints
  getTeamProgress: async (): Promise<Notification[]>
  getFeedbackSubmissions: async (): Promise<Notification[]>
  
  // Manager endpoints
  getOnboardingMilestones: async (): Promise<Notification[]>
  getPendingApprovals: async (): Promise<Notification[]>
  
  // HR endpoints
  getSystemAlerts: async (params?: SystemAlertParams): Promise<Notification[]>
  getNewEmployees: async (params?: NewEmployeeParams): Promise<Notification[]>
}
```

#### Context (`frontend/src/context/NotificationContext.tsx`)
- **Global state management**: Manages notifications across the application
- **Role-based fetching**: `fetchRoleBasedNotifications(type)` for specific notification types
- **Real-time updates**: Automatic refresh when user changes
- **Count tracking**: `getNotificationCount(type)` for badge displays

#### Role-Specific Components

##### Employee Notifications (`frontend/src/pages/notifications/EmployeeNotifications.tsx`)
- **Tabs**: All, Reminders, Documents, Training, Coaching, Overdue, Feedback
- **Features**: Mark as read, delete, filter by status
- **Icons**: Role-specific icons for different notification types

##### Supervisor Notifications (`frontend/src/pages/notifications/SupervisorNotifications.tsx`)
- **Team focus**: Team progress, feedback submissions, probation deadlines
- **User context**: Shows which team member triggered the notification
- **Department filtering**: Filter by department when applicable

##### Manager Notifications (`frontend/src/pages/notifications/ManagerNotifications.tsx`)
- **Department oversight**: Onboarding milestones, pending approvals
- **Metadata display**: Shows department, status, and other context
- **Weekly reports**: Access to weekly progress reports

##### HR Notifications (`frontend/src/pages/notifications/HRNotifications.tsx`)
- **System monitoring**: System alerts, compliance issues
- **Template management**: Toggle between notifications and template management
- **Advanced filtering**: Severity, category, department filters

#### Preferences Component (`frontend/src/components/settings/NotificationPreferences.tsx`)
- **Channel management**: Email, in-app, push notifications
- **Frequency settings**: Daily, weekly, monthly digests
- **Quiet hours**: Configure do-not-disturb periods
- **Real-time saving**: Immediate feedback on preference changes

## 🎯 Role-Based Features

### 👤 Employee Features
- **Personal notifications**: Reminders, documents, training alerts
- **Feedback availability**: Notified when feedback forms are available
- **Coaching sessions**: Session reminders and updates
- **Overdue tasks**: Personal task deadline alerts

### 🧑‍🏫 Supervisor Features
- **Team progress**: Monitor team member onboarding progress
- **Feedback submissions**: Review team member feedback
- **Probation deadlines**: Track upcoming probation reviews
- **Overdue team tasks**: Alerts for team member overdue items

### 👔 Manager Features
- **Department milestones**: Key onboarding stages across department
- **Pending approvals**: HR and workflow approvals
- **Team followups**: Development and onboarding followups
- **Weekly reports**: Department progress summaries

### 👩‍💼 HR Features
- **System alerts**: Critical errors, warnings, backend failures
- **New employees**: Track new hire notifications
- **Compliance alerts**: Policy acknowledgments, audit issues
- **Template management**: Create and manage notification templates
- **Leave requests**: New and pending leave notifications

## 🔧 API Endpoints

### General Endpoints
```
GET    /api/notifications              # All user notifications
PUT    /api/notifications/:id/read     # Mark as read
PUT    /api/notifications/read-all     # Mark all as read
DELETE /api/notifications/:id          # Delete notification
```

### Employee Endpoints
```
GET /api/notifications/reminders              # Task reminders
GET /api/notifications/feedback-availability  # Available feedback forms
GET /api/notifications/documents              # Document alerts
GET /api/notifications/training               # Training notifications
GET /api/notifications/coaching-sessions     # Coaching updates
GET /api/notifications/overdue-tasks         # Overdue personal tasks
```

### Supervisor Endpoints
```
GET /api/notifications/team-progress         # Team member progress
GET /api/notifications/feedback-submissions  # Team feedback
GET /api/notifications/probation-deadlines   # Team probation reviews
```

### Manager Endpoints
```
GET /api/notifications/onboarding-milestones # Department milestones
GET /api/notifications/pending-approvals     # Workflow approvals
GET /api/notifications/team-followups        # Team development
GET /api/notifications/weekly-reports        # Department reports
```

### HR Endpoints
```
GET /api/notifications/summary-reports       # Progress summaries
GET /api/notifications/system-alerts         # System issues
GET /api/notifications/new-employees         # New hire alerts
GET /api/notifications/feedback-checkpoints  # Review cycles
GET /api/notifications/weekly-reports        # Weekly progress
GET /api/notifications/compliance-alerts     # Compliance issues
GET /api/notifications/leave-requests        # Leave notifications
```

### Settings Endpoints
```
GET /api/notifications/preferences           # Get user preferences
PUT /api/notifications/preferences           # Update preferences
```

### Template Endpoints (HR Only)
```
GET    /api/notifications/templates          # List templates
POST   /api/notifications/templates          # Create template
GET    /api/notifications/templates/:id      # Get template
PUT    /api/notifications/templates/:id      # Update template
DELETE /api/notifications/templates/:id      # Delete template
```

## 🎨 UI Components

### Notification Panel (`frontend/src/components/features/NotificationsPanel.tsx`)
- **Dropdown panel**: Shows recent notifications
- **Quick actions**: Mark as read, view all
- **Unread count**: Badge showing unread notifications
- **Role-aware**: Shows appropriate notifications based on user role

### Notification Lists
Each role-specific component includes:
- **Tabbed interface**: Different notification types
- **Filtering**: All, unread, read filters
- **Bulk actions**: Mark all as read
- **Individual actions**: Mark as read, delete
- **Metadata display**: User info, department, status badges

### Preferences Interface
- **Channel toggles**: Email, in-app, push notifications
- **Frequency selection**: Daily, weekly, monthly
- **Quiet hours**: Time-based notification blocking
- **Real-time feedback**: Success/error messages

## 🔐 Security & Access Control

### Backend Security
- **Authentication middleware**: All endpoints require valid JWT
- **Role-based middleware**: `isRH`, `isSupervisor` for restricted endpoints
- **Controller-level checks**: Additional role validation in methods
- **Data isolation**: Users only see their role-appropriate notifications

### Frontend Security
- **Route protection**: Role-based routing to appropriate components
- **Context validation**: Ensures user context before API calls
- **Error handling**: Graceful degradation for unauthorized access

## 📊 Data Flow

1. **User Action**: User performs action that triggers notification
2. **Backend Creation**: Controller creates notification with appropriate type
3. **Database Storage**: Notification stored with user ID and metadata
4. **Frontend Polling**: Context periodically fetches new notifications
5. **UI Update**: Components re-render with new notification data
6. **User Interaction**: User marks as read, deletes, or views notifications

## 🚀 Usage Examples

### Fetching Role-Based Notifications
```typescript
const { fetchRoleBasedNotifications } = useNotifications();

// For supervisors
const teamProgress = await fetchRoleBasedNotifications('team-progress');

// For managers
const milestones = await fetchRoleBasedNotifications('onboarding-milestones');

// For HR
const alerts = await fetchRoleBasedNotifications('system-alerts');
```

### Managing Preferences
```typescript
import notificationService from '../services/notificationService';

// Get current preferences
const preferences = await notificationService.getPreferences();

// Update preferences
await notificationService.updatePreferences({
  emailNotifications: { reminders: false },
  frequency: 'weekly'
});
```

### Template Management (HR Only)
```typescript
// Create template
const template = await notificationService.createTemplate({
  name: 'Welcome Template',
  title: 'Welcome to the Team!',
  message: 'Welcome {{employeeName}} to {{department}}!',
  type: 'welcome'
});

// List templates
const templates = await notificationService.getTemplates();
```

## 🐛 Error Handling

### Backend Error Handling
- **Database errors**: Graceful fallback with error messages
- **Validation errors**: Clear error responses for invalid data
- **Authorization errors**: 403 responses for unauthorized access
- **Network errors**: Timeout handling and retry logic

### Frontend Error Handling
- **API errors**: User-friendly error messages
- **Network issues**: Offline state handling
- **Loading states**: Spinner and skeleton loaders
- **Empty states**: Helpful messages when no notifications

## 🔄 Real-Time Updates

### Polling Strategy
- **Context polling**: Automatic refresh every 30 seconds
- **User-triggered**: Refresh on user actions
- **Background sync**: Sync when app becomes active

### State Management
- **Optimistic updates**: Immediate UI updates for user actions
- **Error rollback**: Revert changes on API failures
- **Cache invalidation**: Clear cache on logout

## 📈 Performance Considerations

### Backend Optimization
- **Database indexing**: Indexed on user_id, type, created_at
- **Pagination**: Limit results to prevent large queries
- **Caching**: Redis caching for frequently accessed data
- **Query optimization**: Efficient joins and filtering

### Frontend Optimization
- **Virtual scrolling**: For large notification lists
- **Debounced updates**: Prevent excessive API calls
- **Lazy loading**: Load notifications on demand
- **Memory management**: Clean up unused notifications

## 🧪 Testing Strategy

### Backend Testing
- **Unit tests**: Controller method testing
- **Integration tests**: API endpoint testing
- **Role testing**: Verify role-based access control
- **Error testing**: Test error scenarios

### Frontend Testing
- **Component tests**: Test notification components
- **Context tests**: Test notification context
- **Service tests**: Test API service methods
- **E2E tests**: Test complete notification flow

## 📚 Future Enhancements

### Planned Features
- **Push notifications**: Real-time browser notifications
- **Email integration**: Automatic email notifications
- **Advanced filtering**: More granular filter options
- **Notification scheduling**: Delayed notification sending
- **Analytics**: Notification engagement metrics

### Technical Improvements
- **WebSocket support**: Real-time notification delivery
- **Offline support**: Queue notifications when offline
- **Advanced templates**: Dynamic content and variables
- **Bulk operations**: Mass notification management

## 🔧 Configuration

### Environment Variables
```env
# Notification settings
NOTIFICATION_POLLING_INTERVAL=30000
NOTIFICATION_MAX_AGE=30
NOTIFICATION_BATCH_SIZE=50

# Email settings (for future email integration)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@example.com
SMTP_PASS=password
```

### Database Configuration
```sql
-- Notification table indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

This comprehensive notification system provides a robust, role-based solution for managing user notifications across the onboarding platform, with proper security, performance, and user experience considerations. 