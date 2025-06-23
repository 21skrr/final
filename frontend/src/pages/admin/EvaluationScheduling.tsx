import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';

const EvaluationScheduling: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    templateId: '',
    department: '',
    role: '',
    frequency: '1_month',
    startDate: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchScheduled();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await evaluationTemplateService.getTemplates();
      setTemplates(data || []);
    } catch {
      setError('Failed to load templates');
    }
  };

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      // Replace with real API call
      setScheduled([]);
    } catch {
      setError('Failed to load scheduled evaluations');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Replace with real API call to schedule evaluation
      setScheduled(prev => [
        ...prev,
        { ...form, id: Math.random().toString(36).slice(2), template: templates.find(t => t.id === form.templateId) }
      ]);
      setForm({ templateId: '', department: '', role: '', frequency: '1_month', startDate: '' });
    } catch {
      setError('Failed to schedule evaluation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Schedule Recurring Evaluations</h2>
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700">Evaluation Template</label>
            <select
              value={form.templateId}
              onChange={e => handleFormChange('templateId', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">Select template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              value={form.department}
              onChange={e => handleFormChange('department', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="e.g. Sales, HR, Engineering"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <input
              type="text"
              value={form.role}
              onChange={e => handleFormChange('role', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="e.g. employee, supervisor"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Frequency</label>
            <select
              value={form.frequency}
              onChange={e => handleFormChange('frequency', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="1_month">After 1 Month</option>
              <option value="3_months">After 3 Months</option>
              <option value="6_months">After 6 Months</option>
              <option value="12_months">After 12 Months</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => handleFormChange('startDate', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? 'Scheduling...' : 'Schedule Evaluation'}
          </button>
        </form>
        <h3 className="text-lg font-semibold mb-2">Scheduled Evaluations</h3>
        {loading ? <div>Loading...</div> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              </tr>
            </thead>
            <tbody>
              {scheduled.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-4 py-2">{item.template?.title || '-'}</td>
                  <td className="px-4 py-2">{item.department}</td>
                  <td className="px-4 py-2">{item.role}</td>
                  <td className="px-4 py-2">{item.frequency.replace('_', ' ')}</td>
                  <td className="px-4 py-2">{item.startDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default EvaluationScheduling; 