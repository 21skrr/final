import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import checklistAssignmentService from '../services/checklistAssignmentService';
import { ChecklistAssignmentDetail, ChecklistItem } from '../types/checklist';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle } from 'lucide-react';

const ChecklistAssignmentDetailPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<ChecklistAssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [itemId: string]: string }>({});

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
      await checklistAssignmentService.markItemComplete(itemId, notes[itemId] || '');
      // Refresh assignment data
      const data = await checklistAssignmentService.getAssignmentById(assignmentId || '');
      setAssignment(data);
    } catch (err) {
      setError('Failed to mark item as complete.');
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assignment.checklist?.title || 'Checklist Details'}
            </h1>
            <p className="text-gray-600">
              Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Progress</p>
            <p className="font-medium">{assignment.completionPercentage || 0}%</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
          {assignment.items?.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                  {item.notes && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      Notes: {item.notes}
                    </p>
                  )}
                  {item.status !== 'completed' && (
                    <div className="mt-2 flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Add a note (optional)"
                        value={notes[item.id] || ''}
                        onChange={e => setNotes({ ...notes, [item.id]: e.target.value })}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => handleMarkComplete(item.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  {item.status === 'completed' ? (
                    <span className="text-green-600" title="Completed">
                      <CheckCircle size={20} />
                    </span>
                  ) : (
                    <span className="text-gray-400" title="Incomplete">
                      <XCircle size={20} />
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'completed' ? 'bg-green-100 text-green-800' :
                  item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
                {item.dueDate && (
                  <span className="ml-2">
                    Due: {new Date(item.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ChecklistAssignmentDetailPage; 