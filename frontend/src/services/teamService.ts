import api from './api';

export interface Team {
  id: string;
  name: string;
  description?: string;
  managerId: string;
  departmentId?: string;
  members?: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamSettings {
  reportFilters: Record<string, any>;
  coachingAlertsEnabled: boolean;
}

const teamService = {
  getTeams: async (): Promise<Team[]> => {
    const response = await api.get('/teams');
    return response.data;
  },

  getTeam: async (id: string): Promise<Team> => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  createTeam: async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> => {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  updateTeam: async (id: string, teamData: Partial<Team>): Promise<Team> => {
    const response = await api.put(`/teams/${id}`, teamData);
    return response.data;
  },

  deleteTeam: async (id: string): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },

  getTeamSettings: async (): Promise<TeamSettings> => {
    const response = await api.get('/teams/settings');
    return response.data;
  },

  updateTeamSettings: async (settings: TeamSettings): Promise<TeamSettings> => {
    const response = await api.put('/teams/settings', settings);
    return response.data;
  }
};

export default teamService;