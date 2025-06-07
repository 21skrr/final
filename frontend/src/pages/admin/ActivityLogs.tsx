import React from 'react';
import Layout from '../../components/layout/Layout';

const ActivityLogs: React.FC = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Activity Logs</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">System activity logs will be displayed here.</p>
        </div>
      </div>
    </Layout>
  );
};

export default ActivityLogs;