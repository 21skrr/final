import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useParams } from 'react-router-dom';
import { getEvaluationById, getEvaluationCriteria, addEvaluationCriteria, updateEvaluationCriteria } from '../../services/evaluationService';
import { EvaluationCriteria } from '../../types/evaluation';

const SupervisorEvaluationCriteria: React.FC = () => {
  const { evaluationId } = useParams();
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [newCriterion, setNewCriterion] = useState({ category: '', name: '', rating: 3, comments: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        if (evaluationId) {
          const response = await getEvaluationCriteria(evaluationId);
          setCriteria(response.data || []);
        }
      } catch (err) {
        setError('Failed to load criteria');
      } finally {
        setLoading(false);
      }
    };
    fetchCriteria();
  }, [evaluationId]);

  const handleAddCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (evaluationId) {
        await addEvaluationCriteria(evaluationId, newCriterion);
        const response = await getEvaluationCriteria(evaluationId);
        setCriteria(response.data || []);
        setNewCriterion({ category: '', name: '', rating: 3, comments: '' });
      }
    } catch (err) {
      setError('Failed to add criterion');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCriterion = async (id: string, updated: Partial<EvaluationCriteria>) => {
    setSaving(true);
    try {
      // Find the full criterion object
      const fullCriterion = criteria.find(c => c.id === id);
      if (!fullCriterion) throw new Error('Criterion not found');

      // Merge the update with the full object, and map 'name' to 'criteria'
      const payload = {
        category: updated.category ?? fullCriterion.category,
        criteria: updated.criteria ?? updated.name ?? fullCriterion.criteria ?? fullCriterion.name,
        rating: updated.rating ?? fullCriterion.rating,
        comments: updated.comments ?? fullCriterion.comments,
      };

      await updateEvaluationCriteria(id, payload);
      if (evaluationId) {
        const response = await getEvaluationCriteria(evaluationId);
        setCriteria(response.data || []);
      }
    } catch (err) {
      setError('Failed to update criterion');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Manage Evaluation Criteria</h2>
        <form onSubmit={handleAddCriterion} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={newCriterion.category}
              onChange={e => setNewCriterion({ ...newCriterion, category: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Criterion Name</label>
            <input
              type="text"
              value={newCriterion.name}
              onChange={e => setNewCriterion({ ...newCriterion, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rating</label>
            <input
              type="number"
              min={1}
              max={5}
              value={newCriterion.rating}
              onChange={e => setNewCriterion({ ...newCriterion, rating: Number(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Comments</label>
            <input
              type="text"
              value={newCriterion.comments}
              onChange={e => setNewCriterion({ ...newCriterion, comments: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? 'Adding...' : 'Add Criterion'}
          </button>
        </form>
        <h3 className="text-lg font-semibold mb-2">Current Criteria</h3>
        <ul className="divide-y divide-gray-200">
          {criteria.map(criterion => (
            <li key={criterion.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-medium text-gray-900">{criterion.name}</div>
                <div className="text-sm text-gray-500">Rating: {criterion.rating}</div>
                <div className="text-sm text-gray-500">Comments: {criterion.comments}</div>
              </div>
              <div className="mt-2 md:mt-0 flex gap-2">
                <button
                  className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  onClick={() => handleUpdateCriterion(criterion.id, { rating: criterion.rating + 1 })}
                  disabled={saving}
                >
                  +1 Rating
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default SupervisorEvaluationCriteria; 