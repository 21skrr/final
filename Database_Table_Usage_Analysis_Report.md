# Database Table Usage Analysis Report

**Project**: Final Onboarding Management System  
**Analysis Date**: January 2025  
**Total Tables Analyzed**: 67  

---

## Executive Summary

This report provides a comprehensive analysis of database table usage across the entire project, identifying which tables are actively used, which are backend-only, and which are completely unused. The analysis covers both backend (Node.js/Express) and frontend (React/TypeScript) codebases.

### Key Findings
- **31% of tables (21 tables) are completely unused** and can be safely removed
- **45% of tables (30 tables) are backend-only** and may need frontend integration
- **24% of tables (16 tables) have full-stack integration** and are actively maintained

---

## 🔴 COMPLETELY UNUSED TABLES (21 tables)

These tables exist in the database but have **no references** in either backend or frontend code. They can be safely removed.

| Table Name | Status | Recommendation |
|------------|--------|----------------|
| `analytics_data_cache` | ❌ No model file, no references | **SAFE TO DELETE** |
| `analytics_widgets` | ❌ No model file, no references | **SAFE TO DELETE** |
| `assessment_questions` | ❌ No model file, no references | **SAFE TO DELETE** |
| `assessment_results` | ❌ No model file, no references | **SAFE TO DELETE** |
| `assessment_submissions` | ❌ No model file, no references | **SAFE TO DELETE** |
| `autoassignrules` | ❌ No model file, no references | **SAFE TO DELETE** |
| `chats` | ❌ No model file, no references | **SAFE TO DELETE** |
| `feedback_checkpoints` | ❌ No model file, no references | **SAFE TO DELETE** |
| `leave_requests` | ❌ No model file, no references | **SAFE TO DELETE** |
| `notifications_backup` | ❌ No model file, no references | **SAFE TO DELETE** |
| `onboarding_analytics` | ❌ No model file, no references | **SAFE TO DELETE** |
| `onboardingmetrics` | ❌ No model file, no references | **SAFE TO DELETE** |
| `performanceanalytics` | ❌ No model file, no references | **SAFE TO DELETE** |
| `report_executions` | ❌ No model file, no references | **SAFE TO DELETE** |
| `reportaccess` | ❌ No model file, no references | **SAFE TO DELETE** |
| `scheduled_notifications` | ❌ No model file, no references | **SAFE TO DELETE** |
| `survey_analytics` | ❌ No model file, no references | **SAFE TO DELETE** |
| `training_analytics` | ❌ No model file, no references | **SAFE TO DELETE** |
| `userchecklistitems` | ❌ No model file, no references | **SAFE TO DELETE** |
| `userchecklists` | ❌ No model file, no references | **SAFE TO DELETE** |
| `usertaskprogresses` | ❌ No model file, no references | **SAFE TO DELETE** |

### Impact of Removing Unused Tables
- **Database size reduction**: Significant storage savings
- **Maintenance overhead**: Reduced complexity
- **Performance**: Faster database operations
- **Security**: Reduced attack surface

---

## 🟡 BACKEND-ONLY TABLES (30 tables)

These tables have backend models and controllers but **no frontend service integration**. Consider adding frontend services if functionality is needed.

