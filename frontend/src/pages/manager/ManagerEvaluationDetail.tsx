import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { getEvaluationById } from '../../services/evaluationService';

const ManagerEvaluationDetail: React.FC = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState<any>(null);
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
        setError('Failed to load evaluation');
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
      <div className="max-w-2xl mx-auto mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Evaluation Details</h2>
        <div className="mb-4">
          <div><strong>Employee:</strong> {evaluation.employee?.name || evaluation.employeeId}</div>
          <div><strong>Type:</strong> {evaluation.type}</div>
          <div><strong>Status:</strong> {evaluation.status}</div>
          <div><strong>Date:</strong> {evaluation.dueDate ? new Date(evaluation.dueDate).toLocaleDateString() : ''}</div>
          <div><strong>Comments:</strong> {evaluation.comments}</div>
        </div>
        {evaluation.criteria && evaluation.criteria.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Criteria</h3>
            <ul className="list-disc ml-6">
              {evaluation.criteria.map((c: any, idx: number) => (
                <li key={idx}>
                  <strong>{c.category} - {c.criteria}:</strong> {c.rating} ({c.comments})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManagerEvaluationDetail; 