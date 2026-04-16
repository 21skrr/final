export type FeedbackType =
  | 'onboarding'
  | 'training'
  | 'support'
  | 'general'
  | 'holiday_request'
  | 'administrative_paper';

export type FeedbackStatus =
  | 'pending'
  | 'pending_supervisor'
  | 'pending_hr'
  | 'supervisor_rejected'
  | 'hr_rejected'
  | 'approved'
  | 'in-progress'
  | 'addressed';

export type FeedbackPriority = 'low' | 'medium' | 'high';
export type FeedbackCategory = 'training' | 'supervisor' | 'process';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Feedback {
  id: string;
  fromUserId: string;
  toUserId?: string;
  toDepartment?: string;
  type: FeedbackType;
  message: string;
  isAnonymous: boolean;
  status: FeedbackStatus;
  categories?: FeedbackCategory[];
  priority?: FeedbackPriority;
  createdAt: string;
  updatedAt: string;
  // Approval workflow fields
  supervisorApprovalStatus?: ApprovalStatus | null;
  supervisorRejectionReason?: string | null;
  hrApprovalStatus?: ApprovalStatus | null;
  hrRejectionReason?: string | null;
  sender?: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
  notes?: FeedbackNote[];
}

export interface FeedbackNote {
  id: string;
  feedbackId: string;
  supervisorId: string;
  note: string;
  status: FeedbackStatus;
  createdAt: string;
  supervisor?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface FeedbackResponse {
  response: string;
  status: FeedbackStatus;
}

export interface FeedbackCategorization {
  categories: FeedbackCategory[];
  priority: FeedbackPriority;
  status: FeedbackStatus;
}

export interface FeedbackEscalation {
  escalateTo: 'manager' | 'hr';
  reason: string;
  notifyParties: ('supervisor' | 'hr')[];
}

export interface FeedbackAnalytics {
  overview: {
    totalFeedback: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  byType: Array<{
    type: FeedbackType;
    count: number;
  }>;
  byUser: Array<{
    fromUserId: string;
    toUserId: string;
    count: number;
    sender: { name: string };
    receiver: { name: string };
  }>;
  trend: Array<{
    date: string;
    count: number;
  }>;
}

export interface CreateFeedbackRequest {
  content: string;
  type: FeedbackType;
  isAnonymous: boolean;
  shareWithSupervisor: boolean;
  priority: FeedbackPriority;
}

export interface FeedbackFilters {
  startDate?: string;
  endDate?: string;
  type?: FeedbackType;
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  priority?: FeedbackPriority;
}

export interface FeedbackExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  dateRange?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: 'all' | FeedbackType;
}

// Human-readable labels for request types
export const REQUEST_TYPE_LABELS: Record<FeedbackType, string> = {
  onboarding: 'Onboarding Process',
  training: 'Training & Development',
  support: 'Support & Resources',
  general: 'General Feedback',
  holiday_request: 'Holiday Request',
  administrative_paper: 'Administrative Paper Request',
};

// Types that go through special approval workflows (no anonymous)
export const SPECIAL_REQUEST_TYPES: FeedbackType[] = ['holiday_request', 'administrative_paper'];