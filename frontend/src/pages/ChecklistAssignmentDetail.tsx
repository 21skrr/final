import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import checklistAssignmentService from '../services/checklistAssignmentService';
import { ChecklistAssignmentDetail, ChecklistItem } from '../types/checklist';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const ChecklistAssignmentDetailPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<ChecklistAssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [itemId: string]: string }>({});
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const data = await checklistAssignmentService.getAssignmentById(assignmentId || '');
        setAssignment(data);
        setError(null);
      } catch (err) {
        setError('Checklist assignment not found.');
      } finally {
        setLoading(false);
      }
    };
    if (assignmentId) fetchAssignment();
  }, [assignmentId]);

  const handleMarkComplete = async (itemId: string) => {
    try {
      setUpdatingItemId(itemId);
      await checklistAssignmentService.markItemComplete(itemId, notes[itemId] || '');
      // Refresh assignment data
      const data = await checklistAssignmentService.getAssignmentById(assignmentId || '');
      setAssignment(data);
    } catch (err) {
      setError('Failed to mark item as complete.');
    } finally {
      setUpdatingItemId(null);
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

  if (error || !assignment) {
    return (
      <Layout>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          {error || 'Checklist assignment not found.'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Checklists</h1>
        <p className="text-gray-500 mb-6">Track and manage your onboarding tasks and requirements</p>
        <div className="space-y-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-900">{assignment.checklist?.title || 'Checklist Details'}</h2>
              <span className="text-sm text-gray-500 flex items-center"><Clock className="w-4 h-4 mr-1" /> Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</span>
          </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${assignment.completionPercentage || 0}%` }}
              ></div>
          </div>
            <ul className="space-y-2">
              {assignment.items?.map((item) => {
                const isCompleted = item.status === 'completed';
                const isOverdue = item.dueDate && !isCompleted && new Date(item.dueDate) < new Date();
                return (
                  <li key={item.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      readOnly
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className={isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}>
                      {item.title}
                    </span>
                    {isOverdue && (
                      <span className="ml-2 text-xs text-red-500 bg-red-100 px-2 py-0.5 rounded">Overdue</span>
                  )}
                    {/* Employee can add notes and mark complete if not done */}
                    {user?.role === 'employee' && !isCompleted && (
                      <>
                      <input
                        type="text"
                        placeholder="Add a note (optional)"
                        value={notes[item.id] || ''}
                        onChange={e => setNotes({ ...notes, [item.id]: e.target.value })}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm ml-2"
                          style={{ minWidth: 120 }}
                      />
                      <button
                        onClick={() => handleMarkComplete(item.id)}
                          className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          disabled={updatingItemId === item.id}
                      >
                          {updatingItemId === item.id ? 'Saving...' : 'Mark Complete'}
                      </button>
                      </>
                  )}
                  </li>
                );
              })}
            </ul>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChecklistAssignmentDetailPage; 