import React from 'react';

const Reports: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Employee Progress</h2>
          <p className="text-gray-600">View detailed reports on employee onboarding progress and completion rates.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Program Analytics</h2>
          <p className="text-gray-600">Analyze program effectiveness and participation metrics.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Evaluation Summary</h2>
          <p className="text-gray-600">Access comprehensive evaluation and feedback reports.</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;