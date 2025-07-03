import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { getSupervisorEvaluations, submitEvaluation } from '../../services/evaluationService';
import { Evaluation } from '../../types/evaluation';
import { ClipboardCheck, Star, PlusCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const SupervisorEvaluations: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const response = await getSupervisorEvaluations();
        setEvaluations(response.data || []);
      } catch (err) {
        setError('Failed to load evaluations');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, []);

  const handleSubmit = async (id: string) => {
    try {
      await submitEvaluation(id, {});
      // Refresh evaluations
      const response = await getSupervisorEvaluations();
      setEvaluations(response.data || []);
    } catch (err) {
      alert('Failed to submit evaluation');
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Team's Evaluations</h1>
          <Link to="/supervisor/evaluations/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <PlusCircle className="h-5 w-5 mr-2" /> New Evaluation
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {evaluations.map((evaluation) => (
            <div key={evaluation.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{evaluation.type} Evaluation</h2>
                  <p className="text-sm text-gray-500">Employee: {evaluation.employeeId}</p>
                  <p className="text-sm text-gray-500">Status: {evaluation.status}</p>
                  <p className="text-sm text-gray-500">Date: {evaluation.date}</p>
                  {evaluation.score && (
                    <div className="mt-2 flex items-center">
                      <Star className="h-5 w-5 text-yellow-400" />
                      <span className="ml-2 text-lg font-medium text-gray-900">{evaluation.score}%</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 md:mt-0 flex gap-2">
                  <Link to={`/supervisor/evaluations/${evaluation.id}/form`} className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">View</Link>
                  <Link to={`/supervisor/evaluations/${evaluation.id}/criteria`} className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Add Criteria</Link>
                  {evaluation.status !== 'completed' && (
                    <Link to={`/supervisor/evaluations/${evaluation.id}/form`} className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                      <Send className="h-4 w-4 mr-1" /> Submit
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {evaluations.length === 0 && (
          <div className="text-center py-12">
            <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No evaluations found</h3>
            <p className="mt-1 text-sm text-gray-500">You have not created any evaluations for your team yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupervisorEvaluations; 