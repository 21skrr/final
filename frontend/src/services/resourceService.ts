import api from './api';
import { Resource } from '../types/resource';

const resourceService = {
  // ── Employee ────────────────────────────────────────────────────────────────

  /** All publicly published documents */
  getPublicResources: async (): Promise<Resource[]> => {
    const response = await api.get('/resources/public');
    return response.data;
  },

  /** Documents explicitly assigned to the current user */
  getAssignedResources: async () => {
    const response = await api.get('/resources/my-resources');
    return response.data;
  },

  /** View a specific resource (logs view activity) */
  getResourceById: async (id: string): Promise<Resource> => {
    const response = await api.get(`/resources/${id}`);
    return response.data;
  },

  /** Mark a resource as read/acknowledged */
  acknowledgeResource: async (id: string) => {
    const response = await api.post(`/resources/${id}/acknowledge`);
    return response.data;
  },

  /** Check if already acknowledged */
  getAcknowledgeStatus: async (id: string): Promise<{ acknowledged: boolean }> => {
    const response = await api.get(`/resources/${id}/acknowledge-status`);
    return response.data;
  },

  // ── Supervisor ──────────────────────────────────────────────────────────────

  /** Documents for the supervisor's team */
  getTeamResources: async () => {
    const response = await api.get('/resources/team');
    return response.data;
  },

  /** Assign specific resources to specific employees */
  assignResources: async (data: {
    employeeIds: string[];
    resourceIds: string[];
    dueDate?: string;
  }) => {
    const response = await api.post('/resources/assign', data);
    return response.data;
  },

  /** View resource usage for a specific employee */
  getEmployeeResources: async (employeeId: string) => {
    const response = await api.get(`/resources/usage?employeeId=${employeeId}`);
    return response.data;
  },

  // ── Manager ─────────────────────────────────────────────────────────────────

  /** Department-scoped documents */
  getDepartmentResources: async () => {
    const response = await api.get('/resources/department');
    return response.data;
  },

  getResourceSummary: async () => {
    const response = await api.get('/resources/summary');
    return response.data;
  },

  getResourceRecommendations: async () => {
    const response = await api.get('/resources/recommendations');
    return response.data;
  },

  // ── HR ──────────────────────────────────────────────────────────────────────

  /** All resources (HR management) */
  getAllResources: async () => {
    const response = await api.get('/resources');
    return response.data;
  },

  /** Upload a PDF document (multipart/form-data) */
  uploadPDF: async (formData: FormData) => {
    const response = await api.post('/resources/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** Create a URL-based resource (legacy) */
  createResource: async (resourceData: Omit<Resource, 'id'>) => {
    const response = await api.post('/resources', resourceData);
    return response.data;
  },

  /** Update resource metadata */
  updateResource: async (id: string, resourceData: Partial<Resource>) => {
    const response = await api.put(`/resources/${id}`, resourceData);
    return response.data;
  },

  /** Delete a resource */
  deleteResource: async (id: string) => {
    const response = await api.delete(`/resources/${id}`);
    return response.data;
  },

  /** Resource analytics */
  getResourceAnalytics: async () => {
    const response = await api.get('/resources/analytics');
    return response.data;
  },

  // Kept for backward compat
  trackResourceDownload: async (id: string) => {
    const response = await api.get(`/resources/${id}`);
    return { downloadUrl: response.data?.url };
  },
};

export default resourceService;
