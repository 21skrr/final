import React from 'react';
import Layout from '../../components/layout/Layout';
import { BarChart2, TrendingUp, Users, Clock } from 'lucide-react';

const PerformanceAnalytics: React.FC = () => {
  const metrics = {
    completionRate: 85,
    avgOnboardingTime: 45,
    retentionRate: 92,
    satisfactionScore: 4.2,
  };

  const programPerformance = [
    { name: 'INKOMPASS', completion: 88, satisfaction: 4.5, retention: 94 },
    { name: 'Early Talent', completion: 82, satisfaction: 4.3, retention: 90 },
    { name: 'Apprenticeship', completion: 85, satisfaction: 4.0, retention: 88 },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Performance Analytics</h1>
          <p className="text-gray-600">
            Detailed analysis of onboarding program performance and metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3">
                <BarChart2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.completionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Avg Onboarding Time</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.avgOnboardingTime} days</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Retention Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.retentionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-3">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Satisfaction Score</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.satisfactionScore}/5</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Program Performance Comparison
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {programPerformance.map((program) => (
                <div key={program.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-900">{program.name}</h4>
                    <span className="text-sm text-gray-500">
                      Overall Score: {((program.completion + (program.satisfaction * 20) + program.retention) / 3).toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <span className="w-32 text-gray-500">Completion</span>
                      <div className="flex-1 ml-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${program.completion}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="ml-4 text-gray-700">{program.completion}%</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-32 text-gray-500">Satisfaction</span>
                      <div className="flex-1 ml-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(program.satisfaction / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="ml-4 text-gray-700">{program.satisfaction}/5</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-32 text-gray-500">Retention</span>
                      <div className="flex-1 ml-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${program.retention}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="ml-4 text-gray-700">{program.retention}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PerformanceAnalytics;