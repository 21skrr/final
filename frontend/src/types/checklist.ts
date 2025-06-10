export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  orderIndex: number;
  phase?: string;
  controlledBy?: 'hr' | 'employee' | 'both';
  checklistId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  title: string;
  description?: string;
  programType?: string;
  stage?: string;
  autoAssign: boolean;
  requiresVerification: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  items?: ChecklistItem[];
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ChecklistAssignmentDetail {
  id: string;
  checklistId: string;
  userId: string;
  assignedBy: string;
  assignedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  dueDate?: string;
  status: string;
  completionPercentage: number;
  isAutoAssigned: boolean;
  createdAt: string;
  updatedAt: string;
  checklist?: Checklist;
}

export interface ChecklistProgressItem {
  id: string;
  userId: string;
  checklistItemId: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
  checklistItem?: ChecklistItem;
  verifier?: {
    id: string;
    name: string;
    email: string;
  };
}