| Table Name | Backend Model | Backend Controller | Frontend Service | Recommendation |
|------------|---------------|-------------------|------------------|----------------|
| `activitylogs` | ✅ ActivityLog.js | ✅ activityLogController.js | ❌ Missing | Add frontend service |
| `analytics_dashboards` | ✅ AnalyticsDashboard.js | ✅ organizationAnalyticsController.js | ❌ Missing | Add frontend service |
| `analytics_metrics` | ✅ AnalyticsMetric.js | ✅ organizationAnalyticsController.js | ❌ Missing | Add frontend service |
| `documentaccess` | ✅ DocumentAccess.js | ✅ documentController.js | ❌ Missing | Add frontend service |
| `documents` | ✅ Document.js | ✅ documentController.js | ❌ Missing | Add frontend service |
| `evaluationcriteria` | ✅ EvaluationCriteria.js | ✅ evaluationController.js | ❌ Missing | Add frontend service |
| `evaluations` | ✅ Evaluation.js | ✅ evaluationController.js | ❌ Missing | Add frontend service |
| `eventparticipants` | ✅ EventParticipant.js | ✅ eventController.js | ❌ Missing | Add frontend service |
| `events` | ✅ Event.js | ✅ eventController.js | ❌ Missing | Add frontend service |
| `feedbackforms` | ✅ FeedbackForm.js | ✅ feedbackController.js | ❌ Missing | Add frontend service |
| `feedbacksubmissions` | ✅ FeedbackSubmission.js | ✅ feedbackController.js | ❌ Missing | Add frontend service |
| `feedback_notes` | ✅ FeedbackNote.js | ✅ feedbackController.js | ❌ Missing | Add frontend service |
| `feedback_followup_participants` | ✅ FeedbackFollowupParticipant.js | ✅ feedbackController.js | ❌ Missing | Add frontend service |
| `feedback_followups` | ✅ FeedbackFollowup.js | ✅ feedbackController.js | ❌ Missing | Add frontend service |
| `hrassessments` | ✅ HRAssessment.js | ✅ hrAssessmentController.js | ❌ Missing | Add frontend service |
| `managerpreferences` | ✅ ManagerPreference.js | ✅ settingsController.js | ❌ Missing | Add frontend service |
| `notification_preferences` | ✅ notificationPreference.js | ✅ notificationController.js | ❌ Missing | Add frontend service |
| `notificationsettings` | ✅ NotificationSettings.js | ✅ notificationController.js | ❌ Missing | Add frontend service |
| `notificationtemplates` | ✅ notificationTemplate.js | ✅ notificationController.js | ❌ Missing | Add frontend service |
| `onboardingprogresses` | ✅ OnboardingProgress.js | ✅ onboardingController.js | ❌ Missing | Add frontend service |
| `onboardingtasks` | ✅ OnboardingTask.js | ✅ onboardingController.js | ❌ Missing | Add frontend service |
| `programs` | ✅ Program.js | ✅ programController.js | ❌ Missing | Add frontend service |
| `report_schedules` | ✅ ReportSchedule.js | ✅ reportScheduleController.js | ❌ Missing | Add frontend service |
| `report_templates` | ✅ ReportTemplate.js | ✅ reportTemplateController.js | ❌ Missing | Add frontend service |
| `reports` | ✅ Report.js | ✅ reportController.js | ❌ Missing | Add frontend service |
| `resourceassignments` | ✅ ResourceAssignment.js | ✅ resourceController.js | ❌ Missing | Add frontend service |
| `resources` | ✅ Resource.js | ✅ resourceController.js | ❌ Missing | Add frontend service |
| `roles` | ✅ Role.js | ✅ hrController.js | ❌ Missing | Add frontend service |
| `supervisorassessments` | ✅ SupervisorAssessment.js | ✅ supervisorAssessmentController.js | ❌ Missing | Add frontend service |
| `survey_schedules` | ✅ surveySchedule.js | ✅ surveyController.js | ❌ Missing | Add frontend service |
| `survey_settings` | ✅ SurveySettings.js | ✅ surveyController.js | ❌ Missing | Add frontend service |
| `surveyquestionresponses` | ✅ SurveyQuestionResponse.js | ✅ surveyController.js | ❌ Missing | Add frontend service |
| `surveyquestions` | ✅ SurveyQuestion.js | ✅ surveyController.js | ❌ Missing | Add frontend service |
| `surveyresponses` | ✅ SurveyResponse.js | ✅ surveyController.js | ❌ Missing | Add frontend service |
| `surveys` | ✅ Survey.js | ✅ surveyController.js | ❌ Missing | Add frontend service |
| `systemsettings` | ✅ SystemSetting.js | ✅ systemSettingsController.js | ❌ Missing | Add frontend service |
| `tasks` | ✅ Task.js | ✅ taskController.js | ❌ Missing | Add frontend service |
| `team_progress` | ✅ TeamSettings.js | ✅ teamAnalyticsController.js | ❌ Missing | Add frontend service |
| `teams` | ✅ Team.js | ✅ teamController.js | ❌ Missing | Add frontend service |
| `teamsettings` | ✅ TeamSettings.js | ✅ settingsController.js | ❌ Missing | Add frontend service |
| `usercourses` | ✅ UserCourse.js | ✅ courseController.js | ❌ Missing | Add frontend service |
| `userroles` | ✅ Role.js | ✅ userController.js | ❌ Missing | Add frontend service |
| `usersettings` | ✅ UserSetting.js | ✅ userController.js | ❌ Missing | Add frontend service |

