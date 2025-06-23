import api from './api';
import { Resource } from '../types/resource';

const resourceService = {
  // Employee
  getAssignedResources: async () => {
    const response = await api.get('/resources/my-resources');
    return response.data;
  },

  // HR
  getAllResources: async () => {
    const response = await api.get('/resources');
    return response.data;
  },
  createResource: async (resourceData: Omit<Resource, 'id'>) => {
    const response = await api.post('/resources', resourceData);
    return response.data;
  },
  updateResource: async (id: string, resourceData: Partial<Resource>) => {
    const response = await api.put(`/resources/${id}`, resourceData);
    return response.data;
  },
  deleteResource: async (id: string) => {
    const response = await api.delete(`/resources/${id}`);
    return response.data;
  },

  // Supervisor
  assignResources: async (assignmentData: { employeeIds: string[], resourceIds: string[], dueDate?: string }) => {
    const response = await api.post('/resources/assign', assignmentData);
    return response.data;
  },

  // Manager
  getResourceSummary: async () => {
    const response = await api.get('/resources/summary');
    return response.data;
  },
};

export default resourceService;
