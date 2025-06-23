import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import checklistAssignmentService from '../services/checklistAssignmentService';
import { ChecklistAssignmentDetail } from '../types/checklist';

const HRChecklistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ChecklistAssignmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        // This should be replaced with an endpoint that fetches all assignments for HR
        // For now, we use getUserAssignments for the current user as a placeholder
        // You may need to implement checklistAssignmentService.getAllAssignments()
        const allAssignments = await checklistAssignmentService.getAllAssignments?.();
        setAssignments(allAssignments || []);
        setError(null);
      } catch (err) {
        setError('Failed to load assignments.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'hr') fetchAssignments();
  }, [user]);

  // Filter assignments by search (user name, checklist title, etc.)
  const filteredAssignments = assignments.filter(a => {
    const userName = a.userId || '';
    const checklistTitle = a.checklist?.title || '';
    return (
      userName.toLowerCase().includes(search.toLowerCase()) ||
      checklistTitle.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Checklist Progress Dashboard</h1>
          <input
            type="text"
            placeholder="Search by user or checklist..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Checklist</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map(a => (
                  <tr key={a.id}>
                    <td className="px-4 py-2">{a.userId}</td>
                    <td className="px-4 py-2">{a.checklist?.title || 'N/A'}</td>
                    <td className="px-4 py-2">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${a.completionPercentage || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs ml-2">{a.completionPercentage || 0}%</span>
                    </td>
                    <td className="px-4 py-2">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAssignments.length === 0 && (
              <div className="text-center text-gray-500 py-8">No assignments found.</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HRChecklistDashboard; 