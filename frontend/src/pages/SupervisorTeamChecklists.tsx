import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import checklistAssignmentService from '../services/checklistAssignmentService';
import { ChecklistAssignmentDetail } from '../types/checklist';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Eye, Send } from 'lucide-react';

const SupervisorTeamChecklists: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ChecklistAssignmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage, setFilterStage] = useState('all');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        // Fetch team assignments for supervisor
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

  // Filter by employee name, checklist title, status, and stage
  const filteredAssignments = assignments.filter(a => {
    const employeeName = a.userId || '';
    const checklistTitle = a.checklist?.title || '';
    const matchesSearch = (
      employeeName.toLowerCase().includes(search.toLowerCase()) ||
      checklistTitle.toLowerCase().includes(search.toLowerCase())
    );
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesStage = filterStage === 'all' || a.stage === filterStage;
    
    return matchesSearch && matchesStatus && matchesStage;
  });

  const handleValidate = async (assignmentId: string, itemId: string, isValid: boolean) => {
    try {
      await checklistAssignmentService.verifyChecklistItem(itemId, {
        verificationStatus: isValid ? 'approved' : 'rejected',
        verificationNotes: isValid ? 'Approved by supervisor' : 'Rejected by supervisor'
      });
      // Refresh assignments
      const data = await checklistAssignmentService.getTeamAssignments(user?.teamId || '');
      setAssignments(data || []);
    } catch (err) {
      setError('Failed to validate item.');
    }
  };

  const handleSendReminder = async (assignmentId: string, itemId: string) => {
    try {
      await checklistAssignmentService.sendReminder(itemId, 'Reminder from supervisor');
      // Could refresh data or show success message
    } catch (err) {
      setError('Failed to send reminder.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Checklists</h1>
            <p className="text-gray-600">Monitor and validate your team's checklist progress</p>
          </div>
          <div className="flex items-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 flex flex-col items-center shadow-sm">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Total Assignments</span>
              <span className="text-3xl font-extrabold text-blue-700">{assignments.length}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee or checklist..."
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Stages</option>
                <option value="prepare">Prepare</option>
                <option value="orient">Orient</option>
                <option value="land">Land</option>
                <option value="integrate">Integrate</option>
                <option value="excel">Excel</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('');
                  setFilterStatus('all');
                  setFilterStage('all');
                }}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Assignments Grid */}
        {filteredAssignments.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-500">No checklist assignments found for your team.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map(a => (
              <div key={a.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-medium text-gray-900">{a.checklist?.title || 'Untitled Checklist'}</h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      a.status === 'completed' ? 'bg-green-100 text-green-800' :
                      a.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      a.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="font-medium">Employee:</span>
                      <span className="ml-2">{a.employeeName}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Stage:</span>
                      <span className="ml-2 capitalize">{a.stage || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Due:</span>
                      <span className="ml-2">
                        {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}
                      </span>
                    </div>
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

                  <div className="mt-4 flex justify-between items-center">
                    <Link
                      to={`/checklists/${a.id}/details`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center"
                    >
                      <Eye size={16} className="mr-1" />
                      View Details
                    </Link>
                    
                    {/* Supervisor actions */}
                    <div className="flex space-x-2">
                      {a.status === 'in_progress' && (
                        <button
                          onClick={() => handleSendReminder(a.id, '')}
                          className="p-1 text-yellow-600 hover:text-yellow-700"
                          title="Send Reminder"
                        >
                          <AlertCircle size={16} />
                        </button>
                      )}
                    </div>
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