import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Programs from '../pages/Programs';
import OnboardingPrograms from '../pages/OnboardingPrograms';
import Resources from '../pages/Resources';
import Calendar from '../pages/Calendar';
import Checklists from '../pages/Checklists';
import FormsAndSurveys from '../pages/FormsAndSurveys';
import Evaluations from '../pages/Evaluations';
import Feedback from '../pages/Feedback';
import Team from '../pages/Team';
import NotFound from '../pages/NotFound';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import Reports from '../pages/Reports';
import AllNotifications from '../pages/AllNotifications';

// Program Pages
import Inkompass from '../pages/programs/Inkompass';
import EarlyTalent from '../pages/programs/EarlyTalent';
import Apprenticeship from '../pages/programs/Apprenticeship';
import AcademicPlacement from '../pages/programs/AcademicPlacement';
import WorkExperience from '../pages/programs/WorkExperience';

// Admin Pages
import AddEmployee from '../pages/admin/AddEmployee';
import ManagePrograms from '../pages/admin/ManagePrograms';
import OnboardingMetrics from '../pages/admin/OnboardingMetrics';
import ActivityLogs from '../pages/admin/ActivityLogs';
import AdminPanel from '../pages/admin/AdminPanel';
import UserManagement from '../pages/admin/UserManagement';
import RolesPermissions from '../pages/admin/RolesPermissions';
import SystemSettings from '../pages/admin/SystemSettings';
import NotificationTemplates from '../pages/admin/NotificationTemplates';
import SurveyTemplates from "../pages/admin/SurveyTemplates";
import SurveySettings from '../pages/admin/SurveySettings';
import SurveyMonitoring from '../pages/admin/SurveyMonitoring';
import TeamSurveys from '../pages/supervisor/TeamSurveys';
import DepartmentSurveys from '../pages/manager/DepartmentSurveys';

// Additional Pages
import EvaluationReview from '../pages/evaluations/EvaluationReview';
import PerformanceAnalytics from '../pages/reports/PerformanceAnalytics';
import EvaluationResult from '../pages/evaluations/EvaluationResult';

// Onboarding Pages
// Add these imports at the top with the other imports
import OnboardingDetail from '../pages/OnboardingDetail';
import OnboardingManagement from '../pages/admin/OnboardingManagement';
import ManagerOnboardingManagement from '../pages/manager/OnboardingManagement';
import SupervisorOnboardingManagement from '../pages/supervisor/OnboardingManagement';


import ChecklistDetail from '../pages/ChecklistDetail';
import ChecklistCreate from '../pages/ChecklistCreate';
import HRChecklistDashboard from '../pages/HRChecklistDashboard';
import HRChecklistReports from '../pages/HRChecklistReports';
import HRChecklistBulkAssign from '../pages/HRChecklistBulkAssign';
import HRChecklistPhaseManager from '../pages/HRChecklistPhaseManager';
import EmployeeChecklists from '../pages/EmployeeChecklists';
import SupervisorTeamChecklists from '../pages/SupervisorTeamChecklists';
import ManagerChecklistDashboard from '../pages/ManagerChecklistDashboard';
import ManagerChecklistDetail from '../pages/ManagerChecklistDetail';
import SurveyDetail from '../pages/SurveyDetail';
import SurveyResponseForm from '../pages/SurveyResponseForm';
import SurveyHistory from '../pages/SurveyHistory';
import SupervisorEvaluations from '../pages/supervisor/SupervisorEvaluations';
import SupervisorEvaluationCreate from '../pages/supervisor/SupervisorEvaluationCreate';
import SupervisorEvaluationCriteria from '../pages/supervisor/SupervisorEvaluationCriteria';
import ManagerEvaluations from '../pages/manager/ManagerEvaluations';
import ManagerEvaluationReports from '../pages/manager/ManagerEvaluationReports';
import HREvaluations from '../pages/admin/HREvaluations';
import HREvaluationCreate from '../pages/admin/HREvaluationCreate';
import HREvaluationEdit from '../pages/admin/HREvaluationEdit';
import HREvaluationCriteria from '../pages/admin/HREvaluationCriteria';
import HREvaluationReports from '../pages/admin/HREvaluationReports';
import EmployeeEvaluations from '../pages/admin/EmployeeEvaluations';
import SupervisorEvaluationForm from '../pages/supervisor/SupervisorEvaluationForm';
import EvaluationScheduling from '../pages/admin/EvaluationScheduling';
import ManagerEvaluationDetail from '../pages/manager/ManagerEvaluationDetail';
import HROnboardingManagement from '../pages/admin/HROnboardingManagement';
import HRTaskValidation from '../pages/admin/HRTaskValidation';
import SurveyAnalytics from '../pages/admin/SurveyAnalytics';
import HRNotificationCenter from '../pages/admin/HRNotificationCenter';
import ChecklistEdit from '../pages/ChecklistEdit';
import SupervisorAssessments from '../pages/supervisor/SupervisorAssessments';
import HRValidationQueue from '../pages/admin/HRValidationQueue';
import HRAssessmentQueue from '../pages/admin/HRAssessmentQueue';

