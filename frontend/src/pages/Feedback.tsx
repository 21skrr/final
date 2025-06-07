import React from 'react';
import Layout from '../components/layout/Layout';
import { MessageSquare, ThumbsUp, Flag, Send } from 'lucide-react';

const Feedback: React.FC = () => {
  const feedbackItems = [
    {
      id: '1',
      type: 'received',
      from: 'Sarah Manager',
      date: '2024-03-10',
      message: 'Great progress on the onboarding tasks. Keep up the good work!',
      category: 'performance',
    },
    {
      id: '2',
      type: 'sent',
      to: 'HR Department',
      date: '2024-03-08',
      message: 'The orientation session was very informative and well-organized.',
      category: 'training',
    },
    {
      id: '3',
      type: 'received',
      from: 'John Supervisor',
      date: '2024-03-05',
      message: 'Showing great initiative in team meetings and collaborations.',
      category: 'collaboration',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
            <p className="mt-1 text-sm text-gray-500">
              Share and receive feedback about your onboarding experience
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <MessageSquare className="h-5 w-5 mr-2" />
            Give Feedback
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 bg-blue-600 text-white">
              <h2 className="text-lg font-medium">New Feedback</h2>
            </div>
            <div className="p-6">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Recipient
                  </label>
                  <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>Select recipient</option>
                    <option>HR Department</option>
                    <option>Direct Supervisor</option>
                    <option>Training Team</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>Select category</option>
                    <option>Onboarding Process</option>
                    <option>Training</option>
                    <option>Support</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Share your feedback..."
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Feedback
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-800 text-white">
              <h2 className="text-lg font-medium">Recent Feedback</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {feedbackItems.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 rounded-full p-2 ${
                      item.type === 'received' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {item.type === 'received' ? (
                        <ThumbsUp className={`h-5 w-5 ${
                          item.type === 'received' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      ) : (
                        <Flag className={`h-5 w-5 ${
                          item.type === 'received' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">
                          {item.type === 'received' ? `From: ${item.from}` : `To: ${item.to}`}
                        </h3>
                        <span className="ml-2 text-xs text-gray-500">{item.date}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                      <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {feedbackItems.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback</h3>
            <p className="mt-1 text-sm text-gray-500">Start by giving or requesting feedback.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Feedback;