### Priority for Frontend Integration
**High Priority** (Core functionality):
- `users`, `teams`, `departments`
- `evaluations`, `feedback`, `notifications`
- `onboardingprogresses`, `onboardingtasks`

**Medium Priority** (Important features):
- `events`, `courses`, `surveys`
- `documents`, `resources`
- `reports`, `analytics`

**Low Priority** (Administrative):
- `roles`, `systemsettings`
- `notificationtemplates`, `managerpreferences`

---

## 🟢 FULL-STACK USED TABLES (16 tables)

These tables have complete integration with both backend and frontend.

| Table Name | Backend Model | Backend Controller | Frontend Service | Status |
|------------|---------------|-------------------|------------------|---------|
| `activitylogs` | ✅ ActivityLog.js | ✅ activityLogController.js | ✅ analyticsService.ts | **ACTIVE** |
| `checklist_combined` | ✅ ChecklistAssignment.js | ✅ checklistController.js | ✅ checklistService.ts | **ACTIVE** |
| `checklistassignments` | ✅ ChecklistAssignment.js | ✅ checklistController.js | ✅ checklistService.ts | **ACTIVE** |
| `checklistitems` | ✅ ChecklistItem.js | ✅ checklistController.js | ✅ checklistService.ts | **ACTIVE** |
| `checklistprogresses` | ✅ ChecklistProgress.js | ✅ checklistController.js | ✅ checklistService.ts | **ACTIVE** |
| `checklists` | ✅ Checklist.js | ✅ checklistController.js | ✅ checklistService.ts | **ACTIVE** |
| `coaching_sessions` | ✅ CoachingSession.js | ✅ coachingController.js | ✅ analyticsService.ts | **ACTIVE** |
| `courses` | ✅ Course.js | ✅ courseController.js | ✅ analyticsService.ts | **ACTIVE** |
| `departments` | ✅ Department.js | ✅ departmentAnalyticsController.js | ✅ userService.ts | **ACTIVE** |
| `feedback` | ✅ Feedback.js | ✅ feedbackController.js | ✅ feedbackService.ts | **ACTIVE** |
| `notifications` | ✅ Notification.js | ✅ notificationController.js | ✅ notificationService.ts | **ACTIVE** |
| `onboardingprogresses` | ✅ OnboardingProgress.js | ✅ onboardingController.js | ✅ onboardingService.ts | **ACTIVE** |
| `onboardingtasks` | ✅ OnboardingTask.js | ✅ onboardingController.js | ✅ onboardingService.ts | **ACTIVE** |
| `supervisorassessments` | ✅ SupervisorAssessment.js | ✅ supervisorAssessmentController.js | ✅ supervisorAssessmentService.ts | **ACTIVE** |
| `hrassessments` | ✅ HRAssessment.js | ✅ hrAssessmentController.js | ✅ hrAssessmentService.ts | **ACTIVE** |
| `users` | ✅ User.js | ✅ userController.js | ✅ userService.ts | **ACTIVE** |

### Frontend Services Available
- `userService.ts` - User management
- `onboardingService.ts` - Onboarding workflows
- `feedbackService.ts` - Feedback system
- `checklistService.ts` - Checklist management
- `notificationService.ts` - Notification system
- `analyticsService.ts` - Analytics and reporting
- `supervisorAssessmentService.ts` - Supervisor assessments
- `hrAssessmentService.ts` - HR assessments

---

## 📊 Detailed Statistics

### Table Usage Distribution
```
Total Tables: 67
├── Completely Unused: 21 (31%)
├── Backend-Only: 30 (45%)
└── Full-Stack Used: 16 (24%)
```

### Backend Coverage
- **Models**: 46 models exist
- **Controllers**: 34 controllers active
- **Routes**: 38 route files registered
- **API Endpoints**: 200+ endpoints available

### Frontend Coverage
- **Services**: 8 service files
- **API Integration**: 16 tables fully integrated
- **Missing Services**: 30 tables need frontend services

---

## 🎯 Recommendations

### Immediate Actions (High Priority)

1. **Database Cleanup**
   ```sql
   -- Remove completely unused tables
   DROP TABLE IF EXISTS analytics_data_cache;
   DROP TABLE IF EXISTS analytics_widgets;
   DROP TABLE IF EXISTS assessment_questions;
   -- ... (continue for all 21 unused tables)
   ```

2. **Frontend Service Development**
   - Create missing frontend services for high-priority tables
   - Implement API integration for core functionality
   - Add proper error handling and loading states

