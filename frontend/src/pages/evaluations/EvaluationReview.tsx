import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Star, Save, MessageSquare } from 'lucide-react';

const EvaluationReview: React.FC = () => {
  const { id } = useParams();

  // Mock evaluation data
  const evaluation = {
    employeeName: 'John Employee',
    position: 'Marketing Analyst',
    evaluationType: '3-Month Review',
    date: '2024-03-15',
    categories: [
      { name: 'Job Knowledge', score: 4 },
      { name: 'Communication', score: 4 },
      { name: 'Initiative', score: 3 },
      { name: 'Teamwork', score: 5 },
    ],
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-blue-600">
            <h3 className="text-lg leading-6 font-medium text-white">
              Evaluation Review
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-blue-100">
              {evaluation.evaluationType} for {evaluation.employeeName}
            </p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Performance Categories</h3>
                  <div className="mt-4 space-y-4">
                    {evaluation.categories.map((category) => (
                      <div key={category.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-medium text-gray-700">
                            {category.name}
                          </label>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-5 w-5 ${
                                  star <= category.score
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          defaultValue={category.score}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Comments
                  </label>
                  <div className="mt-1">
                    <textarea
                      rows={4}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Add your feedback here..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Development Goals
                  </label>
                  <div className="mt-1">
                    <textarea
                      rows={3}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Set development goals..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
            <button
              type="button"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Request Changes
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Evaluation
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EvaluationReview;