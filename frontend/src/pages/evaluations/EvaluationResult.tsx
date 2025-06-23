import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Star, MessageSquare, User, Calendar } from 'lucide-react';
import { getEvaluationById } from '../../services/evaluationService';
import { Evaluation } from '../../types/evaluation';

const EvaluationResult: React.FC = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        if (id) {
          const response = await getEvaluationById(id);
          setEvaluation(response.data);
        }
      } catch (err) {
        setError('Failed to load evaluation results');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();
  }, [id]);

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;
  if (!evaluation) return <Layout><div>No evaluation found.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-green-600">
            <h3 className="text-lg leading-6 font-medium text-white">
              Evaluation Results
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-green-100">
              {evaluation.evaluationType} for {evaluation.employeeName}
            </p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-500 mr-2" />
                <span className="font-medium text-gray-700">Evaluator: {evaluation.supervisor?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-500 mr-2" />
                 <span className="font-medium text-gray-700">Reviewed By: {evaluation.reviewedBy || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <span className="font-medium text-gray-700">Completed On: {new Date(evaluation.completedAt || evaluation.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
  
            {evaluation.score && (
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <h4 className="text-sm font-medium text-blue-800">Overall Score</h4>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{evaluation.score}%</p>
                </div>
            )}
            
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h4>
              <div className="space-y-4">
                {evaluation.criteria.map((category) => (
                  <div key={category.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-800">
                        {category.criteria}
                      </p>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${star <= category.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                     {category.comments && (
                        <p className="mt-2 text-sm text-gray-600 pl-2 border-l-2 border-gray-200">{category.comments}</p>
                     )}
                  </div>
                ))}
              </div>
            </div>

            {evaluation.comments && (
                 <div>
                    <h4 className="text-lg font-medium text-gray-900">Supervisor's Final Comments</h4>
                    <div className="mt-2 p-3 bg-yellow-50 rounded-md">
                        <p className="text-sm text-gray-800">{evaluation.comments}</p>
                    </div>
                </div>
             )}

            {evaluation.employeeComment && (
                 <div>
                    <h4 className="text-lg font-medium text-gray-900">Your Comment</h4>
                    <div className="mt-2 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-gray-800">{evaluation.employeeComment}</p>
                    </div>
                </div>
             )}

            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                 <button
                    onClick={() => window.history.back()}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
                >
                    Back to Evaluations
                </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EvaluationResult; 