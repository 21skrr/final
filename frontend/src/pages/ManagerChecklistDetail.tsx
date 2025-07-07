import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import checklistAssignmentService from '../services/checklistAssignmentService';
import { ChecklistAssignmentDetail, ChecklistItem } from '../types/checklist';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Send, Eye } from 'lucide-react';

const ManagerChecklistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<ChecklistAssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [reminderNote, setReminderNote] = useState('');

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const data = await checklistAssignmentService.getAssignmentById(id || '');
        setAssignment(data);
        setError(null);
      } catch (err) {
        setError('Failed to load checklist assignment.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAssignment();
  }, [id]);

  const handleSendReminder = async (itemId: string) => {
    try {
      await checklistAssignmentService.sendReminder(itemId, reminderNote);
      setReminderNote('');
      setSelectedItem(null);
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
              Assigned to: {assignment.userId}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="font-medium">
                {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Progress</p>
              <p className="font-medium">{assignment.completionPercentage || 0}%</p>
            </div>
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
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  {/* Managers can only view and send reminders - no validation actions */}
                  {item.status !== 'completed' && (
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="p-2 text-yellow-600 hover:text-yellow-700"
                      title="Send Reminder"
                    >
                      <AlertCircle size={20} />
                    </button>
                  )}
                  {item.validated && (
                    <span className="text-green-600" title="Validated">
                      <Eye size={20} />
                    </span>
                  )}
                  {item.status === 'completed' && !item.validated && (
                    <span className="text-blue-600" title="Completed - Pending Validation">
                      <Eye size={20} />
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

        {/* Reminder Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Send Reminder for: {selectedItem.title}
              </h3>
              <textarea
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
                placeholder="Add a note to the reminder..."
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setReminderNote('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendReminder(selectedItem.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Send size={16} className="mr-2" />
                  Send Reminder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManagerChecklistDetail; 