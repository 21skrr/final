import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import checklistService from '../services/checklistService';
import { ChecklistItem } from '../types/checklist';

type ChecklistCombined = {
  id: string;
  checklistId: string;
  title: string;
  description?: string;
  programType?: string;
  stage?: string;
  // add other fields as needed
};

const ChecklistEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [programType, setProgramType] = useState('inkompass');
  const [stage, setStage] = useState('prepare');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchChecklist = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch checklist_combined record by id
        const checklistCombined = await checklistService.getChecklist(id) as unknown as ChecklistCombined;
        setTitle(checklistCombined.title || '');
        setDescription(checklistCombined.description || '');
        setProgramType(checklistCombined.programType || 'inkompass');
        setStage(checklistCombined.stage || 'prepare');
        setChecklistId(checklistCombined.checklistId || id);
        // Fetch items using checklistId
        try {
          const fetchedItems = await checklistService.getChecklistItems(checklistCombined.checklistId || id);
          setItems(Array.isArray(fetchedItems) ? fetchedItems : []);
        } catch {
          // If 404 or no items, just show empty list
          setItems([]);
        }
      } catch (err) {
        console.error('Failed to load checklist:', err);
        alert('Failed to load checklist.');
        navigate('/checklists');
      } finally {
        setLoading(false);
      }
    };
    fetchChecklist();
  }, [id, navigate]);

  if (user?.role !== 'hr') {
    navigate('/dashboard');
    return null;
  }

  const handleItemChange = <K extends keyof ChecklistItem>(
    index: number,
    field: K,
    value: ChecklistItem[K]
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

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
        phase: stage,
        checklistId: checklistId || '',
        createdAt: '',
        updatedAt: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const item = items[index];
    if (item.id) {
      setDeletedItemIds(prev => [...prev, item.id]);
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Delete removed items first
      for (const itemId of deletedItemIds) {
        await checklistService.deleteChecklistItem(itemId);
      }
      // Update checklist_combined template info using checklistId
      await checklistService.updateChecklistTemplate(checklistId!, {
        title,
        description,
        programType,
        stage,
      });
      // Update or create items using checklistId
      for (const [index, item] of items.entries()) {
        if (item.id) {
          await checklistService.updateChecklistItem(item.id, checklistId!, {
            ...item,
            orderIndex: index,
          });
        } else {
          await checklistService.addChecklistItem(checklistId!, {
            ...item,
            orderIndex: index,
          });
        }
      }
      alert('Checklist updated!');
      navigate('/checklists');
    } finally {
      setSaving(false);
      setDeletedItemIds([]);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center">
          <button onClick={() => navigate('/checklists')} className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Checklist</h1>
            <p className="mt-1 text-sm text-gray-500">Edit checklist template and its items</p>
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Checklist Title *</label>
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="programType" className="block text-sm font-medium text-gray-700">Program Type</label>
                  <select id="programType" value={programType} onChange={e => setProgramType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="inkompass">INKOMPASS</option>
                    <option value="earlyTalent">Early Talent</option>
                    <option value="apprenticeship">Apprenticeship</option>
                    <option value="academicPlacement">Academic Placement</option>
                    <option value="workExperience">Work Experience</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="stage" className="block text-sm font-medium text-gray-700">Stage</label>
                  <select id="stage" value={stage} onChange={e => setStage(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="prepare">Prepare</option>
                    <option value="orient">Orient</option>
                    <option value="land">Land</option>
                    <option value="integrate">Integrate</option>
                    <option value="excel">Excel</option>
                  </select>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Checklist Items</h2>
                <button type="button" onClick={handleAddItem} className="mb-2 flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"><Plus className="h-4 w-4 mr-1" /> Add Item</button>
                {items.length === 0 && (
                  <div className="text-gray-500 mb-2">No items found for this checklist. Click "Add Item" to create the first one.</div>
                )}
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 mb-2">
                    <input type="text" placeholder="Title" value={item.title} onChange={e => handleItemChange(idx, 'title', e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-1/4" required />
                    <input type="text" placeholder="Description" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-1/3" />
                    <select value={item.phase || stage} onChange={e => handleItemChange(idx, 'phase', e.target.value)} className="border border-gray-300 rounded px-2 py-1">
                      <option value="prepare">Prepare</option>
                      <option value="orient">Orient</option>
                      <option value="land">Land</option>
                      <option value="integrate">Integrate</option>
                      <option value="excel">Excel</option>
                    </select>
                    <select value={item.controlledBy || 'hr'} onChange={e => handleItemChange(idx, 'controlledBy', e.target.value as 'hr' | 'employee' | 'both')} className="border border-gray-300 rounded px-2 py-1">
                      <option value="hr">HR</option>
                      <option value="employee">Employee</option>
                      <option value="both">Both</option>
                    </select>
                    <label className="flex items-center ml-2">
                      <input type="checkbox" checked={item.isRequired} onChange={e => handleItemChange(idx, 'isRequired', e.target.checked)} className="mr-1" /> Required
                    </label>
                    <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ChecklistEdit; 