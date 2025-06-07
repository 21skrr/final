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

// Additional Pages
import EvaluationReview from '../pages/evaluations/EvaluationReview';
import PerformanceAnalytics from '../pages/reports/PerformanceAnalytics';

// Onboarding Pages
// Add these imports at the top with the other imports
import OnboardingDetail from '../pages/OnboardingDetail';
import OnboardingManagement from '../pages/admin/OnboardingManagement';

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
      path: '/evaluations',
      element: (
        <ProtectedRoute requiredRoles={['employee', 'supervisor', 'manager']}>
          <Evaluations />
        </ProtectedRoute>
      ),
    },
    {
      path: '/evaluations/review/:id',
      element: (
        <ProtectedRoute requiredRoles={['supervisor', 'manager']}>
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
      path: '/resources',
      element: (
        <ProtectedRoute>
          <Resources />
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
        <ProtectedRoute requiredRoles={['hr', 'manager']}>
          <OnboardingDetail />
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