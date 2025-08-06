// hooks/useHRAssessments.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import hrAssessmentService from '../services/hrAssessmentService';
import { HRAssessment } from '../types/hrAssessment';

export const useHRAssessments = () => {
  const { user } = useAuth();
  const [allAssessments, setAllAssessments] = useState<HRAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = async () => {
    if (user?.role !== 'hr') return;

    try {
      setLoading(true);
      setError(null);
      const response = await hrAssessmentService.getPendingAssessments();
      setAllAssessments(response.assessments);
    } catch (err) {
      setError('Failed to fetch HR assessments');
      console.error('Error fetching HR assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [user]);

  // Filter for truly pending assessments (for notifications)
  const pendingAssessments = allAssessments.filter(
    assessment => assessment.status === 'pending_assessment' || assessment.status === 'assessment_completed'
  );

  return {
    allAssessments,
    pendingAssessments,
    pendingCount: pendingAssessments.length,
    loading,
    error,
    refetch: fetchAssessments,
  };
}; 