export interface Resource {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: 'document' | 'link' | 'video' | 'other';
  stage: 'prepare' | 'orient' | 'land' | 'integrate' | 'excel' | 'all';
  programType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceAssignment {
    id: string;
    resourceId: string;
    userId: string;
    assignedAt: string;
    dueDate?: string;
    status: 'assigned' | 'completed' | 'overdue' | 'in_progress';
    resource: Resource;
} 