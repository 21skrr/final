// services/hrAssessmentService.ts
import api from './api';
import {
  HRAssessment,
  HRAssessmentListResponse,
  HRAssessmentResponse,
  ConductAssessmentFormData,
  MakeDecisionFormData,
  ConductAssessmentResponse,
  MakeDecisionResponse,
} from '../types/hrAssessment';

class HRAssessmentService {
  // Get pending HR assessments
  async getPendingAssessments(): Promise<HRAssessmentListResponse> {
    const response = await api.get('/hr-assessments/pending');
    return response.data;
  }

  // Get HR assessments by HR user
  async getHRAssessments(hrId: string): Promise<HRAssessmentListResponse> {
    const response = await api.get(`/hr-assessments/hr/${hrId}`);
    return response.data;
  }

  // Get HR assessment details
  async getAssessment(assessmentId: string): Promise<HRAssessmentResponse> {
    const response = await api.get(`/hr-assessments/${assessmentId}`);
    return response.data;
  }

  // Conduct HR assessment
  async conductAssessment(
    assessmentId: string,
    data: ConductAssessmentFormData
  ): Promise<ConductAssessmentResponse> {
    const response = await api.post(`/hr-assessments/${assessmentId}/conduct-assessment`, data);
    return response.data;
  }

  // Make HR decision
  async makeDecision(
    assessmentId: string,
    data: MakeDecisionFormData
  ): Promise<MakeDecisionResponse> {
    const response = await api.post(`/hr-assessments/${assessmentId}/make-decision`, data);
    return response.data;
  }

  // Initialize HR assessment
  async initializeAssessment(userId: string, hrId: string): Promise<{ message: string; assessment: HRAssessment }> {
    const response = await api.post(`/hr-assessments/initialize/${userId}`, { hrId });
    return response.data;
  }

  // Helper methods for status checking
  isAssessmentPending(assessment: HRAssessment): boolean {
    return assessment.status === 'pending_assessment';
  }

  isAssessmentCompleted(assessment: HRAssessment): boolean {
    return assessment.status === 'assessment_completed';
  }

  isDecisionMade(assessment: HRAssessment): boolean {
    return assessment.status === 'decision_made' || assessment.status === 'completed';
  }

  isApproved(assessment: HRAssessment): boolean {
    return assessment.hrDecision === 'approve';
  }

  isRejected(assessment: HRAssessment): boolean {
    return assessment.hrDecision === 'reject';
  }

  getStatusDisplayText(assessment: HRAssessment): string {
    switch (assessment.status) {
      case 'pending_assessment':
        return 'Assessment Pending';
      case 'assessment_completed':
        return 'Assessment Completed';
      case 'decision_pending':
        return 'Decision Pending';
      case 'decision_made':
        return assessment.hrDecision === 'approve' ? 'Approved' : 'Rejected';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown Status';
    }
  }

  getStatusColor(assessment: HRAssessment): string {
    switch (assessment.status) {
      case 'pending_assessment':
        return 'text-yellow-600 bg-yellow-100';
      case 'assessment_completed':
        return 'text-blue-600 bg-blue-100';
      case 'decision_pending':
        return 'text-purple-600 bg-purple-100';
      case 'decision_made':
        return assessment.hrDecision === 'approve' 
          ? 'text-green-600 bg-green-100' 
          : 'text-red-600 bg-red-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  canConductAssessment(assessment: HRAssessment): boolean {
    return assessment.status === 'pending_assessment';
  }

  canMakeDecision(assessment: HRAssessment): boolean {
    return assessment.status === 'assessment_completed';
  }
}

export default new HRAssessmentService(); 