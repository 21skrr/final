import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { getEvaluationById, updateEvaluationCriteria, submitEvaluation } from '../../services/evaluationService';
import { useAuth } from '../../context/AuthContext';

const ManagerEvaluationDetail: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [criteriaEdits, setCriteriaEdits] = useState<any[]>([]);
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        if (id) {
          const response = await getEvaluationById(id);
          setEvaluation(response.data);
          setCriteriaEdits(response.data.criteria.map((c: any) => ({ ...c })));
          setComments(response.data.comments || '');
        }
      } catch (err) {
        setError('Failed to load evaluation');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();
  }, [id]);

  const isEvaluator = user?.id && evaluation?.supervisorId === user.id;
  const isEditable = isEvaluator && evaluation?.status !== 'completed' && evaluation?.status !== 'validated';

  const handleCriteriaChange = (idx: number, field: string, value: any) => {
    const updated = [...criteriaEdits];
    updated[idx][field] = value;
    setCriteriaEdits(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Update each criterion
      for (const c of criteriaEdits) {
        await updateEvaluationCriteria(c.id, { rating: c.rating, comments: c.comments });
      }
      // Submit evaluation as completed
      await submitEvaluation(evaluation.id, { comments, status: 'completed' });
      setSaveSuccess(true);
    } catch (err) {
      setError('Failed to submit evaluation');
    } finally {
      setSaving(false);
    }
  };

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
        </div>
        <form onSubmit={handleSubmit}>
          {criteriaEdits && criteriaEdits.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Criteria</h3>
              <ul className="list-disc ml-6">
                {criteriaEdits.map((c, idx) => (
                  <li key={c.id} className="mb-2">
                    <div><strong>{c.category || c.name}:</strong></div>
                    <div className="flex items-center gap-2">
                      <label>Rating:</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={c.rating}
                        onChange={e => handleCriteriaChange(idx, 'rating', Number(e.target.value))}
                        disabled={!isEditable}
                        className="w-16 border rounded px-2 py-1"
                      />
                      <label>Comments:</label>
                      <input
                        type="text"
                        value={c.comments || ''}
                        onChange={e => handleCriteriaChange(idx, 'comments', e.target.value)}
                        disabled={!isEditable}
                        className="border rounded px-2 py-1 flex-1"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Overall Comments</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={comments}
              onChange={e => setComments(e.target.value)}
              disabled={!isEditable}
              rows={3}
            />
          </div>
          {isEditable && (
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? 'Submitting...' : 'Submit & Complete Evaluation'}
            </button>
          )}
          {saveSuccess && <div className="text-green-600 mt-2">Evaluation submitted and completed!</div>}
        </form>
      </div>
    </Layout>
  );
};

export default ManagerEvaluationDetail; 