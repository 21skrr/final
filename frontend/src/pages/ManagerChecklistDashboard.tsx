import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import checklistAssignmentService from '../services/checklistAssignmentService';
import { ChecklistAssignmentDetail } from '../types/checklist';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ManagerChecklistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ChecklistAssignmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  // Mock filter options (replace with real data if available)
  const [team, setTeam] = useState('');
  const [department, setDepartment] = useState('');
  const [checklist, setChecklist] = useState('');
  const teamOptions = ['Team A', 'Team B', 'Team C'];
  const departmentOptions = ['HR', 'IT', 'Finance', 'Sales'];

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        // For now, fetch all user assignments (replace with org-wide endpoint if available)
        const data = await checklistAssignmentService.getUserAssignments(user?.id || '');
        setAssignments(data || []);
        setError(null);
      } catch (err) {
        setError('Failed to load assignments.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'manager') fetchAssignments();
  }, [user]);

  // Filter logic (mock, adjust as needed)
  const filteredAssignments = assignments.filter(a => {
    const employeeName = a.userId || '';
    const checklistTitle = a.checklist?.title || '';
    const matchesTeam = team ? employeeName.toLowerCase().includes(team.toLowerCase()) : true;
    const matchesDepartment = department ? employeeName.toLowerCase().includes(department.toLowerCase()) : true;
    const matchesChecklist = checklist ? checklistTitle.toLowerCase().includes(checklist.toLowerCase()) : true;
    const matchesSearch = search ? (
      employeeName.toLowerCase().includes(search.toLowerCase()) ||
      checklistTitle.toLowerCase().includes(search.toLowerCase())
    ) : true;
    return matchesTeam && matchesDepartment && matchesChecklist && matchesSearch;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Manager Checklist Dashboard</h1>
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by employee or checklist..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <select value={team} onChange={e => setTeam(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Teams</option>
            {teamOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={department} onChange={e => setDepartment(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Departments</option>
            {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <input
            type="text"
            placeholder="Checklist title..."
            value={checklist}
            onChange={e => setChecklist(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No assignments found.</div>
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map(a => (
                  <tr key={a.id}>
                    <td className="px-4 py-2">{a.userId}</td>
                    <td className="px-4 py-2">{a.checklist?.title || ''}</td>
                    <td className="px-4 py-2">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : ''}</td>
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
                    <td className="px-4 py-2">
                      <Link
                        to={`/manager/checklists/${a.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManagerChecklistDashboard; 