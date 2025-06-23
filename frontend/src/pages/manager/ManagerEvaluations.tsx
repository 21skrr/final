import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { getManagerEvaluations, validateEvaluation } from '../../services/evaluationService';
import { Evaluation } from '../../types/evaluation';
import { ClipboardCheck, Star, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ManagerEvaluations: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);
  const [requestingChange, setRequestingChange] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const response = await getManagerEvaluations();
        setEvaluations(response.data || []);
      } catch (err) {
        setError('Failed to load evaluations');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, []);

  const handleValidate = async (id: string) => {
    setValidating(id);
    try {
      await validateEvaluation(id, { reviewNotes: 'Approved by manager', status: 'completed' });
      const response = await getManagerEvaluations();
      setEvaluations(response.data || []);
      toast.success('Evaluation validated successfully');
    } catch (err) {
      toast.error('Failed to validate evaluation');
    } finally {
      setValidating(null);
    }
  };

  const handleRequestChanges = async (id: string) => {
    const comment = window.prompt('Enter your requested changes or feedback:');
    if (!comment) return;
    setRequestingChange(id);
    try {
      await validateEvaluation(id, { status: 'pending', reviewComments: comment });
      const response = await getManagerEvaluations();
      setEvaluations(response.data || []);
      toast.success('Requested changes successfully');
    } catch (err) {
      toast.error('Failed to request changes');
    } finally {
      setRequestingChange(null);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Evaluations</h1>
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
                  <Link to={`/manager/evaluations/${evaluation.id}`} className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">View</Link>
                  {evaluation.status !== 'validated' && (
                    <>
                      <button
                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={() => handleValidate(evaluation.id)}
                        disabled={validating === evaluation.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {validating === evaluation.id ? 'Validating...' : 'Validate'}
                      </button>
                      <button
                        className="inline-flex items-center px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        onClick={() => handleRequestChanges(evaluation.id)}
                        disabled={requestingChange === evaluation.id}
                      >
                        Request Changes
                      </button>
                    </>
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
            <p className="mt-1 text-sm text-gray-500">No evaluations are available for your teams at this time.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManagerEvaluations; 