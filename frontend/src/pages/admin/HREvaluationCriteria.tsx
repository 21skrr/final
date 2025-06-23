import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useParams } from 'react-router-dom';
import { getEvaluationCriteria, addEvaluationCriteria, deleteEvaluationCriteria } from '../../services/evaluationService';
import { EvaluationCriteria } from '../../types/evaluation';

const HREvaluationCriteria: React.FC = () => {
  const { id } = useParams();
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [newCriterion, setNewCriterion] = useState({ category: '', name: '', rating: 3, comments: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        if (id) {
          const response = await getEvaluationCriteria(id);
          setCriteria(response.data || []);
        }
      } catch (err) {
        setError('Failed to load criteria');
      } finally {
        setLoading(false);
      }
    };
    fetchCriteria();
  }, [id]);

  const handleAddCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (id) {
        await addEvaluationCriteria(id, newCriterion);
        const response = await getEvaluationCriteria(id);
        setCriteria(response.data || []);
        setNewCriterion({ category: '', name: '', rating: 3, comments: '' });
      }
    } catch (err) {
      setError('Failed to add criterion');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCriterion = async (criterionId: string) => {
    setDeleting(criterionId);
    try {
      await deleteEvaluationCriteria(criterionId);
      if (id) {
        const response = await getEvaluationCriteria(id);
        setCriteria(response.data || []);
      }
    } catch (err) {
      setError('Failed to delete criterion');
    } finally {
      setDeleting(null);
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
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  onClick={() => handleDeleteCriterion(criterion.id)}
                  disabled={deleting === criterion.id}
                >
                  {deleting === criterion.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default HREvaluationCriteria; 