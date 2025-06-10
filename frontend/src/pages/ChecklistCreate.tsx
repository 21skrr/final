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
  const [programType, setProgramType] = useState('all');
  const [stage, setStage] = useState('all');
  const [autoAssign, setAutoAssign] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(true);
  const [items, setItems] = useState<Array<{
    title: string;
    description: string;
    isRequired: boolean;
    orderIndex: number;
    controlledBy: 'hr' | 'employee' | 'both';
    phase: string;
  }>>([]);

  // Redirect if not HR
  if (user?.role !== 'hr') {
    navigate('/dashboard');
    return null;
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        title: '',
        description: '',
        isRequired: true,
        orderIndex: items.length,
        controlledBy: 'both',
        phase: stage !== 'all' ? stage : 'prepare',
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      alert('Please enter a title for the checklist');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create the checklist
      const checklist = await checklistService.createChecklist({
        title,
        description,
        programType,
        stage,
        autoAssign,
        requiresVerification
      });
      
      // Add items if any
      if (items.length > 0) {
        for (const item of items) {
          await checklistService.addChecklistItem(checklist.id, item);
        }
      }
      
      // Navigate back to checklists page
      navigate('/checklists');
    } catch (err) {
      console.error('Error creating checklist:', err);
      alert('Failed to create checklist. Please try again.');
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
                    <option value="all">All Programs</option>
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
                    <option value="all">All Stages</option>
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
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Checklist Items</h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <Plus className="-ml-1 mr-1 h-4 w-4" />
                  Add Item
                </button>
              </div>
              
              {items.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No items added yet. Click "Add Item" to create checklist items.
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-medium text-gray-900">Item #{index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor={`item-title-${index}`} className="block text-sm font-medium text-gray-700">
                            Title *
                          </label>
                          <input
                            type="text"
                            id={`item-title-${index}`}
                            value={item.title}
                            onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`item-description-${index}`} className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id={`item-description-${index}`}
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            rows={2}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor={`item-phase-${index}`} className="block text-sm font-medium text-gray-700">
                              Phase
                            </label>
                            <select
                              id={`item-phase-${index}`}
                              value={item.phase}
                              onChange={(e) => handleItemChange(index, 'phase', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              <option value="prepare">Prepare</option>
                              <option value="orient">Orient</option>
                              <option value="land">Land</option>
                              <option value="integrate">Integrate</option>
                              <option value="excel">Excel</option>
                            </select>
                          </div>
                          
                          <div>
                            <label htmlFor={`item-controlledBy-${index}`} className="block text-sm font-medium text-gray-700">
                              Controlled By
                            </label>
                            <select
                              id={`item-controlledBy-${index}`}
                              value={item.controlledBy}
                              onChange={(e) => handleItemChange(index, 'controlledBy', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              <option value="hr">HR Only</option>
                              <option value="employee">Employee Only</option>
                              <option value="both">Both</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id={`item-required-${index}`}
                            type="checkbox"
                            checked={item.isRequired}
                            onChange={(e) => handleItemChange(index, 'isRequired', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`item-required-${index}`} className="ml-2 block text-sm text-gray-700">
                            Required
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
      </div>
    </Layout>
  );
};

export default ChecklistCreate;