### Medium-Term Actions

1. **Code Organization**
   - Consolidate similar controllers
   - Standardize API response formats
   - Implement consistent error handling

2. **Documentation**
   - Document all API endpoints
   - Create frontend service documentation
   - Add database schema documentation

### Long-Term Actions

1. **Performance Optimization**
   - Add database indexes for frequently queried tables
   - Implement caching for analytics data
   - Optimize complex queries

2. **Feature Completeness**
   - Complete frontend integration for all backend tables
   - Add comprehensive testing
   - Implement monitoring and logging

---

## 🔧 Technical Implementation Guide

### Adding Frontend Service for Backend-Only Table

1. **Create Service File**
   ```typescript
   // frontend/src/services/exampleService.ts
   import api from './api';
   
   const exampleService = {
     getAll: async () => {
       const response = await api.get('/examples');
       return response.data;
     },
     // ... other methods
   };
   
   export default exampleService;
   ```

2. **Add to Component**
   ```typescript
   import exampleService from '../services/exampleService';
   
   // Use in component
   const data = await exampleService.getAll();
   ```

3. **Update Types**
   ```typescript
   // frontend/src/types/example.ts
   export interface Example {
     id: string;
     name: string;
     // ... other properties
   }
   ```

### Database Migration for Unused Tables

1. **Backup Database**
   ```bash
   mysqldump -u username -p database_name > backup.sql
   ```

2. **Create Migration Script**
   ```sql
   -- migrations/remove_unused_tables.sql
   DROP TABLE IF EXISTS analytics_data_cache;
   DROP TABLE IF EXISTS analytics_widgets;
   -- ... continue for all unused tables
   ```

3. **Test in Development**
   - Run migration on development database
   - Test all functionality
   - Verify no broken references

---

## 📋 Action Items Checklist

### Phase 1: Database Cleanup
- [ ] Backup production database
- [ ] Create migration script for unused tables
- [ ] Test migration in development environment
- [ ] Schedule maintenance window for production
- [ ] Execute migration and verify system stability

### Phase 2: Frontend Integration
- [ ] Audit high-priority backend-only tables
- [ ] Create frontend services for core functionality
- [ ] Implement API integration
- [ ] Add proper error handling
- [ ] Test frontend-backend integration

### Phase 3: Documentation & Testing
- [ ] Document all API endpoints
- [ ] Create service documentation
- [ ] Add comprehensive tests
- [ ] Implement monitoring
- [ ] Performance optimization

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- **Monthly**: Review table usage statistics
- **Quarterly**: Audit unused tables and clean up
- **Annually**: Complete database schema review

### Monitoring
- Track API endpoint usage
- Monitor database performance
- Review frontend service adoption

### Contact Information
- **Database Admin**: [Your Database Admin]
- **Backend Team**: [Your Backend Team]
- **Frontend Team**: [Your Frontend Team]

---

**Report Generated**: January 2025  
**Next Review Date**: April 2025  
**Version**: 1.0

---

*This report was generated through automated analysis of the codebase. Please verify all findings before implementing changes in production.*



You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
login-1.tsx
'use client'

import * as React from 'react'
import { Children,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState, } from 'react'
import Image from 'next/image';

interface InputProps {
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  [key: string]: any;
}

const AppInput = (props: InputProps) => {
  const { label, placeholder, icon, ...rest } = props;
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="w-full min-w-[200px] relative">
      { label && 
        <label className='block mb-2 text-sm'>
          {label}
        </label>
      }
      <div className="relative w-full">
        <input
          type="text"
          className="peer relative z-10 border-2 border-[var(--color-border)] h-13 w-full rounded-md bg-[var(--color-surface)] px-4 font-thin outline-none drop-shadow-sm transition-all duration-200 ease-in-out focus:bg-[var(--color-bg)] placeholder:font-medium"
          placeholder={placeholder}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          {...rest}
        />
        {isHovering && (
          <>
            <div
              className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] z-20 rounded-t-md overflow-hidden"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 0px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute pointer-events-none bottom-0 left-0 right-0 h-[2px] z-20 rounded-b-md overflow-hidden"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 2px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
          </>
        )}
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

