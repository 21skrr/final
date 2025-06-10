import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { CheckSquare, Clock, ArrowLeft, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import checklistAssignmentService from '../services/checklistAssignmentService';
import { ChecklistAssignmentDetail, ChecklistProgressItem } from '../types/checklist';

const ChecklistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressItems, setProgressItems] = useState<ChecklistProgressItem[]>([]);
  const [assignment, setAssignment] = useState<ChecklistAssignmentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [showNotesInput, setShowNotesInput] = useState<string | null>(null);

  useEffect(() => {
    const fetchChecklistDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // Get all assignments to find the current one
        const assignments = await checklistAssignmentService.getMyAssignments();
        const currentAssignment = assignments.find(a => a.id === id);
        
        if (!currentAssignment) {
          setError('Checklist assignment not found');
          return;
        }
        
        setAssignment(currentAssignment);
        
        // Get checklist items with progress
        const items = await checklistAssignmentService.getAssignmentItems(id);
        setProgressItems(items);
        setError(null);
      } catch (err) {
        console.error('Error fetching checklist details:', err);
        setError('Failed to load checklist details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchChecklistDetails();
  }, [id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not completed';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleToggleComplete = async (progressItem: ChecklistProgressItem) => {
    if (!id) return;
    
    try {
      setUpdatingItemId(progressItem.id);
      
      const updatedItem = await checklistAssignmentService.updateProgress(
        progressItem.id,
        {
          isCompleted: !progressItem.isCompleted,
          notes: notes || undefined,
          completedAt: !progressItem.isCompleted ? new Date().toISOString() : undefined
        }
      );
      
      // Update the items list with the updated item
      setProgressItems(prevItems => 
        prevItems.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        )
      );
      
      // Reset notes
      setNotes('');
      setShowNotesInput(null);
    } catch (err) {
      console.error('Error updating checklist item:', err);
      alert('Failed to update item status. Please try again.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleVerifyItem = async (progressItem: ChecklistProgressItem, status: 'approved' | 'rejected') => {
    if (!id || !user || !['hr', 'supervisor', 'manager'].includes(user.role)) return;
    
    try {
      setUpdatingItemId(progressItem.id);
      
      const updatedItem = await checklistAssignmentService.verifyChecklistItem(
        progressItem.id,
        {
          verificationStatus: status,
          verificationNotes: notes || undefined
        }
      );
      
      // Update the items list with the updated item
      setProgressItems(prevItems => 
        prevItems.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        )
      );
      
      // Reset notes
      setNotes('');
      setShowNotesInput(null);
    } catch (err) {
      console.error('Error verifying checklist item:', err);
      alert('Failed to verify item. Please try again.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/checklists')} 
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assignment?.checklist?.title || 'Checklist Details'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {assignment?.checklist?.description || 'Complete the tasks below'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">
                      Due: {formatDate(assignment?.dueDate)}
                    </span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {assignment?.completionPercentage || 0}% Complete
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${assignment?.completionPercentage || 0}%` }}
                  ></div>
                </div>

                <div className="space-y-6">
                  {progressItems.map((item) => (
                    <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-1">
                          {updatingItemId === item.id ? (
                            <div className="h-4 w-4 animate-pulse bg-blue-200 rounded-full"></div>
                          ) : (
                            <button
                              onClick={() => {
                                if (item.checklistItem?.controlledBy !== 'hr' || user?.role === 'hr') {
                                  handleToggleComplete(item);
                                }
                              }}
                              disabled={item.checklistItem?.controlledBy === 'hr' && user?.role !== 'hr'}
                              className={`h-5 w-5 ${item.checklistItem?.controlledBy === 'hr' && user?.role !== 'hr' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                              {item.isCompleted ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-300" />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <span className={`text-sm font-medium ${item.isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>
                              {item.checklistItem?.title}
                            </span>
                            {item.isCompleted && (
                              <span className="text-xs text-gray-500">
                                Completed: {formatDate(item.completedAt)}
                              </span>
                            )}
                          </div>
                          {item.checklistItem?.description && (
                            <p className="mt-1 text-sm text-gray-500">{item.checklistItem.description}</p>
                          )}
                          {item.notes && (
                            <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              <strong>Notes:</strong> {item.notes}
                            </div>
                          )}
                          
                          {/* Notes input when toggling completion */}
                          {showNotesInput === item.id && (
                            <div className="mt-2">
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes (optional)"
                                className="w-full text-sm border border-gray-300 rounded-md p-2"
                                rows={2}
                              />
                              <div className="mt-2 flex justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setShowNotesInput(null);
                                    setNotes('');
                                  }}
                                  className="px-3 py-1 text-xs text-gray-700 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleToggleComplete(item)}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Verification status */}
                          {item.isCompleted && item.checklistItem?.controlledBy === 'hr' && (
                            <div className="mt-2">
                              {item.verificationStatus ? (
                                <span className={`text-xs px-2 py-1 rounded ${item.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {item.verificationStatus === 'approved' ? 'Verified' : 'Rejected'}
                                  {item.verifier && ` by ${item.verifier.name}`}
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                                  Pending verification
                                </span>
                              )}
                              
                              {item.verificationNotes && (
                                <div className="mt-1 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                  <strong>Verification notes:</strong> {item.verificationNotes}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Verification actions for HR/Supervisor/Manager */}
                          {item.isCompleted && 
                           !item.verificationStatus && 
                           user && 
                           ['hr', 'supervisor', 'manager'].includes(user.role) && (
                            <div className="mt-3">
                              {showNotesInput === `verify-${item.id}` ? (
                                <div>
                                  <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add verification notes (optional)"
                                    className="w-full text-sm border border-gray-300 rounded-md p-2"
                                    rows={2}
                                  />
                                  <div className="mt-2 flex justify-end space-x-2">
                                    <button
                                      onClick={() => {
                                        setShowNotesInput(null);
                                        setNotes('');
                                      }}
                                      className="px-3 py-1 text-xs text-gray-700 hover:text-gray-900"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleVerifyItem(item, 'rejected')}
                                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => handleVerifyItem(item, 'approved')}
                                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                      Approve
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowNotesInput(`verify-${item.id}`)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Verify this item
                                </button>
                              )}
                            </div>
                          )}
                          
                          {/* Action buttons */}
                          {!item.isCompleted && !showNotesInput && (
                            <div className="mt-2">
                              <button
                                onClick={() => setShowNotesInput(item.id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Mark as complete with notes
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ChecklistDetail;