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

  const pageTitle = {
    hr: 'Resource Management',
    manager: 'Team Resources Overview',
    supervisor: 'Team Resources',
    employee: 'My Resources',
  };

  const pageDescription = {
    hr: 'Add, edit, and manage all company resources.',
    manager: 'Audit usage and review resource effectiveness.',
    supervisor: 'Assign resources and view team progress.',
    employee: 'Your assigned documents, links, and training materials.',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle[user?.role || 'employee']}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pageDescription[user?.role || 'employee']}
          </p>
        </div>
        <div>
            {renderContent()}
        </div>
      </div>
    </Layout>
  );
};

export default ResourcesPage;