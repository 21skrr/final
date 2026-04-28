import React from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import EmployeeResources from '../components/resources/EmployeeResources';
import HRResourceManager from '../components/resources/HRResourceManager';
import SupervisorResourceView from '../components/resources/SupervisorResourceView';
import ManagerResourceView from '../components/resources/ManagerResourceView';

const ResourcesPage: React.FC = () => {
  const { user } = useAuth();

  const renderContent = () => {
    switch (user?.role) {
      case 'hr':
        return <HRResourceManager />;
      case 'supervisor':
        return <SupervisorResourceView />;
      case 'manager':
        return <ManagerResourceView />;
      case 'employee':
      default:
        return <EmployeeResources />;
    }
  };

  return (
    <Layout>
      <div style={{ padding: '4px 0' }}>
        {renderContent()}
      </div>
    </Layout>
  );
};

export default ResourcesPage;