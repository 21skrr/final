import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location: string;
  type: string;
  createdBy?: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const eventsService = {
  // Get all events
  getAllEvents: async (filters?: { startDate?: string; endDate?: string }) => {
    const response = await axios.get(`${API_BASE_URL}/api/events`, {
      params: filters,
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get a specific event
  getEvent: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/api/events/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Create a new event (HR/Manager only)
  createEvent: async (event: Omit<Event, 'id'>) => {
    const response = await axios.post(`${API_BASE_URL}/api/events`, event, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update an event (HR/Manager only)
  updateEvent: async (id: string, event: Partial<Event>) => {
    const response = await axios.put(`${API_BASE_URL}/api/events/${id}`, event, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Delete an event (HR/Manager only)
  deleteEvent: async (id: string) => {
    const response = await axios.delete(`${API_BASE_URL}/api/events/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  }
}; 