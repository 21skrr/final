import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvaluationById, editEvaluation } from '../../services/evaluationService';
import { Evaluation } from '../../types/evaluation';

const HREvaluationEdit: React.FC = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [title, setTitle] = useState('');
  const [criteria, setCriteria] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState('field');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        if (id) {
          const response = await getEvaluationById(id);
          setEvaluation(response.data);
          setTitle(response.data.title || '');
          setCriteria(response.data.criteria || []);
          setEmployeeId(response.data.employeeId);
          setType(response.data.type);
          setDate(response.data.date);
          setStatus(response.data.status || 'pending');
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

  const handleCriteriaChange = (idx: number, field: string, value: any) => {
    setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (id) {
        await editEvaluation(id, {
          title,
          employeeId,
          type,
          date,
          status,
          comments,
          criteria,
        });
        navigate('/admin/evaluations');
      }
    } catch (err) {
      setError('Failed to update evaluation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;
  if (!evaluation) return <Layout><div>No evaluation found.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-xl mx-auto mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Edit Evaluation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Employee ID</label>
            <input
              type="text"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Evaluation Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="field">Field</option>
              <option value="probation">Probation</option>
              <option value="periodic">Periodic</option>
              <option value="training">Training</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Comments</label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Criteria</label>
            <ul className="space-y-2">
              {criteria.length === 0 && <li className="text-gray-500 text-sm">No criteria.</li>}
              {criteria.map((c, idx) => (
                <li key={idx} className="flex flex-col gap-1 bg-gray-50 rounded p-2 text-sm">
                  <input
                    type="text"
                    value={c.name}
                    onChange={e => handleCriteriaChange(idx, 'name', e.target.value)}
                    className="border border-gray-300 rounded-md p-1 mb-1"
                    placeholder="Name"
                    required
                  />
                  <input
                    type="text"
                    value={c.description || ''}
                    onChange={e => handleCriteriaChange(idx, 'description', e.target.value)}
                    className="border border-gray-300 rounded-md p-1 mb-1"
                    placeholder="Description"
                  />
                  <input
                    type="number"
                    value={c.weight || 1}
                    min={1}
                    max={10}
                    onChange={e => handleCriteriaChange(idx, 'weight', Number(e.target.value))}
                    className="border border-gray-300 rounded-md p-1 mb-1 w-16"
                    placeholder="Weight"
                    required
                  />
                  <input
                    type="number"
                    value={c.rating || 0}
                    min={0}
                    max={5}
                    onChange={e => handleCriteriaChange(idx, 'rating', Number(e.target.value))}
                    className="border border-gray-300 rounded-md p-1 mb-1 w-16"
                    placeholder="Rating"
                  />
                  <input
                    type="text"
                    value={c.comments || ''}
                    onChange={e => handleCriteriaChange(idx, 'comments', e.target.value)}
                    className="border border-gray-300 rounded-md p-1"
                    placeholder="Comments"
                  />
                </li>
              ))}
            </ul>
          </div>
          {error && <div className="text-red-500">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default HREvaluationEdit; 