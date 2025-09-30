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
    if (user?.role !== 'hr') {
      console.log('[useHRAssessments] User is not HR, skipping fetch. User role:', user?.role);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[useHRAssessments] Fetching HR assessments for user:', user.id);
      const response = await hrAssessmentService.getPendingAssessments();
      console.log('[useHRAssessments] API response:', response);
      setAllAssessments(response.assessments);
    } catch (err) {
      setError('Failed to fetch HR assessments');
      console.error('Error fetching HR assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[useHRAssessments] useEffect triggered, user:', user);
    if (user?.role === 'hr') {
      fetchAssessments();
    }
  }, [user?.id, user?.role]);

  // Filter for truly pending assessments (for notifications)
  const pendingAssessments = allAssessments.filter(
    assessment => assessment.status === 'pending_assessment'
  );

  console.log('[useHRAssessments] All assessments:', allAssessments);
  console.log('[useHRAssessments] Pending assessments:', pendingAssessments);
  console.log('[useHRAssessments] Pending count:', pendingAssessments.length);

  return {
    allAssessments,
    pendingAssessments,
    pendingCount: pendingAssessments.length,
    loading,
    error,
    refetch: fetchAssessments,
  };
}; 