import React from 'react';
import { useAuth } from '../context/AuthContext';
import EmployeeFeedback from './feedback/EmployeeFeedback';
import SupervisorFeedback from './feedback/SupervisorFeedback';
import ManagerFeedback from './feedback/ManagerFeedback';
import HRFeedback from './feedback/HRFeedback';

const Feedback: React.FC = () => {
  const { user } = useAuth();

  // Route to appropriate feedback component based on user role
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  switch (user.role) {
    case 'employee':
      return <EmployeeFeedback />;
    case 'supervisor':
      return <SupervisorFeedback />;
    case 'manager':
      return <ManagerFeedback />;
    case 'hr':
      return <HRFeedback />;
    default:
      return <EmployeeFeedback />; // Default to employee view
  }
};

export default Feedback;