// Route protection component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRoles?: string[];
}> = ({ children, requiredRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const Router: React.FC = () => {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Navigate to="/login" replace />,
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/programs',
      element: (
        <ProtectedRoute>
          <Programs />
        </ProtectedRoute>
      ),
    },
    {
      path: '/programs/inkompass',
      element: (
        <ProtectedRoute>
          <Inkompass />
        </ProtectedRoute>
      ),
    },
    {
      path: '/programs/early-talent',
      element: (
        <ProtectedRoute>
          <EarlyTalent />
        </ProtectedRoute>
      ),
    },
    {
      path: '/programs/apprenticeship',
      element: (
        <ProtectedRoute>
          <Apprenticeship />
        </ProtectedRoute>
      ),
    },
    {
      path: '/programs/academic-placement',
      element: (
        <ProtectedRoute>
          <AcademicPlacement />
        </ProtectedRoute>
      ),
    },
    {
      path: '/programs/work-experience',
      element: (
        <ProtectedRoute>
          <WorkExperience />
        </ProtectedRoute>
      ),
    },
    {
      path: '/onboarding-programs',
      element: (
        <ProtectedRoute>
          <OnboardingPrograms />
        </ProtectedRoute>
      ),
    },
    {
      path: '/profile',
      element: (
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      ),
    },
    {
      path: '/settings',
      element: (
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      ),
    },
    {
      path: '/notifications',
      element: (
        <ProtectedRoute>
          <AllNotifications />
        </ProtectedRoute>
      ),
    },
    {
      path: '/checklists',
      element: (
        <ProtectedRoute requiredRoles={['employee', 'supervisor', 'hr']}>
          <Checklists />
        </ProtectedRoute>
      ),
    },
    {
      path: '/hr/checklist-dashboard',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <HRChecklistDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/hr/checklist-reports',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <HRChecklistReports />
        </ProtectedRoute>
      ),
    },
    {
      path: '/hr/checklist-bulk-assign',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <HRChecklistBulkAssign />
        </ProtectedRoute>
      ),
    },
    {
      path: '/hr/checklist-phase-manager',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <HRChecklistPhaseManager />
        </ProtectedRoute>
      ),
    },
    {
      path: '/hr/validation-queue',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <HRValidationQueue />
        </ProtectedRoute>
      ),
    },
    {
      path: '/calendar',
      element: (
        <ProtectedRoute>
          <Calendar />
        </ProtectedRoute>
      ),
    },
    {
      path: '/forms',
      element: (
        <ProtectedRoute>
          <FormsAndSurveys />
        </ProtectedRoute>
      ),
    },
    {
      path: '/surveys/:id',
      element: (
        <ProtectedRoute>
          <SurveyDetail />
        </ProtectedRoute>
      ),
    },
    {
      path: '/surveys/:id/respond',
      element: <SurveyResponseForm />,
    },
    {
      path: '/surveys/history',
      element: <SurveyHistory />,
    },
    {
      path: '/resources',
      element: <Resources />,
    },
    {
      path: '/evaluations',
      element: (
        <ProtectedRoute requiredRoles={['employee', 'supervisor', 'manager']}>
          <Evaluations />
        </ProtectedRoute>
      ),
    },
    {
      path: '/evaluations/:id',
      element: (
        <ProtectedRoute requiredRoles={['employee', 'supervisor', 'manager', 'hr']}>
          <EvaluationReview />
        </ProtectedRoute>
      ),
    },
    {
      path: '/evaluations/:id/results',
      element: (
        <ProtectedRoute requiredRoles={['employee', 'supervisor', 'manager']}>
          <EvaluationResult />
        </ProtectedRoute>
      ),
    },
    {
      path: '/evaluations/review/:id',
      element: (
        <ProtectedRoute requiredRoles={['employee', 'supervisor', 'manager']}>
          <EvaluationReview />
        </ProtectedRoute>
      ),
    },
    {
      path: '/feedback',
      element: (
        <ProtectedRoute>
          <Feedback />
        </ProtectedRoute>
      ),
    },
    {
      path: '/team',
      element: (
        <ProtectedRoute requiredRoles={['supervisor', 'manager']}>
          <Team />
        </ProtectedRoute>
      ),
    },
    {
      path: '/reports',
      element: (
        <ProtectedRoute requiredRoles={['hr', 'manager']}>
          <Reports />
        </ProtectedRoute>
      ),
    },
    {
      path: '/reports/performance',
      element: (
        <ProtectedRoute requiredRoles={['hr', 'manager']}>
          <PerformanceAnalytics />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <AdminPanel />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/users',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <UserManagement />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/users/new',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <AddEmployee />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/roles',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <RolesPermissions />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/settings',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <SystemSettings />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/programs',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <ManagePrograms />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/metrics',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <OnboardingMetrics />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/activity',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <ActivityLogs />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/notification-templates',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <NotificationTemplates />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/survey-settings',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <SurveySettings />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/survey-monitoring',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <SurveyMonitoring />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/survey-templates',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <SurveyTemplates />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/survey-analytics',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <SurveyAnalytics />
        </ProtectedRoute>
      ),
    },
    // New onboarding routes
    {
      path: '/onboarding',
      element: (
        <ProtectedRoute>
          <OnboardingDetail />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/onboarding',
      element: (
        <ProtectedRoute requiredRoles={['hr', 'manager']}>
          <OnboardingManagement />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/onboarding/:userId',
      element: (
        <ProtectedRoute requiredRoles={['hr', 'manager', 'supervisor']}>
          <OnboardingDetail />
        </ProtectedRoute>
      ),
    },
    {
      path: '/manager/onboarding',
      element: (
        <ProtectedRoute requiredRoles={['manager']}>
          <ManagerOnboardingManagement />
        </ProtectedRoute>
      ),
    },
    {
      path: '/manager/onboarding/:userId',
      element: (
        <ProtectedRoute requiredRoles={['manager']}>
          <OnboardingDetail />
        </ProtectedRoute>
      ),
    },
    {
      path: '/supervisor/onboarding',
      element: (
        <ProtectedRoute requiredRoles={['supervisor']}>
          <SupervisorOnboardingManagement />
        </ProtectedRoute>
      ),
    },
    {
      path: '/supervisor/onboarding/:userId',
      element: (
        <ProtectedRoute requiredRoles={['supervisor']}>
          <OnboardingDetail />
        </ProtectedRoute>
      ),
    },
    {
      path: '/employee/checklists',
      element: (
        <ProtectedRoute requiredRoles={['employee']}>
          <EmployeeChecklists />
        </ProtectedRoute>
      ),
    },
    {
      path: '/supervisor/team-checklists',
      element: (
        <ProtectedRoute requiredRoles={['supervisor']}>
          <SupervisorTeamChecklists />
        </ProtectedRoute>
      ),
    },
    {
      path: '/manager/checklist-dashboard',
      element: (
        <ProtectedRoute requiredRoles={['manager']}>
          <ManagerChecklistDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/manager/checklists/:id',
      element: (
        <ProtectedRoute requiredRoles={['manager']}>
          <ManagerChecklistDetail />
        </ProtectedRoute>
      ),
    },
    {
      path: '/checklists/:id/details',
      element: (
        <ProtectedRoute requiredRoles={['employee', 'supervisor', 'manager', 'hr']}>
          <ChecklistDetail />
        </ProtectedRoute>
      ),
    },
    {
      path: '/checklists/create',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <ChecklistCreate />
        </ProtectedRoute>
      ),
    },
    {
      path: '/checklists/:id/edit',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <ChecklistEdit />
        </ProtectedRoute>
      ),
    },
    {
      path: '/supervisor/team-surveys',
      element: (
        <ProtectedRoute requiredRoles={['supervisor']}>
          <TeamSurveys />
        </ProtectedRoute>
      ),
    },
    {
      path: '/manager/department-surveys',
      element: (
        <ProtectedRoute requiredRoles={['manager']}>
          <DepartmentSurveys />
        </ProtectedRoute>
      ),
    },
    {
      path: '/supervisor/evaluations',
      element: <SupervisorEvaluations />,
    },
    {
      path: '/supervisor/evaluations/new',
      element: <SupervisorEvaluationCreate />,
    },
    {
      path: '/supervisor/evaluations/:evaluationId/criteria',
      element: <SupervisorEvaluationCriteria />,
    },
    {
      path: '/supervisor/evaluations/:evaluationId/form',
      element: <SupervisorEvaluationForm />,
    },
    {
      path: '/supervisor/assessments',
      element: (
        <ProtectedRoute requiredRoles={['supervisor']}>
          <SupervisorAssessments />
        </ProtectedRoute>
      ),
    },
    {
      path: '/manager/evaluations',
      element: <ManagerEvaluations />,
    },
    {
      path: '/manager/evaluations/reports',
      element: <ManagerEvaluationReports />,
    },
    {
      path: '/manager/evaluations/:id',
      element: <ManagerEvaluationDetail />,
    },
    {
      path: '/admin/evaluations',
      element: <HREvaluations />,
    },
    {
      path: '/admin/evaluations/new',
      element: <HREvaluationCreate />,
    },
    {
      path: '/admin/evaluations/:id/edit',
      element: <HREvaluationEdit />,
    },
    {
      path: '/admin/evaluations/:id/criteria',
      element: <HREvaluationCriteria />,
    },
    {
      path: '/admin/evaluations/reports',
      element: <HREvaluationReports />,
    },
    {
      path: '/admin/employees/:id/evaluations',
      element: <EmployeeEvaluations />,
    },
    {
      path: '/admin/evaluation-scheduling',
      element: <EvaluationScheduling />,
    },
    {
      path: '/admin/onboarding-management',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <HROnboardingManagement />
        </ProtectedRoute>
      )
    },
    {
      path: '/admin/task-validation',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <HRTaskValidation />
        </ProtectedRoute>
      )
    },
    {
      path: '/admin/notification-center',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <HRNotificationCenter />
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/assessment-queue',
      element: (
        <ProtectedRoute requiredRoles={['hr']}>
          <HRAssessmentQueue />
        </ProtectedRoute>
      ),
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ]);
  
  return <RouterProvider router={router} />;
};

export default Router;
// Add these imports with the other page imports

// Add these routes in the router configuration
