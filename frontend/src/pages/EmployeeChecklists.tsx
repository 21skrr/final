import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import checklistAssignmentService from '../services/checklistAssignmentService';
import { ChecklistAssignmentDetail } from '../types/checklist';
import { Link } from 'react-router-dom';

const EmployeeChecklists: React.FC = () => {
  const [assignments, setAssignments] = useState<ChecklistAssignmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const data = await checklistAssignmentService.getMyAssignments();
        setAssignments(data || []);
        setError(null);
      } catch (err) {
        setError('Failed to load checklists.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Checklists</h1>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>
        ) : assignments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No checklists assigned.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map(a => (
              <div key={a.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900">{a.checklist?.title || 'Untitled Checklist'}</h2>
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

export default EmployeeChecklists; 