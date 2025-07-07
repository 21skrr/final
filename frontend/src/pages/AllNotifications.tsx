import React from 'react';
import { useAuth } from '../context/AuthContext';
import EmployeeNotifications from './notifications/EmployeeNotifications';
import SupervisorNotifications from './notifications/SupervisorNotifications';
import ManagerNotifications from './notifications/ManagerNotifications';
import HRNotifications from './notifications/HRNotifications';

const AllNotifications: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Route to appropriate notification component based on user role
  switch (user.role) {
    case 'employee':
      return <EmployeeNotifications />;
    case 'supervisor':
      return <SupervisorNotifications />;
    case 'manager':
      return <ManagerNotifications />;
    case 'hr':
      return <HRNotifications />;
    default:
      return <EmployeeNotifications />; // Default fallback
  }
};

export default AllNotifications;