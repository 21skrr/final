import React from 'react';
import Layout from '../components/layout/Layout';
import { ClipboardCheck, Star, Clock, AlertCircle } from 'lucide-react';

const Evaluations: React.FC = () => {
  const evaluations = [
    {
      id: '1',
      title: '3-Month Performance Review',
      dueDate: '2024-03-20',
      status: 'pending',
      type: 'performance',
      evaluator: 'Sarah Manager',
      categories: [
        'Job Knowledge',
        'Communication Skills',
        'Team Collaboration',
        'Initiative',
      ],
    },
    {
      id: '2',
      title: 'Training Assessment',
      dueDate: '2024-03-15',
      status: 'completed',
      type: 'training',
      evaluator: 'John Supervisor',
      score: 85,
      categories: [
        'Technical Skills',
        'Product Knowledge',
        'Process Understanding',
      ],
    },
    {
      id: '3',
      title: 'Probation Period Evaluation',
      dueDate: '2024-03-25',
      status: 'in_progress',
      type: 'probation',
      evaluator: 'Sarah Manager',
      categories: [
        'Performance',
        'Attendance',
        'Adaptability',
        'Cultural Fit',
      ],
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evaluations</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and manage performance evaluations and assessments
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {evaluations.map((evaluation) => (
            <div key={evaluation.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="rounded-full p-2 bg-blue-100">
                      <ClipboardCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-medium text-gray-900">{evaluation.title}</h2>
                      <p className="text-sm text-gray-500">Evaluator: {evaluation.evaluator}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(evaluation.status)}`}>
                    {evaluation.status.replace('_', ' ').charAt(0).toUpperCase() + evaluation.status.slice(1)}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    Due: {evaluation.dueDate}
                  </div>
                </div>

                {evaluation.score && (
                  <div className="mt-4 flex items-center">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span className="ml-2 text-lg font-medium text-gray-900">{evaluation.score}%</span>
                  </div>
                )}

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700">Evaluation Categories</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {evaluation.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  {evaluation.status === 'completed' ? (
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200">
                      View Results
                    </button>
                  ) : (
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                      {evaluation.status === 'in_progress' ? 'Continue' : 'Start Evaluation'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {evaluations.length === 0 && (
          <div className="text-center py-12">
            <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No evaluations</h3>
            <p className="mt-1 text-sm text-gray-500">There are no evaluations scheduled at this time.</p>
          </div>
        )}

        {evaluations.some(evaluation => evaluation.status === 'pending') && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Pending Evaluations
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You have evaluations that need to be completed. Please review and complete them before their due dates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Evaluations;