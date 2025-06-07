import React from 'react';
import Layout from '../components/layout/Layout';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const FormsAndSurveys: React.FC = () => {
  const forms = [
    {
      id: '1',
      title: '3-Month Experience Survey',
      description: 'Share your feedback about your onboarding experience',
      dueDate: '2024-03-20',
      status: 'pending',
      type: 'survey',
      completion: 0,
    },
    {
      id: '2',
      title: 'Personal Information Update',
      description: 'Update your personal and emergency contact information',
      dueDate: '2024-03-15',
      status: 'in_progress',
      type: 'form',
      completion: 60,
    },
    {
      id: '3',
      title: 'Training Feedback',
      description: 'Provide feedback on your recent training sessions',
      dueDate: '2024-03-25',
      status: 'completed',
      type: 'survey',
      completion: 100,
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
            <h1 className="text-2xl font-bold text-gray-900">Forms & Surveys</h1>
            <p className="mt-1 text-sm text-gray-500">
              Complete required forms and provide valuable feedback
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {forms.map((form) => (
            <div key={form.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`rounded-full p-2 ${
                      form.type === 'survey' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      <FileText className={`h-5 w-5 ${
                        form.type === 'survey' ? 'text-purple-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-medium text-gray-900">{form.title}</h2>
                      <p className="text-sm text-gray-500">{form.description}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(form.status)}`}>
                    {form.status.replace('_', ' ').charAt(0).toUpperCase() + form.status.slice(1)}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      Due: {form.dueDate}
                    </div>
                    <span className="font-medium">{form.completion}% Complete</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${form.completion}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  {form.status === 'completed' ? (
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completed
                    </button>
                  ) : (
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                      {form.status === 'in_progress' ? 'Continue' : 'Start'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {forms.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No forms or surveys</h3>
            <p className="mt-1 text-sm text-gray-500">There are no forms or surveys assigned to you at this time.</p>
          </div>
        )}

        {forms.some(form => form.status === 'pending') && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Pending Forms
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You have forms or surveys that need to be completed. Please review and submit them before their due dates.
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

export default FormsAndSurveys;