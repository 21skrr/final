import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { CheckSquare, Clock, AlertCircle, Plus, Edit, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import checklistAssignmentService from '../services/checklistAssignmentService';
import checklistService from '../services/checklistService';
import { ChecklistAssignmentDetail, Checklist } from '../types/checklist';
import { Link } from 'react-router-dom';

const Checklists: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<ChecklistAssignmentDetail[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // New state for assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [userId, setUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // For HR users, fetch all checklist templates
        if (user?.role === 'hr') {
          const checklistData = await checklistService.getChecklists();
          setChecklists(checklistData);
        } else {
          // For other users, fetch their assignments
          const assignmentData = await checklistAssignmentService.getMyAssignments();
          console.log('Fetched assignments:', assignmentData); // Add this debug log
          setAssignments(assignmentData || []); // Ensure we set an empty array if null/undefined
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching checklist data:', err);
        setError('Failed to load checklists. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteChecklist = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this checklist?')) {
      try {
        await checklistService.deleteChecklist(id);
        // Refresh the list after deletion
        const updatedChecklists = await checklistService.getChecklists();
        setChecklists(updatedChecklists);
      } catch (err) {
        console.error('Error deleting checklist:', err);
        alert('Failed to delete checklist. Please try again.');
      }
    }
  };

  // New function to open the assignment modal
  const openAssignModal = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setShowAssignModal(true);
    setUserId('');
    setDueDate('');
    setAssignError(null);
  };

  // New function to handle checklist assignment
  const handleAssignChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChecklist) return;
    
    if (!userId) {
      setAssignError('Please enter a user ID');
      return;
    }
    
    try {
      setAssignLoading(true);
      
      await checklistAssignmentService.assignChecklist({
        userId,
        checklistId: selectedChecklist.id,
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Checklists</h1>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === 'hr' 
                ? 'Manage checklist templates for onboarding and employee tasks' 
                : 'Track and manage your onboarding tasks and requirements'}
            </p>
          </div>
          {user?.role === 'hr' && (
            <Link to="/checklists/create" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <Plus className="-ml-1 mr-2 h-4 w-4" />
              Create Checklist
            </Link>
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
          <div className="grid grid-cols-1 gap-6">
            {user?.role === 'hr' ? (
              // Display checklist templates for HR users
              checklists.length > 0 ? (
                checklists.map((checklist) => (
                  <div key={checklist.id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-lg font-medium text-gray-900">
                            {checklist.title}
                          </h2>
                          <div className="mt-1 text-sm text-gray-500">
                            {checklist.description || 'No description'}
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Program: {checklist.programType || 'All'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Stage: {checklist.stage || 'All'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Items: {checklist.items?.length || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {/* New Assign button */}
                          <button
                            onClick={() => openAssignModal(checklist)}
                            className="inline-flex items-center p-2 border border-transparent rounded-md text-sm text-green-600 hover:bg-green-50"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                          <Link to={`/checklists/${checklist.id}`} className="inline-flex items-center p-2 border border-transparent rounded-md text-sm text-blue-600 hover:bg-blue-50">
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button 
                            onClick={() => handleDeleteChecklist(checklist.id)}
                            className="inline-flex items-center p-2 border border-transparent rounded-md text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No checklists</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new checklist.</p>
                  <div className="mt-6">
                    <Link to="/checklists/create" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                      <Plus className="-ml-1 mr-2 h-4 w-4" />
                      Create Checklist
                    </Link>
                  </div>
                </div>
              )
            ) : (
              // Display assignments for non-HR users
              assignments && assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-lg font-medium text-gray-900">
                            {assignment.checklist?.title || 'Untitled Checklist'}
                          </h2>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            Due: {formatDate(assignment.dueDate)}
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {assignment.completionPercentage}% Complete
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${assignment.completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Link
                          to={`/checklists/${assignment.checklistId}/details`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No checklists</h3>
                  <p className="mt-1 text-sm text-gray-500">You don't have any assigned checklists yet.</p>
                </div>
              )
            )}
          </div>
        )}
        
        {/* Assignment Modal */}
        {showAssignModal && selectedChecklist && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Checklist: {selectedChecklist.title}
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
      </div>
    </Layout>
  );
};

export default Checklists;