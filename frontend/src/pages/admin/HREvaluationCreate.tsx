import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { createEvaluation } from '../../services/evaluationService';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';

const HREvaluationCreate: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState('field');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [title, setTitle] = useState('');
  const [criteria, setCriteria] = useState([{ name: '', category: '', rating: null }]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await userService.getEmployees();
        setEmployees(data);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchEmployees();
  }, []);

  const mapType = (type: string) => {
    switch (type) {
      case "probation":
        return "3-month";
      case "periodic":
      case "field":
        return "performance";
      default:
        return type;
    }
  };

  const handleCriteriaChange = (idx: number, field: string, value: any) => {
    setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value === '' ? null : value } : c));
  };

  const addCriteria = () => {
    setCriteria(prev => [...prev, { name: '', category: '', rating: null }]);
  };

  const removeCriteria = (idx: number) => {
    setCriteria(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await createEvaluation({
        employeeId,
        type: mapType(type),
        dueDate: date,
        status: 'draft',
        title: title || 'Evaluation',
        criteria: criteria.map(c => ({ name: c.name, category: c.category, rating: c.rating })),
      });
      setSuccess(true);
      setTimeout(() => navigate('/admin/evaluations'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.errors?.[0]?.msg || 'Failed to create evaluation');
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
            <label className="block text-sm font-medium text-gray-700">Employee</label>
            <select
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Evaluation Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="3-month">3-Month</option>
              <option value="6-month">6-Month</option>
              <option value="12-month">12-Month</option>
              <option value="training">Training</option>
              <option value="general">General</option>
              <option value="performance">Performance</option>
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
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Evaluation Title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Criteria</label>
            {criteria.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={c.name}
                  onChange={e => handleCriteriaChange(idx, 'name', e.target.value)}
                  className="border border-gray-300 rounded-md p-2 flex-1"
                  placeholder="Criteria Name"
                  required
                />
                <select
                  value={c.category || ''}
                  onChange={e => handleCriteriaChange(idx, 'category', e.target.value)}
                  className="border border-gray-300 rounded-md p-2 w-32"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Professionalism">Professionalism</option>
                  <option value="Skills">Skills</option>
                  <option value="Performance">Performance</option>
                  <option value="Teamwork">Teamwork</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={c.rating ?? ''}
                  onChange={e => handleCriteriaChange(idx, 'rating', e.target.value === '' ? null : Number(e.target.value))}
                  className="border border-gray-300 rounded-md p-2 w-20"
                  placeholder="Rating (opt)"
                />
                {criteria.length > 1 && (
                  <button type="button" onClick={() => removeCriteria(idx)} className="text-red-500 font-bold">&times;</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addCriteria} className="text-blue-600 hover:underline mt-1">+ Add Criteria</button>
          </div>
          {error && <div className="text-red-500">{error}</div>}
          {success && <div className="text-green-600">Evaluation created successfully!</div>}
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

export default HREvaluationCreate; 