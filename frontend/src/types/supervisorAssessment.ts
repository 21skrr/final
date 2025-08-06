// types/supervisorAssessment.ts

export type AssessmentStatus = 
  | "pending_certificate"
  | "certificate_uploaded"
  | "assessment_pending"
  | "assessment_completed"
  | "decision_pending"
  | "decision_made"
  | "hr_approval_pending"
  | "hr_approved"
  | "hr_rejected"
  | "completed";

export type HRDecision = "approve" | "reject" | "request_changes";

export type SupervisorDecision = "proceed_to_phase_2" | "terminate" | "put_on_hold";

export interface SupervisorAssessment {
  id: string;
  OnboardingProgressId: string;
  UserId: string;
  SupervisorId: string;
  
  // Certificate upload
  certificateFile?: string;
  certificateUploadDate?: string;
  
  // Assessment details
  assessmentDate?: string;
  assessmentNotes?: string;
  assessmentScore?: number;
  
  // Supervisor decision
  supervisorDecision?: SupervisorDecision;
  supervisorComments?: string;
  decisionDate?: string;
  
  // HR decision
  hrDecision?: HRDecision;
  hrDecisionComments?: string;
  hrDecisionDate?: string;
  hrValidatorId?: string;
  
  // Status tracking
  status: AssessmentStatus;
  
  // Timestamps for workflow tracking
  phase1CompletedDate?: string;
  assessmentRequestedDate?: string;
  
  // Associated data
  employee?: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  supervisor?: {
    id: string;
    name: string;
    email: string;
  };
  hrValidator?: {
    id: string;
    name: string;
    email: string;
  };
  onboardingProgress?: {
    id: string;
    stage: string;
    progress: number;
    journeyType: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentFormData {
  assessmentNotes: string;
  assessmentScore?: number;
}

export interface DecisionFormData {
  decision: SupervisorDecision;
  comments: string;
}

export interface HRApprovalFormData {
  decision: HRDecision;
  comments: string;
}

export interface CertificateUploadResponse {
  message: string;
  certificateFile: string;
}

export interface AssessmentResponse {
  message: string;
  assessment: {
    id: string;
    assessmentNotes: string;
    assessmentScore?: number;
    assessmentDate: string;
    status: AssessmentStatus;
  };
}

export interface DecisionResponse {
  message: string;
  decision: {
    supervisorDecision: SupervisorDecision;
    supervisorComments: string;
    decisionDate: string;
    status: AssessmentStatus;
  };
}

export interface HRApprovalResponse {
  message: string;
  decision: {
    hrDecision: HRDecision;
    hrDecisionComments: string;
    hrDecisionDate: string;
    status: AssessmentStatus;
  };
}

export interface AssessmentListResponse {
  assessments: SupervisorAssessment[];
}

export interface AssessmentDetailResponse {
  assessment: SupervisorAssessment;
} 