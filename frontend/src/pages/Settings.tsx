import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Typography } from 'antd';
import UserSettingsForm from '../components/settings/UserSettingsForm';
import ManagerSettingsForm from '../components/settings/ManagerSettingsForm';
import SystemSettingsForm from '../components/settings/SystemSettingsForm';
import Layout from '../components/layout/Layout';

const { Title } = Typography;

const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  const renderSettings = () => {
    if (!user) {
      return <p>Loading user information...</p>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Title level={2}>User Settings</Title>
        
        {/* Common settings for all users */}
        <UserSettingsForm />
        
        {/* Additional settings for managers and supervisors */}
        {(user.role === 'manager' || user.role === 'supervisor') && (
          <>
            <Title level={2} style={{ marginTop: '24px' }}>Manager Preferences</Title>
            <ManagerSettingsForm />
          </>
        )}
        
        {/* Additional settings for HR */}
        {user.role === 'hr' && (
           <>
            <Title level={2} style={{ marginTop: '24px' }}>System Settings</Title>
            <SystemSettingsForm />
          </>
        )}
      </div>
    );
  };

  return <Layout>{renderSettings()}</Layout>;
};

export default SettingsPage;
