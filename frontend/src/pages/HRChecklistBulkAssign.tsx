import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import checklistService from '../services/checklistService';
import api from '../services/api';

const HRChecklistBulkAssign: React.FC = () => {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState('');
  const [userIds, setUserIds] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        const data = await checklistService.getChecklists();
        setChecklists(data);
      } catch (err) {
        setChecklists([]);
      }
    };
    fetchChecklists();
  }, []);

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const userIdList = userIds.split(',').map(s => s.trim()).filter(Boolean);
      await api.post('/user-checklists', {
        userIds: userIdList,
        checklistId: selectedChecklist,
        dueDate: dueDate || undefined,
      });
      setSuccess('Checklist assigned to users!');
      setUserIds('');
      setSelectedChecklist('');
      setDueDate('');
    } catch (err) {
      setError('Failed to assign checklist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Assign Checklist</h1>
        <form onSubmit={handleBulkAssign} className="space-y-4 bg-white shadow rounded-lg p-6 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">Checklist</label>
            <select value={selectedChecklist} onChange={e => setSelectedChecklist(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
              <option value="">Select a checklist</option>
              {checklists.map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">User IDs (comma separated)</label>
            <input type="text" value={userIds} onChange={e => setUserIds(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
          </div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Assigning...' : 'Assign Checklist'}</button>
          {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </form>
      </div>
    </Layout>
  );
};

export default HRChecklistBulkAssign; 