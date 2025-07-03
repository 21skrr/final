import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvaluationById, submitEvaluation } from '../../services/evaluationService';
import { Evaluation, EvaluationCriteria } from '../../types/evaluation';

const SupervisorEvaluationForm: React.FC = () => {
  const { evaluationId } = useParams();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        if (evaluationId) {
          const response = await getEvaluationById(evaluationId);
          setEvaluation(response.data);
          setCriteria(response.data.criteria || []);
        }
      } catch (err) {
        setError('Failed to load evaluation');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();
  }, [evaluationId]);

  const handleRatingChange = (idx: number, rating: number) => {
    setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, rating } : c));
  };

  const handleCommentChange = (idx: number, comments: string) => {
    setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, comments } : c));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Validation: all criteria must have rating and comments
    for (const c of criteria) {
      if (
        typeof c.rating !== 'number' ||
        c.rating < 1 ||
        c.rating > 5 ||
        !c.comments ||
        c.comments.trim() === ""
      ) {
        setError("All criteria must have a rating (1-5) and comments.");
        setSaving(false);
        return;
      }
    }

    try {
      if (evaluationId) {
        await submitEvaluation(evaluationId, {
          scores: criteria.map(c => ({ criteriaId: c.id, score: c.rating, comments: c.comments }))
        });
        setSuccess(true);
        setTimeout(() => navigate('/supervisor/evaluations'), 1500);
      }
    } catch (err: any) {
      setError(err?.response?.data?.errors?.[0]?.msg || 'Failed to submit evaluation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;
  if (!evaluation) return <Layout><div>No evaluation found.</div></Layout>;

  // If no criteria, show message and redirect option
  if (criteria.length === 0) {
    setTimeout(() => navigate(`/supervisor/evaluations/${evaluationId}/criteria`), 2000);
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-8 bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Complete Evaluation</h2>
          <p className="mb-4 text-gray-700">This evaluation has no criteria. Please add criteria before completing the evaluation.</p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => navigate(`/supervisor/evaluations/${evaluationId}/criteria`)}
          >
            Go to Add Criteria
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Complete Evaluation</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {criteria.map((criterion, idx) => (
            <div key={criterion.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">{criterion.name}</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      className={`h-6 w-6 rounded-full border ${star <= (criterion.rating || 0) ? 'bg-yellow-400' : 'bg-gray-200'}`}
                      onClick={() => handleRatingChange(idx, star)}
                    >{star}</button>
                  ))}
                </div>
              </div>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2"
                rows={2}
                placeholder="Comments (required)"
                value={criterion.comments || ''}
                onChange={e => handleCommentChange(idx, e.target.value)}
                required
              />
            </div>
          ))}
          {error && <div className="text-red-500">{error}</div>}
          {success && <div className="text-green-600">Evaluation submitted!</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default SupervisorEvaluationForm; 