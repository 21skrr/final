import api from './api';
import { Checklist, ChecklistItem } from '../types/checklist';

const checklistService = {
  // Get all checklists
  getChecklists: async (filters?: { programType?: string, stage?: string }): Promise<Checklist[]> => {
    const queryParams = new URLSearchParams();
    if (filters?.programType) queryParams.append('programType', filters.programType);
    if (filters?.stage) queryParams.append('stage', filters.stage);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get(`/checklists${query}`);
    return response.data;
  },

  // Get checklist by ID
  getChecklist: async (id: string): Promise<Checklist> => {
    const response = await api.get(`/checklists/${id}`);
    return response.data;
  },

  // Create new checklist (HR only)
  createChecklist: async (checklist: {
    title: string;
    description?: string;
    programType?: string;
    stage?: string;
    autoAssign?: boolean;
    requiresVerification?: boolean;
  }): Promise<Checklist> => {
    const response = await api.post('/checklists', checklist);
    return response.data;
  },

  // Update checklist (HR only)
  updateChecklist: async (id: string, checklist: Partial<Checklist>): Promise<Checklist> => {
    const response = await api.put(`/checklists/${id}`, checklist);
    return response.data;
  },

  // Delete checklist (HR only)
  deleteChecklist: async (id: string): Promise<void> => {
    await api.delete(`/checklists/${id}`);
  },

  // Add auto-assignment rules to a checklist (HR only)
  addAutoAssignRules: async (checklistId: string, rules: {
    programTypes?: string[];
    departments?: string[];
    dueInDays?: number;
    stages?: string[];
    autoNotify?: boolean;
  }): Promise<Checklist> => {
    const response = await api.post(`/checklists/${checklistId}/auto-assign-rules`, rules);
    return response.data;
  },

  // Add item to checklist (HR only)
  addChecklistItem: async (checklistId: string, item: {
    title: string;
    description?: string;
    isRequired?: boolean;
    orderIndex?: number;
    controlledBy?: 'hr' | 'employee' | 'both';
    phase?: string;
  }): Promise<ChecklistItem> => {
    const response = await api.post(`/checklists/${checklistId}/items`, item);
    return response.data;
  },

  // Update checklist item (HR only)
  updateChecklistItem: async (itemId: string, checklistId: string, item: Partial<ChecklistItem>): Promise<ChecklistItem> => {
    const response = await api.put(`/checklists/items/${itemId}?checklistId=${checklistId}`, item);
    return response.data;
  },

  // Delete checklist item (HR only)
  deleteChecklistItem: async (itemId: string): Promise<void> => {
    await api.delete(`/checklist-items/${itemId}`);
  },

  // Get all checklist items
  getChecklistItems: async (checklistId: string): Promise<ChecklistItem[]> => {
    const response = await api.get(`/checklists/${checklistId}/items`);
    return response.data;
  }
};

export default checklistService;