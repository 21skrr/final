import api from './api';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

const checklistService = {
  // Get all checklists
  getChecklists: async (): Promise<Checklist[]> => {
    // ✅ CORRECT
    const response = await api.get('/checklists');
    return response.data;
  },

  // Get checklist by ID
  getChecklist: async (id: string): Promise<Checklist> => {
    const response = await api.get(`/checklists/${id}`);
    return response.data;
  },

  // Create new checklist
  createChecklist: async (checklist: Omit<Checklist, 'id'>): Promise<Checklist> => {
    const response = await api.post('/checklists', checklist);
    return response.data;
  },

  // Update checklist
  updateChecklist: async (id: string, checklist: Partial<Checklist>): Promise<Checklist> => {
    const response = await api.put(`/checklists/${id}`, checklist);
    return response.data;
  },

  // Delete checklist
  deleteChecklist: async (id: string): Promise<void> => {
    await api.delete(`/checklists/${id}`);
  }
};

export default checklistService;