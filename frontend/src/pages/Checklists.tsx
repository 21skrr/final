import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { CheckSquare, Clock, AlertCircle, Plus, Edit, Trash2, UserPlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import checklistAssignmentService from '../services/checklistAssignmentService';
import checklistService from '../services/checklistService';
import { ChecklistAssignmentDetail, Checklist } from '../types/checklist';
import { Link, useLocation } from 'react-router-dom';
import Select from 'react-select';
import userService from '../services/userService';

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
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // New state for editing checklist templates
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [templateEditChecklist, setTemplateEditChecklist] = useState<Checklist | null>(null);
  const [templateEditLoading, setTemplateEditLoading] = useState(false);
  const [templateEditError, setTemplateEditError] = useState<string | null>(null);
  const [templateEditSuccess, setTemplateEditSuccess] = useState<string | null>(null);
  const [templateEditFields, setTemplateEditFields] = useState({
    title: '',
    description: '',
    programType: 'inkompass',
    stage: 'prepare',
  });

  // Checklist Items Modal State
  const [showEditItemsModal, setShowEditItemsModal] = useState(false);
  const [itemsEditChecklist, setItemsEditChecklist] = useState<Checklist | null>(null);
  const [itemsEditLoading, setItemsEditLoading] = useState(false);
  const [itemsEditError, setItemsEditError] = useState<string | null>(null);
  const [itemsEditSuccess, setItemsEditSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [itemsInitial, setItemsInitial] = useState<any[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);

  const location = useLocation();

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
    // Refetch when coming back to this page
  }, [user?.role, location.key]);

  // Fetch users and departments when modal opens
  useEffect(() => {
    if (showAssignModal) {
      userService.getUsers().then(setUsers);
      userService.getAllDepartments().then(setDepartments);
    }
  }, [showAssignModal]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteChecklist = async (id: string, checklistId?: string) => {
    if (window.confirm('Are you sure you want to delete this checklist?')) {
      try {
        if (checklistId) {
          await checklistService.deleteChecklistByChecklistId(checklistId);
        } else {
          await checklistService.deleteChecklist(id);
        }
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
    if (!selectedUser && !selectedDepartment) {
      setAssignError('Please select a user or department');
      return;
    }
    try {
      setAssignLoading(true);
      if (selectedDepartment) {
        // Fetch users in department
        const deptUsers = users.filter(u => u.department === selectedDepartment.value);
        const userIds = deptUsers.map(u => u.id);
        await checklistAssignmentService.bulkAssignChecklist({
          checklistId: selectedChecklist.id,
          userIds,
          dueDate: dueDate || undefined
        });
      } else if (selectedUser) {
        await checklistAssignmentService.assignChecklist({
          userId: selectedUser.value,
          checklistId: selectedChecklist.id,
          dueDate: dueDate || undefined
        });
      }
      setShowAssignModal(false);
      alert('Checklist assigned successfully!');
    } catch (err) {
      console.error('Error assigning checklist:', err);
      setAssignError('Failed to assign checklist. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };

  // Open modal and prefill fields
  const openEditTemplateModal = (checklist: Checklist) => {
    setTemplateEditChecklist(checklist);
    setTemplateEditFields({
      title: checklist.title || '',
      description: checklist.description || '',
      programType: checklist.programType || 'inkompass',
      stage: checklist.stage || 'prepare',
    });
    setTemplateEditError(null);
    setTemplateEditSuccess(null);
    setShowEditTemplateModal(true);
  };

  // Save template changes
  const handleTemplateEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateEditChecklist) return;
    setTemplateEditLoading(true);
    setTemplateEditError(null);
    setTemplateEditSuccess(null);
    try {
      await checklistService.updateChecklistTemplate(
        templateEditChecklist.checklistId || templateEditChecklist.id,
        templateEditFields
      );
      setTemplateEditSuccess('Template updated successfully!');
      // Update the checklist in the list
      setChecklists((prev) =>
        prev.map((c) =>
          (c.checklistId === templateEditChecklist.checklistId || c.id === templateEditChecklist.id)
            ? { ...c, ...templateEditFields }
            : c
        )
      );
      setTimeout(() => {
        setShowEditTemplateModal(false);
        setTemplateEditSuccess(null);
      }, 1000);
    } catch (err) {
      setTemplateEditError('Failed to update template.');
    } finally {
      setTemplateEditLoading(false);
    }
  };

  // Open modal and load items
  const openEditItemsModal = async (checklist: Checklist) => {
    setItemsEditChecklist(checklist);
    setItemsEditLoading(true);
    setItemsEditError(null);
    setItemsEditSuccess(null);
    setShowEditItemsModal(true);
    setDeletedItemIds([]);
    try {
      const fetched = await checklistService.getChecklistItems(checklist.checklistId || checklist.id);
      setItems(Array.isArray(fetched) ? fetched : []);
      setItemsInitial(Array.isArray(fetched) ? fetched : []);
    } catch {
      setItems([]);
      setItemsInitial([]);
    } finally {
      setItemsEditLoading(false);
    }
  };

  // Add new item
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: '',
        title: '',
        description: '',
        isRequired: true,
        orderIndex: items.length,
        controlledBy: 'hr',
        phase: itemsEditChecklist?.stage || 'prepare',
        checklistId: itemsEditChecklist?.checklistId || itemsEditChecklist?.id,
        createdAt: '',
        updatedAt: '',
      },
    ]);
  };

  // Edit item inline
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Delete item (with confirmation)
  const handleDeleteItem = (index: number) => {
    const item = items[index];
    if (window.confirm('Are you sure you want to delete this item?')) {
      if (item.id) setDeletedItemIds(prev => [...prev, item.id]);
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Save all changes
  const handleItemsEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemsEditChecklist) return;
    setItemsEditLoading(true);
    setItemsEditError(null);
    setItemsEditSuccess(null);
    try {
      // Delete removed items
      for (const itemId of deletedItemIds) {
        await checklistService.deleteChecklistItem(itemId);
      }
      // Add/update items
      for (const [index, item] of items.entries()) {
        if (item.id) {
          await checklistService.updateChecklistItem(item.id, itemsEditChecklist.checklistId || itemsEditChecklist.id, {
            ...item,
            orderIndex: index,
          });
        } else {
          await checklistService.addChecklistItem(itemsEditChecklist.checklistId || itemsEditChecklist.id, {
            ...item,
            orderIndex: index,
          });
        }
      }
      setItemsEditSuccess('Checklist items updated!');
      setTimeout(() => {
        setShowEditItemsModal(false);
        setItemsEditSuccess(null);
      }, 1000);
    } catch {
      setItemsEditError('Failed to update items.');
    } finally {
      setItemsEditLoading(false);
      setDeletedItemIds([]);
    }
  };

  // For react-select, define the option type
  const userOptions = users.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }));
  console.log('departments:', departments);
  const departmentOptions = departments.map(d => ({
    value: typeof d === 'string' ? d : d.name,
    label: typeof d === 'string' ? d : d.name
  }));

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
          <button
            className="px-3 py-1 bg-gray-200 rounded text-sm ml-4"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
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
              // Display unique checklist templates for HR users
              checklists.length > 0 ? (
                // Show all unique checklistIds, prefer template row (userId: null), otherwise any row
                Array.from(
                  new Map(
                    checklists
                      .sort((a, b) => (a.userId === null ? -1 : 1)) // Prefer template row
                      .map(c => [c.checklistId, c])
                  ).values()
                ).map((checklist) => (
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
                          {/* Edit Template Button */}
                          <button
                            onClick={() => openEditTemplateModal(checklist)}
                            className="inline-flex items-center p-2 border border-transparent rounded-md text-sm text-yellow-600 hover:bg-yellow-50"
                            title="Edit Template"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {/* Edit Items Button */}
                          <button onClick={() => openEditItemsModal(checklist)} className="inline-flex items-center p-2 border border-transparent rounded-md text-sm text-blue-600 hover:bg-blue-50" title="Edit Items">
                            <Plus className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteChecklist(checklist.id, checklist.checklistId)}
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
                            {assignment.title || 'Untitled Checklist'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <Select
                    isClearable
                    isSearchable
                    options={userOptions}
                    value={userOptions.find(opt => opt.value === selectedUser?.value) || null}
                    onChange={option => {
                      setSelectedUser(option);
                      setSelectedDepartment(null);
                    }}
                    placeholder="Select a user..."
                    isDisabled={!!selectedDepartment}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <Select
                    isClearable
                    isSearchable
                    options={departmentOptions}
                    value={departmentOptions.find(opt => opt.value === selectedDepartment?.value) || null}
                    onChange={option => {
                      setSelectedDepartment(option);
                      setSelectedUser(null);
                    }}
                    placeholder="Select a department..."
                    isDisabled={!!selectedUser}
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

        {/* Edit Template Modal */}
        {showEditTemplateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowEditTemplateModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold mb-4">Edit Checklist Template</h2>
              <form onSubmit={handleTemplateEditSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Checklist Title *</label>
                  <input
                    type="text"
                    value={templateEditFields.title}
                    onChange={e => setTemplateEditFields(f => ({ ...f, title: e.target.value }))}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={templateEditFields.description}
                    onChange={e => setTemplateEditFields(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Program Type</label>
                    <select
                      value={templateEditFields.programType}
                      onChange={e => setTemplateEditFields(f => ({ ...f, programType: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    >
                      <option value="inkompass">INKOMPASS</option>
                      <option value="earlyTalent">Early Talent</option>
                      <option value="apprenticeship">Apprenticeship</option>
                      <option value="academicPlacement">Academic Placement</option>
                      <option value="workExperience">Work Experience</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stage</label>
                    <select
                      value={templateEditFields.stage}
                      onChange={e => setTemplateEditFields(f => ({ ...f, stage: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    >
                      <option value="prepare">Prepare</option>
                      <option value="orient">Orient</option>
                      <option value="land">Land</option>
                      <option value="integrate">Integrate</option>
                      <option value="excel">Excel</option>
                    </select>
                  </div>
                </div>
                {templateEditError && <div className="text-red-600 text-sm">{templateEditError}</div>}
                {templateEditSuccess && <div className="text-green-600 text-sm">{templateEditSuccess}</div>}
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditTemplateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={templateEditLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {templateEditLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Items Modal */}
        {showEditItemsModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowEditItemsModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold mb-4">Checklist Items</h2>
              <form onSubmit={handleItemsEditSave} className="space-y-4">
                <button type="button" onClick={handleAddItem} className="mb-2 flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"><Plus className="h-4 w-4 mr-1" /> Add Item</button>
                {itemsEditLoading ? (
                  <div>Loading...</div>
                ) : items.length === 0 ? (
                  <div className="text-gray-500 mb-2">No items found for this checklist. Click "Add Item" to create the first one.</div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2 mb-2 border-b pb-2">
                        <input type="text" placeholder="Title" value={item.title} onChange={e => handleItemChange(idx, 'title', e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-1/4" required />
                        <input type="text" placeholder="Description" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-1/3" />
                        <select value={item.phase || itemsEditChecklist?.stage || 'prepare'} onChange={e => handleItemChange(idx, 'phase', e.target.value)} className="border border-gray-300 rounded px-2 py-1">
                          <option value="prepare">Prepare</option>
                          <option value="orient">Orient</option>
                          <option value="land">Land</option>
                          <option value="integrate">Integrate</option>
                          <option value="excel">Excel</option>
                        </select>
                        <select value={item.controlledBy || 'hr'} onChange={e => handleItemChange(idx, 'controlledBy', e.target.value)} className="border border-gray-300 rounded px-2 py-1">
                          <option value="hr">HR</option>
                          <option value="employee">Employee</option>
                          <option value="both">Both</option>
                        </select>
                        <label className="flex items-center space-x-1">
                          <input type="checkbox" checked={item.isRequired} onChange={e => handleItemChange(idx, 'isRequired', e.target.checked)} />
                          <span className="text-xs">Required</span>
                        </label>
                        <button type="button" onClick={() => handleDeleteItem(idx)} className="text-red-500 hover:text-red-700 ml-2"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {itemsEditError && <div className="text-red-600 text-sm">{itemsEditError}</div>}
                {itemsEditSuccess && <div className="text-green-600 text-sm">{itemsEditSuccess}</div>}
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditItemsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={itemsEditLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {itemsEditLoading ? 'Saving...' : 'Save Changes'}
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
