import React from 'react';
import Layout from '../components/layout/Layout';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';

const Checklists: React.FC = () => {
  const checklists = [
    {
      id: '1',
      title: 'Onboarding Documentation',
      dueDate: '2024-03-20',
      progress: 75,
      tasks: [
        { id: '1-1', title: 'Submit identification documents', completed: true },
        { id: '1-2', title: 'Complete tax forms', completed: true },
        { id: '1-3', title: 'Sign employee handbook', completed: true },
        { id: '1-4', title: 'Set up direct deposit', completed: false },
      ],
    },
    {
      id: '2',
      title: 'IT Setup',
      dueDate: '2024-03-15',
      progress: 50,
      tasks: [
        { id: '2-1', title: 'Set up company email', completed: true },
        { id: '2-2', title: 'Configure laptop', completed: true },
        { id: '2-3', title: 'Access required software', completed: false },
        { id: '2-4', title: 'Complete security training', completed: false },
      ],
    },
    {
      id: '3',
      title: 'Training Requirements',
      dueDate: '2024-03-25',
      progress: 25,
      tasks: [
        { id: '3-1', title: 'Complete compliance training', completed: true },
        { id: '3-2', title: 'Review company policies', completed: false },
        { id: '3-3', title: 'Complete department orientation', completed: false },
        { id: '3-4', title: 'Schedule mentor meeting', completed: false },
      ],
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Checklists</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and manage your onboarding tasks and requirements
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Create Checklist
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {checklists.map((checklist) => (
            <div key={checklist.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{checklist.title}</h2>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      Due: {checklist.dueDate}
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {checklist.progress}% Complete
                  </span>
                </div>

                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${checklist.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {checklist.tasks.map((task) => (
                    <div key={task.id} className="flex items-start">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <span className={`text-sm ${
                          task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {checklists.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No checklists</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new checklist.</p>
            <div className="mt-6">
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                Create Checklist
              </button>
            </div>
          </div>
        )}

        {checklists.some(checklist => checklist.progress < 100) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Attention needed
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You have incomplete tasks that require your attention. Please review and complete them before their due dates.
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

export default Checklists;