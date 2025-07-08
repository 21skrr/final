import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import checklistService from '../services/checklistService';

const ChecklistCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [programType, setProgramType] = useState('inkompass');
  const [stage, setStage] = useState('prepare');
  const [autoAssign, setAutoAssign] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(true);
  // Remove items state and related logic

  // For auto-assignment rules
  const [showAutoAssignRules, setShowAutoAssignRules] = useState(false);
  const [autoAssignDepartments, setAutoAssignDepartments] = useState<string>('');
  const [autoAssignProgramTypes, setAutoAssignProgramTypes] = useState<string>('');
  const [autoAssignDueInDays, setAutoAssignDueInDays] = useState<number | ''>('');
  const [autoAssignStages, setAutoAssignStages] = useState<string>('');
  const [autoAssignNotify, setAutoAssignNotify] = useState(false);
  const [autoAssignChecklistId, setAutoAssignChecklistId] = useState<string | null>(null);
  const [autoAssignMessage, setAutoAssignMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if not HR
  if (user?.role !== 'hr') {
    navigate('/dashboard');
    return null;
  }

  // Remove handleAddItem, handleRemoveItem, handleItemChange

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Please enter a title for the checklist');
      return;
    }
    try {
      setLoading(true);
      // Create the checklist template only
      const response = await checklistService.createChecklist({
        title,
        description,
        programType,
        stage,
        autoAssign,
        requiresVerification
      });
      const checklist = response.checklist || response; // fallback for old response shape

      // If auto-assign is checked, show the auto-assign rules form
      if (autoAssign) {
        setAutoAssignChecklistId(checklist.checklistId || checklist.id);
        setShowAutoAssignRules(true);
        setLoading(false);
        return; // Don't navigate yet
      }
      // Show success message and redirect to edit page
      setSuccessMessage('Checklist template created! Redirecting to add items...');
      setTimeout(() => navigate(`/checklists/${checklist.checklistId || checklist.id}/edit`), 1200);
    } catch (err) {
      console.error('Error creating checklist:', err);
      alert('Failed to create checklist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssignRulesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoAssignChecklistId) return;
    setLoading(true);
    setAutoAssignMessage(null);
    try {
      await checklistService.addAutoAssignRules(autoAssignChecklistId, {
        departments: autoAssignDepartments.split(',').map(s => s.trim()).filter(Boolean),
        programTypes: autoAssignProgramTypes.split(',').map(s => s.trim()).filter(Boolean),
        dueInDays: autoAssignDueInDays ? Number(autoAssignDueInDays) : undefined,
        stages: autoAssignStages.split(',').map(s => s.trim()).filter(Boolean),
        autoNotify: autoAssignNotify,
      });
      setAutoAssignMessage('Auto-assignment rules saved!');
      setTimeout(() => navigate('/checklists'), 1200);
    } catch (err) {
      setAutoAssignMessage('Failed to save auto-assignment rules.');
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Create New Checklist</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new checklist template for employees
            </p>
          </div>
        </div>
        {successMessage && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded">
            {successMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Checklist Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="programType" className="block text-sm font-medium text-gray-700">
                    Program Type
                  </label>
                  <select
                    id="programType"
                    value={programType}
                    onChange={(e) => setProgramType(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="inkompass">INKOMPASS</option>
                    <option value="earlyTalent">Early Talent</option>
                    <option value="apprenticeship">Apprenticeship</option>
                    <option value="academicPlacement">Academic Placement</option>
                    <option value="workExperience">Work Experience</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="stage" className="block text-sm font-medium text-gray-700">
                    Onboarding Stage
                  </label>
                  <select
                    id="stage"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="prepare">Prepare</option>
                    <option value="orient">Orient</option>
                    <option value="land">Land</option>
                    <option value="integrate">Integrate</option>
                    <option value="excel">Excel</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex items-center">
                  <input
                    id="autoAssign"
                    type="checkbox"
                    checked={autoAssign}
                    onChange={(e) => setAutoAssign(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoAssign" className="ml-2 block text-sm text-gray-700">
                    Auto-assign to new employees
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="requiresVerification"
                    type="checkbox"
                    checked={requiresVerification}
                    onChange={(e) => setRequiresVerification(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiresVerification" className="ml-2 block text-sm text-gray-700">
                    Requires verification by HR/Supervisor
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/checklists')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Checklist'}
            </button>
          </div>
        </form>
        {/* Auto-Assignment Rules Section (after checklist creation) */}
        {showAutoAssignRules && (
          <form onSubmit={handleAutoAssignRulesSubmit} className="space-y-6 bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Auto-Assignment Rules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Departments (comma separated)</label>
                <input type="text" value={autoAssignDepartments} onChange={e => setAutoAssignDepartments(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Program Types (comma separated)</label>
                <input type="text" value={autoAssignProgramTypes} onChange={e => setAutoAssignProgramTypes(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Onboarding Stages (comma separated)</label>
                <input type="text" value={autoAssignStages} onChange={e => setAutoAssignStages(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due in Days</label>
                <input type="number" value={autoAssignDueInDays} onChange={e => setAutoAssignDueInDays(e.target.value ? Number(e.target.value) : '')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
              </div>
              <div className="flex items-center mt-2">
                <input id="autoAssignNotify" type="checkbox" checked={autoAssignNotify} onChange={e => setAutoAssignNotify(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="autoAssignNotify" className="ml-2 block text-sm text-gray-700">Auto-notify users on assignment</label>
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Rules'}</button>
              <button type="button" onClick={() => navigate('/checklists')} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
            </div>
            {autoAssignMessage && <div className="mt-2 text-sm text-green-600">{autoAssignMessage}</div>}
          </form>
        )}
      </div>
    </Layout>
  );
};

export default ChecklistCreate;