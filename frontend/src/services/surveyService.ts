import api from './api';
import { Survey, SurveySubmission } from '../types/survey';

const surveyService = {
  // ----------- EMPLOYEE ENDPOINTS -----------

  /**
   * Fetches all surveys available to the currently logged-in user.
   */
  getAvailableSurveys: (): Promise<Survey[]> => {
    return api.get('/surveys/available');
  },

  /**
   * Fetches the details for a single survey, including its questions.
   * @param surveyId - The ID of the survey to fetch.
   */
  getSurveyDetails: (surveyId: string): Promise<Survey> => {
    return api.get(`/surveys/${surveyId}`);
  },

  /**
   * Submits a user's response to a specific survey.
   * @param surveyId - The ID of the survey being responded to.
   * @param responses - The user's responses.
   */
  submitSurveyResponse: (surveyId: string, responses: SurveySubmission): Promise<any> => {
    return api.post(`/surveys/${surveyId}/respond`, responses);
  },

  /**
   * Fetches the survey history for the logged-in user.
   */
  getSurveyHistory: (): Promise<Survey[]> => {
    return api.get('/surveys/history');
  },

  // ----------- SUPERVISOR ENDPOINTS -----------

  /**
   * Fetches survey results for the supervisor's team.
   * @param params - Optional query parameters like view, employeeId, startDate, endDate.
   */
  getTeamSurveyResults: (params?: any): Promise<any> => {
    return api.get('/surveys/team/results', { params });
  },

  /**
   * Fetches the completion status for team surveys.
   * @param params - Optional query parameters like status.
   */
  getTeamSurveyCompletionStatus: (params?: any): Promise<any> => {
    return api.get('/surveys/team/completion-status', { params });
  },

  // ----------- MANAGER ENDPOINTS -----------

  /**
   * Fetches survey analytics for the manager's department.
   * @param params - Optional query parameters like startDate, endDate, surveyType.
   */
  getDepartmentSurveyAnalytics: (params?: any): Promise<any> => {
    return api.get('/surveys/department/analytics', { params });
  },

  /**
   * Fetches generated insights for department surveys.
   */
  getDepartmentSurveyInsights: (): Promise<any> => {
    return api.get('/surveys/department/insights');
  },

  // ----------- HR ENDPOINTS -----------

  /**
   * Fetches all survey templates.
   */
  getSurveyTemplates: (): Promise<any[]> => {
    return api.get('/surveys/templates');
  },

  /**
   * Creates a new survey template.
   * @param templateData - The data for the new template.
   */
  createSurveyTemplate: (templateData: any): Promise<any> => {
    return api.post('/surveys/templates', templateData);
  },

  /**
   * Updates an existing survey template.
   * @param templateId - The ID of the template to update.
   * @param templateData - The updated template data.
   */
  updateSurveyTemplate: (templateId: string, templateData: any): Promise<any> => {
    return api.put(`/surveys/templates/${templateId}`, templateData);
  },

  /**
   * Deletes a survey template.
   * @param templateId - The ID of the template to delete.
   */
  deleteSurveyTemplate: (templateId: string): Promise<any> => {
    return api.delete(`/surveys/templates/${templateId}`);
  },

  /**
   * Schedules a survey for distribution.
   * @param scheduleData - The scheduling details.
   */
  scheduleSurvey: (scheduleData: any): Promise<any> => {
    return api.post('/surveys/schedule', scheduleData);
  },

  /**
   * Monitors survey participation across the organization.
   * @param params - Optional query parameters like surveyId, department, startDate.
   */
  monitorSurveyParticipation: (params?: any): Promise<any> => {
    return api.get('/surveys/monitoring', { params });
  },

  /**
   * Exports survey results.
   * @param params - Optional query parameters like format, surveyId, dateRange.
   */
  exportSurveyResults: (params?: any): Promise<any> => {
    return api.get('/surveys/export', { params });
  },

  /**
   * Updates global survey settings.
   * @param settingsData - The new settings.
   */
  updateSurveySettings: (settingsData: any): Promise<any> => {
    return api.put('/surveys/settings', settingsData);
  },

  /**
   * Fetches global survey settings.
   */
  getSurveySettings: (): Promise<any> => {
    return api.get('/surveys/settings');
  },

  // ----------- HR QUESTION ENDPOINTS -----------
  /**
   * Fetches all questions for a survey template.
   */
  getSurveyTemplateQuestions: (templateId: string): Promise<any[]> => {
    return api.get(`/surveys/templates/${templateId}/questions`);
  },
  /**
   * Creates a new question for a survey template.
   */
  createSurveyTemplateQuestion: (templateId: string, questionData: any): Promise<any> => {
    return api.post(`/surveys/templates/${templateId}/questions`, questionData);
  },
  /**
   * Deletes a question from a survey template.
   */
  deleteSurveyTemplateQuestion: (templateId: string, questionId: string): Promise<any> => {
    return api.delete(`/surveys/templates/${templateId}/questions/${questionId}`);
  },

  /**
   * Fetches all survey schedules.
   */
  getSurveySchedules: (): Promise<any[]> => {
    return api.get('/surveys/schedule');
  },

  /**
   * Deletes a survey schedule.
   */
  deleteSurveySchedule: (scheduleId: string): Promise<any> => {
    return api.delete(`/surveys/schedule/${scheduleId}`);
  },
};

export default surveyService; 