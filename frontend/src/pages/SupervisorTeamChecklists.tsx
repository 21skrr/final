import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import checklistAssignmentService from '../services/checklistAssignmentService';
import { ChecklistAssignmentDetail } from '../types/checklist';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const SupervisorTeamChecklists: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ChecklistAssignmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        // Assume user.teamId is available for supervisor
        const data = await checklistAssignmentService.getTeamAssignments(user?.teamId || '');
        setAssignments(data || []);
        setError(null);
      } catch (err) {
        setError('Failed to load team checklists.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'supervisor' && user?.teamId) fetchAssignments();
  }, [user]);

  // Filter by employee name or checklist title
  const filteredAssignments = assignments.filter(a => {
    const employeeName = a.userId || '';
    const checklistTitle = a.checklist?.title || '';
    return (
      employeeName.toLowerCase().includes(search.toLowerCase()) ||
      checklistTitle.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Checklist Progress</h1>
        <input
          type="text"
          placeholder="Search by employee or checklist..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
        />
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No team checklists found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map(a => (
              <div key={a.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900">{a.checklist?.title || 'Untitled Checklist'}</h2>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    Employee: {a.userId}
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${a.completionPercentage || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs ml-2">{a.completionPercentage || 0}% Complete</span>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/checklists/${a.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupervisorTeamChecklists; 