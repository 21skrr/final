import React from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import { BarChart2, TrendingUp, FileText, Users } from 'lucide-react';

const Reports: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold !text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Access comprehensive reports and analytics across the organization
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          <Link
            to="/reports/performance"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold !text-gray-900 mb-1">Performance Analytics</h2>
                <p className="text-gray-500 text-sm">View detailed performance reports and employee evaluation trends.</p>
                <span className="inline-block mt-3 text-sm font-medium text-blue-600 group-hover:underline">View Report →</span>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/evaluations/reports"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <BarChart2 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold !text-gray-900 mb-1">Evaluation Reports</h2>
                <p className="text-gray-500 text-sm">Access comprehensive evaluation and feedback reports across teams.</p>
                <span className="inline-block mt-3 text-sm font-medium text-purple-600 group-hover:underline">View Report →</span>
              </div>
            </div>
          </Link>

          <Link
            to="/manager/evaluations/reports"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold !text-gray-900 mb-1">Employee Progress</h2>
                <p className="text-gray-500 text-sm">Track onboarding progress and completion rates by department.</p>
                <span className="inline-block mt-3 text-sm font-medium text-green-600 group-hover:underline">View Report →</span>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/survey-analytics"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold !text-gray-900 mb-1">Survey Analytics</h2>
                <p className="text-gray-500 text-sm">Analyze survey participation and response data across programs.</p>
                <span className="inline-block mt-3 text-sm font-medium text-orange-600 group-hover:underline">View Report →</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;