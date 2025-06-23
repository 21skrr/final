import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { getAllEvaluations, deleteEvaluation, validateEvaluation } from '../../services/evaluationService';
import { Evaluation } from '../../types/evaluation';
import { ClipboardCheck, Star, Edit, Trash2, CheckCircle, PlusCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const HREvaluations: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const response = await getAllEvaluations();
        setEvaluations(response.data || []);
      } catch (err) {
        setError('Failed to load evaluations');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this evaluation?')) return;
    setDeleting(id);
    try {
      await deleteEvaluation(id);
      const response = await getAllEvaluations();
      setEvaluations(response.data || []);
    } catch (err) {
      alert('Failed to delete evaluation');
    } finally {
      setDeleting(null);
    }
  };

  const handleValidate = async (id: string) => {
    setValidating(id);
    try {
      await validateEvaluation(id, { reviewNotes: 'Validated by HR', status: 'completed' });
      const response = await getAllEvaluations();
      setEvaluations(response.data || []);
    } catch (err) {
      alert('Failed to validate evaluation');
    } finally {
      setValidating(null);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">All Evaluations (HR)</h1>
          <Link to="/admin/evaluations/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
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
                <div className="mt-4 md:mt-0 flex gap-2 flex-wrap">
                  <Link to={`/evaluations/${evaluation.id}`} className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">View</Link>
                  <Link to={`/admin/evaluations/${evaluation.id}/edit`} className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"><Edit className="h-4 w-4 mr-1" /> Edit</Link>
                  <Link to={`/admin/evaluations/${evaluation.id}/criteria`} className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Criteria</Link>
                  <button
                    className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() => handleDelete(evaluation.id)}
                    disabled={deleting === evaluation.id}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {deleting === evaluation.id ? 'Deleting...' : 'Delete'}
                  </button>
                  {evaluation.status !== 'validated' && (
                    <button
                      className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      onClick={() => handleValidate(evaluation.id)}
                      disabled={validating === evaluation.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {validating === evaluation.id ? 'Validating...' : 'Validate'}
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No evaluations found</h3>
            <p className="mt-1 text-sm text-gray-500">No evaluations are available at this time.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HREvaluations; 