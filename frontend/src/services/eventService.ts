import api from './api';

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateEventRequest {
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  type: string;
  description?: string;
}

const eventService = {
  getEvents: async (): Promise<Event[]> => {
    const response = await api.get('/events');
    return response.data;
  },

  getEvent: async (id: string): Promise<Event> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (eventData: CreateEventRequest): Promise<Event> => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (id: string, eventData: Partial<CreateEventRequest>): Promise<Event> => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  }
};

export default eventService;