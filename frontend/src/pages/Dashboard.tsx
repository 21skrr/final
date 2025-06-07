import React from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';
import SupervisorDashboard from '../components/dashboard/SupervisorDashboard';
import HRDashboard from '../components/dashboard/HRDashboard';
import ManagerDashboard from '../components/dashboard/ManagerDashboard';

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Layout>
      {user.role === 'employee' && <EmployeeDashboard user={user} />}
      {user.role === 'supervisor' && <SupervisorDashboard user={user} />}
      {user.role === 'hr' && <HRDashboard user={user} />}
      {user.role === 'manager' && <ManagerDashboard user={user} />}
    </Layout>
  );
};

export default Dashboard;