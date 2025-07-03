import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Spin, Alert, Typography, Button, message } from 'antd';
import { useAuth } from '../context/AuthContext';
import OnboardingPhase from '../components/onboarding/OnboardingPhase';
import OnboardingSummary from '../components/onboarding/OnboardingSummary';
import { OnboardingJourney, Task } from '../types/onboarding';
import onboardingService from '../services/onboardingService';

const { Title } = Typography;

const OnboardingDetail: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  const [journey, setJourney] = useState<OnboardingJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine permissions and endpoints based on user role
  const isHR = user?.role === 'hr';
  const isSupervisor = user?.role === 'supervisor';
  const isManager = user?.role === 'manager';
  const isEmployee = user?.role === 'employee';
  const isViewingOwnJourney = !userId || userId === user?.id;
  
  // Determine what actions the user can perform
  const canEditTasks = onboardingService.canEditTasks(user?.role || 'employee');
  const canAdvancePhases = onboardingService.canAdvancePhases(user?.role || 'employee');
  const canValidateTasks = onboardingService.canValidateTasks(user?.role || 'employee');

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        setLoading(true);
        const targetUserId = userId || user?.id;
        if (!targetUserId) throw new Error('User ID not available');
        
        let data;
        
        // Use role-appropriate endpoint
        if (isViewingOwnJourney) {
          // Employee viewing their own journey
          data = await onboardingService.getMyProgress();
        } else if (isHR) {
          // HR viewing any user's journey
          data = await onboardingService.getUserProgressHR(targetUserId);
        } else if (isSupervisor) {
          // Supervisor viewing direct report's journey
          data = await onboardingService.getUserProgress(targetUserId);
        } else if (isManager) {
          // Manager viewing department member's journey (read-only)
          data = await onboardingService.getUserProgressManager(targetUserId);
        } else {
          throw new Error('Insufficient permissions to view this onboarding journey');
        }
        
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
  }, [userId, user, isViewingOwnJourney, isHR, isSupervisor, isManager]);

  const handleTaskComplete = async (phaseIndex: number, taskId: string) => {
    if (!journey || !user) return;
    
    // Check if user can edit tasks
    if (!canEditTasks) {
      message.error('You do not have permission to edit tasks');
      return;
    }
    
    try {
      const targetUserId = userId || user.id;
      
      // Use role-appropriate endpoint
      if (isHR) {
        await onboardingService.updateTaskCompletion(taskId, true);
      } else if (isSupervisor) {
        await onboardingService.updateTaskCompletion(taskId, true);
      } else {
        message.error('You do not have permission to complete tasks');
        return;
      }
      
      // Update local state
      const updatedJourney = { ...journey };
      const task = updatedJourney.phases[phaseIndex].tasks.find(t => t.id === taskId) as Task;
      
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
    if (!journey || !userId || !canAdvancePhases) {
      message.error('You do not have permission to advance phases');
      return;
    }
    
    try {
      // Use role-appropriate endpoint
      if (isHR) {
        await onboardingService.advanceToNextPhaseHR(userId);
      } else if (isSupervisor) {
        await onboardingService.advanceToNextPhase(userId);
      } else {
        message.error('You do not have permission to advance phases');
        return;
      }
      
      // Refresh journey data
      const updatedJourney = await onboardingService.getJourney(userId);
      setJourney(updatedJourney);
      
      message.success('Advanced to next phase successfully');
    } catch (err) {
      console.error('Failed to advance phase:', err);
      message.error('Failed to advance to next phase. Please try again.');
    }
  };

  const handleTaskVerify = async (progressId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (!canValidateTasks) {
      message.error('Only HR can validate tasks');
      return;
    }
    
    try {
      await onboardingService.verifyChecklistItem(progressId, status, notes);
      // Refresh journey data
      const targetUserId = userId || user?.id;
      if (targetUserId) {
        const updatedJourney = await onboardingService.getJourney(targetUserId);
        setJourney(updatedJourney);
      }
    } catch (err) {
      message.error('Failed to verify task. Please try again.');
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

  // Use phases if available, otherwise fallback to stages
  const journeyPhases = journey.phases || journey.stages || [];

  if (!Array.isArray(journeyPhases) || journeyPhases.length === 0) {
    return (
      <Alert
        message="No Onboarding Phases"
        description="No onboarding phases found for this user."
        type="info"
        showIcon
        className="max-w-3xl mx-auto mt-8"
      />
    );
  }

  const currentPhaseIndex = journeyPhases.findIndex(phase => Array.isArray(phase.tasks) && phase.tasks.some(task => !task.completed));

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          {isViewingOwnJourney ? 'My Onboarding Journey' : `${journey.user.name}'s Onboarding Journey`}
        </Title>
        
        {/* Show role-specific information */}
        <div className="flex items-center gap-4">
          {isEmployee && (
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
              Read-only view
            </div>
          )}
          
          {canAdvancePhases && !isViewingOwnJourney && (
            <Button 
              type="primary" 
              onClick={handleAdvancePhase}
              disabled={currentPhaseIndex === -1 || currentPhaseIndex === journeyPhases.length - 1}
            >
              Advance to Next Phase
            </Button>
          )}
        </div>
      </div>

      <OnboardingSummary journey={journey} />

      <div className="space-y-6">
        {journeyPhases.map((phase, index) => (
          <OnboardingPhase
            key={index}
            title={phase.title}
            description={phase.description}
            progress={Math.round((phase.tasks.filter(t => t.completed).length / phase.tasks.length) * 100)}
            tasks={phase.tasks}
            isCurrentPhase={index === currentPhaseIndex}
            onTaskComplete={(taskId) => handleTaskComplete(index, taskId)}
            canEditTasks={canEditTasks}
            userRole={user?.role || 'employee'}
            onTaskVerify={handleTaskVerify}
          />
        ))}
      </div>
    </div>
  );
};

export default OnboardingDetail;