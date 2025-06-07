import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Spin, Alert, Typography, Button, message } from 'antd';
import { useAuth } from '../context/AuthContext';
import OnboardingPhase from '../components/onboarding/OnboardingPhase';
import OnboardingSummary from '../components/onboarding/OnboardingSummary';
import { OnboardingJourney } from '../types/onboarding';
import onboardingService from '../services/onboardingService';

const { Title } = Typography;

const OnboardingDetail: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  const [journey, setJourney] = useState<OnboardingJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isHR = user?.role === 'hr' || user?.role === 'manager';
  const isViewingOwnJourney = !userId || userId === user?.id;
  const canEditTasks = isHR || isViewingOwnJourney;

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        setLoading(true);
        const targetUserId = userId || user?.id;
        if (!targetUserId) throw new Error('User ID not available');
        
        const data = await onboardingService.getJourney(targetUserId);
        setJourney(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch onboarding journey:', err);
        setError('Failed to load onboarding journey. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJourney();
  }, [userId, user]);

  const handleTaskComplete = async (phaseIndex: number, taskId: string) => {
    if (!journey || !user) return;
    
    try {
      const targetUserId = userId || user.id;
      await onboardingService.completeTask(targetUserId, taskId);
      
      // Update local state
      const updatedJourney = { ...journey };
      const task = updatedJourney.phases[phaseIndex].tasks.find(t => t.id === taskId);
      
      if (task) {
        task.completed = true;
        task.completedAt = new Date().toISOString();
        setJourney(updatedJourney);
      }
      
      message.success('Task marked as complete');
    } catch (err) {
      console.error('Failed to complete task:', err);
      message.error('Failed to update task. Please try again.');
    }
  };

  const handleAdvancePhase = async () => {
    if (!journey || !userId || !isHR) return;
    
    try {
      await onboardingService.advanceToNextPhase(userId);
      
      // Refresh journey data
      const updatedJourney = await onboardingService.getJourney(userId);
      setJourney(updatedJourney);
      
      message.success('Advanced to next phase successfully');
    } catch (err) {
      console.error('Failed to advance phase:', err);
      message.error('Failed to advance to next phase. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        className="max-w-3xl mx-auto mt-8"
      />
    );
  }

  if (!journey) {
    return (
      <Alert
        message="No Onboarding Journey"
        description="No onboarding journey found for this user."
        type="info"
        showIcon
        className="max-w-3xl mx-auto mt-8"
      />
    );
  }

  const currentPhaseIndex = journey.phases.findIndex(phase => 
    phase.tasks.some(task => !task.completed)
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          {isViewingOwnJourney ? 'My Onboarding Journey' : `${journey.employeeName}'s Onboarding Journey`}
        </Title>
        
        {isHR && !isViewingOwnJourney && (
          <div>
            <Button 
              type="primary" 
              onClick={handleAdvancePhase}
              disabled={currentPhaseIndex === -1 || currentPhaseIndex === journey.phases.length - 1}
            >
              Advance to Next Phase
            </Button>
          </div>
        )}
      </div>

      <OnboardingSummary journey={journey} />

      <div className="space-y-6">
        {journey.phases.map((phase, index) => (
          <OnboardingPhase
            key={index}
            title={phase.title}
            description={phase.description}
            progress={Math.round((phase.tasks.filter(t => t.completed).length / phase.tasks.length) * 100)}
            tasks={phase.tasks}
            isCurrentPhase={index === currentPhaseIndex}
            onTaskComplete={(taskId) => handleTaskComplete(index, taskId)}
            canEditTasks={canEditTasks}
          />
        ))}
      </div>
    </div>
  );
};

export default OnboardingDetail;