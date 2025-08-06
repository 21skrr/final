// services/supervisorAssessmentService.ts
import api from "./api";
import {
  SupervisorAssessment,
  AssessmentFormData,
  DecisionFormData,
  HRApprovalFormData,
  CertificateUploadResponse,
  AssessmentResponse,
  DecisionResponse,
  HRApprovalResponse,
  AssessmentListResponse,
  AssessmentDetailResponse,
} from "../types/supervisorAssessment";

class SupervisorAssessmentService {
  // Initialize assessment when Phase 1 is completed
  async initializeAssessment(userId: string, supervisorId: string): Promise<any> {
    const response = await api.post(`/supervisor-assessments/initialize/${userId}`, {
      supervisorId,
    });
    return response.data;
  }

  // Upload certificate
  async uploadCertificate(assessmentId: string, file: File): Promise<CertificateUploadResponse> {
    const formData = new FormData();
    formData.append("certificate", file);

    const response = await api.post(`/supervisor-assessments/${assessmentId}/upload-certificate`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  // Conduct assessment
  async conductAssessment(assessmentId: string, data: AssessmentFormData): Promise<AssessmentResponse> {
    const response = await api.post(`/supervisor-assessments/${assessmentId}/conduct-assessment`, data);
    return response.data;
  }

  // Make supervisor decision
  async makeDecision(assessmentId: string, data: DecisionFormData): Promise<DecisionResponse> {
    const response = await api.post(`/supervisor-assessments/${assessmentId}/make-decision`, data);
    return response.data;
  }

  // HR approval
  async hrApprove(assessmentId: string, data: HRApprovalFormData): Promise<HRApprovalResponse> {
    const response = await api.post(`/supervisor-assessments/${assessmentId}/hr-approve`, data);
    return response.data;
  }

  // Get assessment details
  async getAssessment(assessmentId: string): Promise<AssessmentDetailResponse> {
    const response = await api.get(`/supervisor-assessments/${assessmentId}`);
    return response.data;
  }

  // Get assessments by supervisor
  async getSupervisorAssessments(supervisorId: string): Promise<AssessmentListResponse> {
    const response = await api.get(`/supervisor-assessments/supervisor/${supervisorId}`);
    return response.data;
  }

  // Get assessments pending HR approval
  async getPendingHRApproval(): Promise<AssessmentListResponse> {
    const response = await api.get("/supervisor-assessments/pending-hr-approval");
    return response.data;
  }

  // Get assessments pending HR validation (legacy method)
  async getPendingHRValidation(): Promise<AssessmentListResponse> {
    const response = await api.get("/supervisor-assessments/pending-hr-approval");
    return response.data;
  }

  // Helper methods for status checks
  isCertificateUploaded(status: string): boolean {
    return status === "certificate_uploaded" || 
           status === "assessment_pending" || 
           status === "assessment_completed" || 
           status === "decision_pending" || 
           status === "decision_made" || 
           status === "hr_validation_pending" || 
           status === "hr_validated" || 
           status === "completed";
  }

  isAssessmentCompleted(status: string): boolean {
    return status === "assessment_completed" || 
           status === "decision_pending" || 
           status === "decision_made" || 
           status === "hr_approval_pending" || 
           status === "hr_approved" || 
           status === "hr_rejected" || 
           status === "completed";
  }

  isDecisionMade(status: string): boolean {
    return status === "decision_made" || 
           status === "hr_approval_pending" || 
           status === "hr_approved" || 
           status === "hr_rejected" || 
           status === "completed";
  }

  isHRApproved(status: string): boolean {
    return status === "hr_approved" || status === "completed";
  }

  // Get status display text
  getStatusDisplayText(status: string): string {
    const statusMap: Record<string, string> = {
      pending_certificate: "Pending Certificate Upload",
      certificate_uploaded: "Certificate Uploaded",
      assessment_pending: "Assessment Pending",
      assessment_completed: "Assessment Completed",
      decision_pending: "Decision Pending",
      decision_made: "Decision Made",
      hr_approval_pending: "Waiting for HR Approval",
      hr_approved: "HR Approved",
      hr_rejected: "HR Rejected",
      completed: "Completed",
    };
    return statusMap[status] || status;
  }

  // Get decision display text
  getDecisionDisplayText(decision?: string): string {
    const decisionMap: Record<string, string> = {
      proceed_to_phase_2: "Proceed to Phase 2",
      terminate: "Terminate",
      put_on_hold: "Put on Hold",
    };
    return decision ? decisionMap[decision] || decision : "Not decided";
  }

  // Get status color for UI
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      pending_certificate: "orange",
      certificate_uploaded: "blue",
      assessment_pending: "purple",
      assessment_completed: "cyan",
      decision_pending: "gold",
      decision_made: "green",
      hr_approval_pending: "volcano",
      hr_approved: "success",
      hr_rejected: "error",
      completed: "success",
    };
    return colorMap[status] || "default";
  }

  // Get decision color for UI
  getDecisionColor(decision?: string): string {
    const colorMap: Record<string, string> = {
      proceed_to_phase_2: "success",
      terminate: "error",
      put_on_hold: "warning",
    };
    return decision ? colorMap[decision] || "default" : "default";
  }

  // Check if user can upload certificate
  canUploadCertificate(status: string, userRole: string): boolean {
    return status === "pending_certificate" && ["supervisor", "manager"].includes(userRole);
  }

  // Check if user can conduct assessment
  canConductAssessment(status: string, userRole: string): boolean {
    return status === "certificate_uploaded" && ["supervisor", "manager"].includes(userRole);
  }

  // Check if user can make decision
  canMakeDecision(status: string, userRole: string): boolean {
    return status === "assessment_completed" && ["supervisor", "manager"].includes(userRole);
  }

  // Check if user can approve (HR only)
  canApprove(status: string, userRole: string): boolean {
    return status === "hr_approval_pending" && userRole === "hr";
  }

  // Get next action for the workflow
  getNextAction(status: string, userRole: string): string {
    if (this.canUploadCertificate(status, userRole)) {
      return "Upload Certificate";
    }
    if (this.canConductAssessment(status, userRole)) {
      return "Conduct Assessment";
    }
    if (this.canMakeDecision(status, userRole)) {
      return "Make Decision";
    }
    if (this.canApprove(status, userRole)) {
      return "HR Approval";
    }
    return "No action available";
  }
}

export default new SupervisorAssessmentService(); 