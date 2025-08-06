import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import supervisorAssessmentService from '../services/supervisorAssessmentService';

export const useSupervisorAssessments = () => {
  const { user } = useAuth();
  const [pendingAssessments, setPendingAssessments] = useState(0);
  const [pendingHRApprovals, setPendingHRApprovals] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'supervisor' && user?.id) {
      fetchPendingAssessments();
    }
    if (user?.role === 'hr') {
      fetchPendingHRApprovals();
    }
  }, [user?.id, user?.role]);

  const fetchPendingAssessments = async () => {
    try {
      setLoading(true);
      const response = await supervisorAssessmentService.getSupervisorAssessments(user!.id);
      const pending = response.assessments.filter(
        (assessment: any) =>
          assessment.status === 'pending_certificate' ||
          assessment.status === 'certificate_uploaded' ||
          assessment.status === 'assessment_pending' ||
          assessment.status === 'assessment_completed' ||
          assessment.status === 'decision_pending' ||
          assessment.status === 'hr_approval_pending'
      ).length;
      setPendingAssessments(pending);
    } catch (error) {
      console.error('Error fetching pending assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingHRApprovals = async () => {
    try {
      setLoading(true);
      const response = await supervisorAssessmentService.getPendingHRApproval();
      // Filter for only truly pending HR approvals (for notifications)
      const pending = response.assessments.filter(
        (assessment: any) => assessment.status === 'hr_approval_pending'
      ).length;
      setPendingHRApprovals(pending);
    } catch (error) {
      console.error('Error fetching pending HR approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  return { 
    pendingAssessments, 
    pendingHRApprovals, 
    loading, 
    refetch: user?.role === 'supervisor' ? fetchPendingAssessments : fetchPendingHRApprovals 
  };
}; 