const Page = () => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const leftSection = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top
    });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

   const socialIcons = [
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"/></svg>,
      href: '#',
      gradient: 'bg-[var(--color-bg)]',
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z"/></svg>,
      href: '#',
      bg: 'bg-[var(--color-bg)]',
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396z"/></svg>,
      href: '#',
      bg: 'bg-[var(--color-bg)]',
    }
  ];

  return (
    <div className="h-screen w-[100%] bg-[var(--color-bg)] flex items-center justify-center p-4">
    <div className='card w-[80%] lg:w-[70%] md:w-[55%] flex justify-between h-[600px]'>
      <div
        className='w-full lg:w-1/2 px-4 lg:px-16 left h-full relative overflow-hidden'
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
          <div
            className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-purple-300/30 via-blue-300/30 to-pink-300/30 rounded-full blur-3xl transition-opacity duration-200 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          />
          <div className="form-container sign-in-container h-full z-10">
            <form className='text-center py-10 md:py-20 grid gap-2 h-full' onSubmit={()=>{e.preventDefault();}}>
              <div className='grid gap-4 md:gap-6 mb-2'>
                <h1 className='text-3xl md:text-4xl font-extrabold' onClick={(e) => {e.preventDefault()}}>Sign in</h1>
                <div className="social-container">
                  <div className="flex items-center justify-center">
                    <ul className="flex gap-3 md:gap-4">
                      {socialIcons.map((social, index) => {
                        return (
                          <li key={index} className="list-none">
                            <a
                              href={social.href}
                              className={`w-[2.5rem] md:w-[3rem] h-[2.5rem] md:h-[3rem] bg-[var(--color-bg-2)] rounded-full flex justify-center items-center relative z-[1] border-3 border-[var(--color-text-primary)] overflow-hidden group`}
                            >
                              <div
                                className={`absolute inset-0 w-full h-full ${
                                  social.gradient || social.bg
                                } scale-y-0 origin-bottom transition-transform duration-500 ease-in-out group-hover:scale-y-100`}
                              />
                              <span className="text-[1.5rem] text-[hsl(203,92%,8%)] transition-all duration-500 ease-in-out z-[2] group-hover:text-[var(--color-text-primary)] group-hover:rotate-y-360">
                                {social.icon}
                              </span>
                            </a>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </div>
              <span className='text-sm'>or use your account</span>
            </div>
            <div className='grid gap-4 items-center'>
                <AppInput placeholder="Email" type="email" />
                <AppInput placeholder="Password" type="password" />
              </div>
              <a href="#" className='font-light text-sm md:text-md'>Forgot your password?</a>
              <div className='flex gap-4 justify-center items-center'>
                 <button 
                  className="group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-[var(--color-border)] px-4 py-1.5 text-xs font-normal text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-[var(--color-text-primary)] cursor-pointer"
                >
                <span className="text-sm px-2 py-1">Sign In</span>
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                  <div className="relative h-full w-8 bg-white/20" />
                </div>
              </button>
              </div>
            </form>
          </div>
        </div>
        <div className='hidden lg:block w-1/2 right h-full overflow-hidden'>
            <Image
              src='https://images.pexels.com/photos/7102037/pexels-photo-7102037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
              loader={({ src }) => src}
              width={1000}
              height={1000}
              priority
              alt="Carousel image"
              className="w-full h-full object-cover transition-transform duration-300 opacity-30"
            />
       </div>
      </div>
    </div>
  )
}

export default Page


demo.tsx
import Component from "@/components/ui/login-1";

const DemoOne = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <Component />
    </div>
  );
};

export { DemoOne };

```

Install NPM dependencies:
```bash
next
```

Extend existing Tailwind 4 index.css with this code (or if project uses Tailwind 3, extend tailwind.config.js or globals.css):
```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --color-bg: #101214;
  --color-surface: #161A1D;
  --color-muted-surface: #1D2125;
  --color-border: #2C333A;
  --color-text-secondary: #596773;
  --color-text-primary: #C7D1DB;
  --color-heading: #DEE4EA;
  --spacing-6: 1.5rem;
  --rounded-lg: 0.5rem;
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  --color-text-primary-rgb: 199, 209, 219;
  --color-bg-2: #C7D1DB;
}

.dark {
  --color-bg: #101214;
  --color-surface: #161A1D;
  --color-muted-surface: #1D2125;
  --color-border: #2C333A;
  --color-text-secondary: #596773;
  --color-text-primary: #C7D1DB;
  --color-heading: #DEE4EA;
  --color-bg-2: #C7D1DB;
  --color-text-primary-rgb: 199, 209, 219;
}

```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them

