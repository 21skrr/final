import api from './api';
import { Evaluation, EvaluationCriteria } from '../types/evaluation';

// Employee
export const getUserEvaluations = async () => api.get('/evaluations/user');
export const getEvaluationById = async (id: string) => api.get(`/evaluations/${id}`);
export const addEmployeeCommentToEvaluation = async (id: string, comment: string, criteria?: any[]) => api.patch(`/evaluations/${id}/comment`, criteria ? { comment, criteria } : { comment });

// Supervisor
export const getSupervisorEvaluations = async () => api.get('/evaluations');
export const createEvaluation = async (data: any) => api.post('/evaluations', data);
export const updateEvaluation = async (id: string, data: any) => api.put(`/evaluations/${id}`, data);
export const updateEvaluationComments = async (id: string, comments: string) => api.patch(`/evaluations/${id}/comments`, { comments });
export const addEvaluationCriteria = async (evaluationId: string, data: any) => api.post(`/evaluations/${evaluationId}/criteria`, data);
export const updateEvaluationCriteria = async (id: string, data: any) => api.put(`/evaluationcriteria/${id}`, data);
export const deleteEvaluationCriteria = async (id: string) => api.delete(`/evaluationcriteria/${id}`);
export const submitEvaluation = async (id: string, data: any) => api.patch(`/evaluations/${id}/submit`, data);
export const getSupervisorByIdEvaluations = async (id: string) => api.get(`/supervisors/${id}/evaluations`);

// Manager
export const getManagerEvaluations = async () => api.get('/evaluations');
export const validateEvaluation = async (id: string, data: any) => api.patch(`/evaluations/${id}/validate`, data);
export const getEvaluationReports = async () => api.get('/reports/evaluations');

// HR
export const getAllEvaluations = async () => api.get('/evaluations');
export const editEvaluation = async (id: string, data: any) => api.put(`/evaluations/${id}`, data);
export const deleteEvaluation = async (id: string) => api.delete(`/evaluations/${id}`);
export const getEvaluationCriteria = async (evaluationId: string) => api.get(`/evaluations/${evaluationId}/criteria`);
export const getEmployeeEvaluations = async (id: string) => api.get(`/employees/${id}/evaluations`); 