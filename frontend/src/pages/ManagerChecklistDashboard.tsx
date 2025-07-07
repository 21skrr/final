import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import checklistAssignmentService from '../services/checklistAssignmentService';
import { ChecklistAssignmentDetail } from '../types/checklist';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BarChart2, Users, TrendingUp, AlertCircle, Eye } from 'lucide-react';

const ManagerChecklistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ChecklistAssignmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        // Fetch department assignments for manager
        const data = await checklistAssignmentService.getDepartmentAssignments(user?.department || '');
        setAssignments(data || []);
        setError(null);
      } catch (err) {
        setError('Failed to load department assignments.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'manager' && user?.department) fetchAssignments();
  }, [user]);

  // Filter assignments
  const filteredAssignments = assignments.filter(a => {
    const employeeName = a.userId || '';
    const checklistTitle = a.checklist?.title || '';
    const matchesSearch = (
      employeeName.toLowerCase().includes(search.toLowerCase()) ||
      checklistTitle.toLowerCase().includes(search.toLowerCase())
    );
    const matchesStage = filterStage === 'all' || a.stage === filterStage;
    const matchesDepartment = filterDepartment === 'all' || a.department === filterDepartment;
    
    return matchesSearch && matchesStage && matchesDepartment;
  });

  // Calculate analytics
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const inProgressAssignments = assignments.filter(a => a.status === 'in_progress').length;
  const overdueAssignments = assignments.filter(a => a.status === 'overdue').length;
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  // Group by stage
  const assignmentsByStage = assignments.reduce((acc, assignment) => {
    const stage = assignment.stage || 'unknown';
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(assignment);
    return acc;
  }, {} as Record<string, ChecklistAssignmentDetail[]>);

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
            <h1 className="text-2xl font-bold text-gray-900">Department Checklists</h1>
            <p className="text-gray-600">Track department-wide progress and identify trends</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Department</p>
            <p className="text-lg font-semibold capitalize">{user?.department}</p>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{totalAssignments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressAssignments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{overdueAssignments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  setFilterStage('all');
                  setFilterDepartment('all');
                }}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Stage-wise Breakdown */}
        <div className="space-y-6">
          {Object.entries(assignmentsByStage).map(([stage, stageAssignments]) => (
            <div key={stage} className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 capitalize">
                  {stage === 'unknown' ? 'Unassigned Stage' : stage} Stage
                </h3>
                <p className="text-sm text-gray-600">
                  {stageAssignments.length} assignment{stageAssignments.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="p-6">
                {stageAssignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No assignments in this stage</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stageAssignments.map(a => (
                      <div key={a.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {a.checklist?.title || 'Untitled Checklist'}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            a.status === 'completed' ? 'bg-green-100 text-green-800' :
                            a.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            a.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {a.status}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Employee: {a.employeeName}</div>
                          <div>Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}</div>
                        </div>

                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${a.completionPercentage || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{a.completionPercentage || 0}% Complete</span>
                        </div>

                        <div className="mt-3">
                          <Link
                            to={`/manager/checklists/${a.id}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-500 flex items-center"
                          >
                            <Eye size={12} className="mr-1" />
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredAssignments.length === 0 && assignments.length > 0 && (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-500">No assignments match your current filters.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManagerChecklistDashboard; 