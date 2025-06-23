import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Clock, ArrowLeft, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import checklistAssignmentService from '../services/checklistAssignmentService';
import checklistService from '../services/checklistService';
import { ChecklistAssignmentDetail, ChecklistProgressItem } from '../types/checklist';
import dayjs from 'dayjs';
import api from '../services/api';

const ChecklistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressItems, setProgressItems] = useState<ChecklistProgressItem[]>([]);
  const [assignment, setAssignment] = useState<ChecklistAssignmentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New state for assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [itemId: string]: string }>({});
  const [showNotesInput, setShowNotesInput] = useState<string | null>(null);

  const [verificationNotes, setVerificationNotes] = useState<{ [itemId: string]: string }>({});
  const [verifyingItemId, setVerifyingItemId] = useState<string | null>(null);
  const [notifyStatus, setNotifyStatus] = useState<{ [itemId: string]: string }>({});

  useEffect(() => {
    const fetchChecklistDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Try to get all assignments to find the current one
        const assignments = await checklistAssignmentService.getMyAssignments();
        const currentAssignment = assignments.find(a => a.id === id);
        if (currentAssignment) {
          setAssignment(currentAssignment);
          // Get checklist items with progress - using the CHECKLIST ID directly
          const items = await checklistService.getChecklistItems(currentAssignment.checklistId);
          setProgressItems(items.map(item => ({
            ...item,
            userId: currentAssignment.userId,
            checklistItemId: item.id,
            isCompleted: false,
            checklistItem: item
          })));
          setError(null);
        } else {
          // Fallback: Try to fetch checklist directly by ID
          const checklist = await checklistService.getChecklist(id);
          if (checklist) {
            setAssignment(null); // No assignment context
            // Always fetch items using getChecklistItems
            const items = await checklistService.getChecklistItems(id);
            setProgressItems(items.map(item => ({
              ...item,
              userId: '',
              checklistItemId: item.id,
              isCompleted: false,
              checklistItem: item
            })));
            setError(null);
          } else {
            setError('Checklist not found');
          }
        }
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

  // New function to open the assignment modal
  const openAssignModal = () => {
    setShowAssignModal(true);
    setUserId('');
    setDueDate('');
    setAssignError(null);
  };

  // New function to handle checklist assignment
  const handleAssignChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    if (!userId) {
      setAssignError('Please enter a user ID');
      return;
    }
    
    try {
      setAssignLoading(true);
      
      await checklistAssignmentService.assignChecklist({
        userId,
        checklistId: id,
        dueDate: dueDate || undefined
      });
      
      setShowAssignModal(false);
      alert('Checklist assigned successfully!');
    } catch (err) {
      console.error('Error assigning checklist:', err);
      setAssignError('Failed to assign checklist. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };

  // Employee: Mark item complete/incomplete and add notes
  const handleToggleComplete = async (progressItem: ChecklistProgressItem) => {
    if (!id) return;
    try {
      setUpdatingItemId(progressItem.id);
      const updatedItem = await checklistAssignmentService.updateProgress(
        progressItem.id,
        {
          isCompleted: !progressItem.isCompleted,
          notes: notes[progressItem.id] || undefined,
          completedAt: !progressItem.isCompleted ? new Date().toISOString() : undefined
        }
      );
      setProgressItems(prevItems =>
        prevItems.map(item =>
          item.id === updatedItem.id ? { ...item, ...updatedItem } : item
        )
      );
      setNotes(n => ({ ...n, [progressItem.id]: '' }));
      setShowNotesInput(null);
    } catch {
      alert('Failed to update item status. Please try again.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Supervisor: Approve/reject item with verification notes
  const handleVerifyItem = async (progressItem: ChecklistProgressItem, status: 'approved' | 'rejected') => {
    if (!id || !user || user.role !== 'supervisor') return;
    try {
      setVerifyingItemId(progressItem.id);
      const updatedItem = await checklistAssignmentService.verifyChecklistItem(
        progressItem.id,
        {
          verificationStatus: status,
          verificationNotes: verificationNotes[progressItem.id] || undefined
        }
      );
      setProgressItems(prevItems =>
        prevItems.map(item =>
          item.id === updatedItem.id ? { ...item, ...updatedItem } : item
        )
      );
      setVerificationNotes(n => ({ ...n, [progressItem.id]: '' }));
    } catch {
      alert('Failed to verify item. Please try again.');
    } finally {
      setVerifyingItemId(null);
    }
  };

  // Supervisor: Notify employee about item
  const handleNotifyEmployee = async (progressItem: ChecklistProgressItem) => {
    if (!assignment?.userId) return;
    setNotifyStatus(s => ({ ...s, [progressItem.id]: 'sending' }));
    try {
      await api.post('/notifications', {
        userId: assignment.userId,
        title: 'Checklist Item Update',
        message: `Please review the item: ${progressItem.checklistItem?.title}`
      });
      setNotifyStatus(s => ({ ...s, [progressItem.id]: 'sent' }));
      setTimeout(() => setNotifyStatus(s => ({ ...s, [progressItem.id]: '' })), 2000);
    } catch {
      setNotifyStatus(s => ({ ...s, [progressItem.id]: 'error' }));
      setTimeout(() => setNotifyStatus(s => ({ ...s, [progressItem.id]: '' })), 2000);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/checklists')} 
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {assignment?.checklist?.title || progressItems[0]?.checklistItem?.title || 'Checklist Details'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {assignment?.checklist?.description || 'Complete the tasks below'}
              </p>
            </div>
          </div>
          
          {/* Add Assign button for HR users */}
          {user?.role === 'hr' && (
            <button
              onClick={openAssignModal}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="-ml-1 mr-2 h-4 w-4" />
              Assign Checklist
            </button>
          )}
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
                {/* Only show due date and progress bar if assignment exists */}
                {assignment && (
                  <>
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
                  </>
                )}
                <div className="space-y-6">
                  {progressItems.length === 0 ? (
                    <div className="text-center text-gray-500">No checklist items found.</div>
                  ) : (
                    progressItems.map((item) => (
                      <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{item.checklistItem?.title}</div>
                            {item.checklistItem?.description && (
                              <div className="text-sm text-gray-500">{item.checklistItem?.description}</div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {item.isCompleted ? `Completed at ${item.completedAt ? dayjs(item.completedAt).format('YYYY-MM-DD HH:mm') : ''}` : 'Not completed'}
                            </div>
                            {item.notes && (
                              <div className="text-xs text-gray-600 mt-1">Notes: {item.notes}</div>
                            )}
                          </div>
                          {/* Employee controls: show if user is the assigned employee */}
                          {user?.id === item.userId && (
                            <div className="flex flex-col items-end">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={item.isCompleted}
                                  disabled={updatingItemId === item.id}
                                  onChange={() => handleToggleComplete(item)}
                                />
                                <span className="text-sm">Mark as completed</span>
                              </label>
                              <button
                                className="text-xs text-blue-600 mt-1 underline"
                                onClick={() => setShowNotesInput(showNotesInput === item.id ? null : item.id)}
                              >
                                {showNotesInput === item.id ? 'Hide Notes' : 'Add/Edit Notes'}
                              </button>
                              {showNotesInput === item.id && (
                                <div className="mt-2">
                                  <textarea
                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm w-48"
                                    rows={2}
                                    value={notes[item.id] || ''}
                                    onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                                  />
                                  <button
                                    className="ml-2 px-2 py-1 bg-blue-600 text-white rounded-md text-xs"
                                    disabled={updatingItemId === item.id}
                                    onClick={() => handleToggleComplete(item)}
                                  >
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Supervisor controls: show if user is supervisor */}
                          {user?.role === 'supervisor' && (
                            <div className="flex flex-col items-end mt-2">
                              <div className="flex items-center space-x-2 mb-1">
                                <button
                                  className="px-2 py-1 bg-green-600 text-white rounded-md text-xs"
                                  disabled={verifyingItemId === item.id}
                                  onClick={() => handleVerifyItem(item, 'approved')}
                                >
                                  Approve
                                </button>
                                <button
                                  className="px-2 py-1 bg-red-500 text-white rounded-md text-xs"
                                  disabled={verifyingItemId === item.id}
                                  onClick={() => handleVerifyItem(item, 'rejected')}
                                >
                                  Reject
                                </button>
                              </div>
                              <textarea
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm w-48 mb-1"
                                rows={2}
                                placeholder="Verification notes"
                                value={verificationNotes[item.id] || ''}
                                onChange={e => setVerificationNotes(n => ({ ...n, [item.id]: e.target.value }))}
                              />
                              <button
                                className="text-xs text-blue-600 underline mt-1"
                                onClick={() => handleNotifyEmployee(item)}
                                disabled={notifyStatus[item.id] === 'sending'}
                              >
                                {notifyStatus[item.id] === 'sent' ? 'Notification Sent!' : notifyStatus[item.id] === 'error' ? 'Error Sending' : 'Notify Employee'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assign Checklist: {assignment?.checklist?.title}
            </h3>
            
            {assignError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3">
                <p className="text-sm text-red-700">{assignError}</p>
              </div>
            )}
            
            <form onSubmit={handleAssignChecklist}>
              <div className="mb-4">
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                  User ID *
                </label>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignLoading ? 'Assigning...' : 'Assign Checklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ChecklistDetail;