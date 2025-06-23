import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import checklistService from '../services/checklistService';

const PHASES = ['prepare', 'orient', 'land', 'integrate', 'excel'];

const HRChecklistPhaseManager: React.FC = () => {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>({});

  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        const data = await checklistService.getChecklists();
        setChecklists(data);
      } catch (err) {
        setChecklists([]);
      }
    };
    fetchChecklists();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedChecklist) return;
      setLoading(true);
      setError(null);
      try {
        const data = await checklistService.getChecklistItems(selectedChecklist);
        setItems(data);
      } catch (err) {
        setError('Failed to load items.');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [selectedChecklist]);

  const handleEdit = (item: any) => {
    setEditItemId(item.id);
    setEditItem({ ...item });
  };

  const handleEditChange = (field: string, value: any) => {
    setEditItem((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!editItemId) return;
    setLoading(true);
    try {
      await checklistService.updateChecklistItem(editItemId, selectedChecklist, editItem);
      setItems(items.map(i => (i.id === editItemId ? { ...i, ...editItem } : i)));
      setEditItemId(null);
      setEditItem({});
    } catch (err) {
      setError('Failed to update item.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Delete this item?')) return;
    setLoading(true);
    try {
      await checklistService.deleteChecklistItem(itemId);
      setItems(items.filter(i => i.id !== itemId));
    } catch (err) {
      setError('Failed to delete item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Phase-based Checklist Item Management</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Checklist</label>
          <select value={selectedChecklist} onChange={e => setSelectedChecklist(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 max-w-md">
            <option value="">Select a checklist</option>
            {checklists.map((c: any) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>
        ) : selectedChecklist ? (
          <div className="space-y-8">
            {PHASES.map(phase => (
              <div key={phase}>
                <h2 className="text-lg font-bold text-gray-800 mb-2 capitalize">{phase} phase</h2>
                <div className="space-y-2">
                  {items.filter(i => i.phase === phase).length === 0 ? (
                    <div className="text-gray-400">No items in this phase.</div>
                  ) : (
                    items.filter(i => i.phase === phase).map(item => (
                      <div key={item.id} className="bg-white border rounded-md p-4 flex items-center justify-between">
                        {editItemId === item.id ? (
                          <>
                            <input type="text" value={editItem.title} onChange={e => handleEditChange('title', e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 mr-2" />
                            <input type="text" value={editItem.description} onChange={e => handleEditChange('description', e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 mr-2" />
                            <button onClick={handleEditSave} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm mr-2">Save</button>
                            <button onClick={() => setEditItemId(null)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm">Cancel</button>
                          </>
                        ) : (
                          <>
                            <div>
                              <div className="font-medium text-gray-900">{item.title}</div>
                              <div className="text-sm text-gray-500">{item.description}</div>
                            </div>
                            <div className="flex space-x-2">
                              <button onClick={() => handleEdit(item)} className="px-3 py-1 bg-yellow-400 text-white rounded-md text-sm">Edit</button>
                              <button onClick={() => handleDelete(item.id)} className="px-3 py-1 bg-red-500 text-white rounded-md text-sm">Delete</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default HRChecklistPhaseManager; 