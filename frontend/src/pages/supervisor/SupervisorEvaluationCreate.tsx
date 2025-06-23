import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { createEvaluation } from '../../services/evaluationService';
import { useNavigate } from 'react-router-dom';

const SupervisorEvaluationCreate: React.FC = () => {
  const [title, setTitle] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState('field');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [criteria, setCriteria] = useState<any[]>([]);
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [supervisorComments, setSupervisorComments] = useState('');
  const [developmentRecommendations, setDevelopmentRecommendations] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createEvaluation({
        title,
        employeeId,
        type,
        date: sessionDate,
        time: sessionTime,
        criteria,
        supervisorComments,
        developmentRecommendations,
        templateId: selectedTemplateId,
      });
      navigate('/supervisor/evaluations');
    } catch (err) {
      setError('Failed to create evaluation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Create New Evaluation</h2>
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
            <label className="block text-sm font-medium text-gray-700">Session Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Session Time</label>
            <input
              type="time"
              value={sessionTime}
              onChange={e => setSessionTime(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Criteria</label>
            <ul className="space-y-2">
              {criteria.length === 0 && <li className="text-gray-500 text-sm">No criteria selected.</li>}
              {criteria.map((c: any, idx: number) => (
                <li key={idx} className="bg-gray-50 rounded p-2 text-sm">{c.name || c.title}</li>
              ))}
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Supervisor Comments</label>
            <textarea
              value={supervisorComments}
              onChange={e => setSupervisorComments(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Development Recommendations</label>
            <textarea
              value={developmentRecommendations}
              onChange={e => setDevelopmentRecommendations(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              rows={3}
            />
          </div>
          {error && <div className="text-red-500">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Evaluation'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default SupervisorEvaluationCreate; 