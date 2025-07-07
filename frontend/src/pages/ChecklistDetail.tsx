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

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

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
          // Fetch progress records for this user and checklist
          const progress = await checklistAssignmentService.getChecklistProgressByUserAndChecklist(currentAssignment.userId, currentAssignment.checklistId);
          console.log('Fetched progress:', progress);
          console.log('Assignment:', currentAssignment);
          setProgressItems(progress);
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
      // Debug log
      console.log('PATCH userId:', progressItem.userId, assignment?.userId);
      const updatedItem = await checklistAssignmentService.updateProgress(
        progressItem.id,
        {
          isCompleted: !progressItem.isCompleted,
          notes: notes[progressItem.id] || undefined,
          completedAt: !progressItem.isCompleted ? new Date().toISOString() : undefined,
          userId: assignment?.userId || progressItem.userId || "b0d033a6-d9a5-43dd-8986-9ce074aca89e",
          checklistItemId: progressItem.checklistItemId || progressItem.checklistItem?.id
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

  // Calculate progress using actual completed tasks
  const totalTasks = progressItems.length;
  const completedTasks = progressItems.filter(item => item.isCompleted).length;
  const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  // Group by phase
  const groupedByPhase = progressItems.reduce((acc, item) => {
    const phase = item.checklistItem?.phase || 'Other';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(item);
    return acc;
  }, {} as Record<string, typeof progressItems>);
  // Find next task
  const nextTask = progressItems.find(item => !item.isCompleted);

  // Save all progress changes
  const handleSaveProgress = async () => {
    try {
      setSaving(true);
      await Promise.all(progressItems.map(async (item) => {
        await checklistAssignmentService.updateProgress(
          item.id,
          {
            isCompleted: item.isCompleted,
            notes: item.notes || '',
            completedAt: item.isCompleted ? (item.completedAt || new Date().toISOString()) : undefined,
            userId: item.userId || assignment?.userId || "b0d033a6-d9a5-43dd-8986-9ce074aca89e",
            checklistItemId: item.checklistItemId || item.checklistItem?.id
          }
        );
      }));
      setSaveMessage('Progress saved!');
      setTimeout(() => {
        setSaveMessage('');
        navigate('/checklists');
      }, 1000);
    } catch {
      setSaveMessage('Failed to save progress.');
      setTimeout(() => setSaveMessage(''), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-center mb-6">Employee's Onboarding Journey</h1>
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-sm text-gray-500">Overall Progress</div>
            <div className="font-bold text-lg">{percentComplete}%</div>
            <progress value={percentComplete} max={100} className="w-40 h-2 align-middle" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {assignment?.status || 'In progress'}
            </span>
          </div>
          <div>
            <div className="text-sm text-gray-500">Next Task</div>
            <div className="font-semibold">{nextTask?.checklistItem?.title || 'All tasks completed'}</div>
          </div>
        </div>
        <div className="flex justify-end mb-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSaveProgress}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
          {saveMessage && <span className="ml-4 text-green-600 font-medium">{saveMessage}</span>}
        </div>
        {Object.entries(groupedByPhase).map(([phase, items]) => (
          <div key={phase} className="mb-8 border rounded-lg bg-blue-50/30">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h2 className="font-semibold text-lg">{phase}</h2>
              <span className="text-xs text-gray-500">{Math.round((items.filter(i => i.isCompleted).length / items.length) * 100)}%</span>
            </div>
            <div className="p-4 space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-white rounded shadow-sm px-4 py-3">
                  {console.log('Render item:', {id: item.id, checklistItemId: item.checklistItemId, isCompleted: item.isCompleted})}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(item.isCompleted)}
                      disabled={updatingItemId === item.id || Boolean(item.isCompleted)}
                      onChange={() => {
                        setProgressItems(prev =>
                          prev.map(pi =>
                            pi.id === item.id ? { ...pi, isCompleted: !pi.isCompleted } : pi
                          )
                        );
                      }}
                    />
                    <div>
                      <div className={`font-medium text-gray-900 ${item.isCompleted ? 'line-through text-gray-400' : ''}`}>{item.checklistItem?.title}</div>
                      {item.checklistItem?.description && (
                        <div className={`text-sm ${item.isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>{item.checklistItem?.description}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full border bg-gray-50">
                    {item.isCompleted ? 'Completed' : 'Not Started'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
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