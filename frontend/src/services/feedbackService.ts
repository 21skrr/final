import api from './api';

const feedbackService = {
  getMyFeedbackHistory: async () => {
    const response = await api.get('/feedback/history');
    return response.data.feedback;
  },

  submitFeedback: async (feedbackData: {
    type: string;
    content: string;
    isAnonymous: boolean;
    shareWithSupervisor: boolean;
  }) => {
    const response = await api.post('/feedback', feedbackData);
    return response.data;
  },
};

export default feedbackService;