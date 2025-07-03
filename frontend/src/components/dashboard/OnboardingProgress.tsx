import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, Lock } from 'lucide-react';
import { User, OnboardingStage } from '../../types/user';
import onboardingService from '../../services/onboardingService';
import type { OnboardingJourney } from '../../types/onboarding';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface OnboardingProgressProps {
  user: User;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ user }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [journey, setJourney] = useState<OnboardingJourney | null>(null);
  const [defaultTasks, setDefaultTasks] = useState<Record<string, any[]> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Determine permissions based on user role
  const canEditTasks = onboardingService.canEditTasks(currentUser?.role || 'employee');
  const canAdvancePhases = onboardingService.canAdvancePhases(currentUser?.role || 'employee');
  const isEmployee = currentUser?.role === 'employee';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [journeyData, defaultTasksData] = await Promise.all([
          onboardingService.getJourney(),
          onboardingService.getDefaultTasks()
        ]);
        setJourney(journeyData);
        setDefaultTasks(defaultTasksData);
      } catch (err) {
        console.error('Error fetching onboarding journey or tasks:', err);
        setError('Failed to load onboarding journey');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    // Prevent employees from editing tasks
    if (isEmployee) {
      return;
    }

    try {
      // Use updateTaskProgress instead of updateMyProgress
      await onboardingService.updateTaskProgress(taskId, {
        completed
      });
      
      // You'll need to update your state accordingly
      // This might require fetching the full journey again
      const updatedJourney = await onboardingService.getJourney();
      setJourney(updatedJourney);
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-24 bg-gray-200 rounded w-full"></div>
          <div className="h-24 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !journey || !defaultTasks) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <p className="text-red-500">{error || 'No onboarding journey found'}</p>
      </div>
    );
  }

  const stages: OnboardingStage[] = ['prepare', 'orient', 'land', 'integrate', 'excel'];
  const currentStageIndex = stages.findIndex(stage => stage === journey.currentStage);
  
  const allPhases = journey.phases || journey.stages || [];
  const completedTaskIds = new Set(
    allPhases.flatMap(phase =>
      Array.isArray(phase.tasks)
        ? phase.tasks.filter(t => t.completed).map(t => t.id)
        : []
    )
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Onboarding Progress</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEmployee ? 'Your onboarding journey' : `${user.name}'s onboarding journey`}
            </p>
          </div>
          {isEmployee && (
            <div className="flex items-center text-sm text-gray-500">
              <Lock className="w-4 h-4 mr-1" />
              Read-only view
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {stages.map((stageKey, index) => {
            const isCurrentStage = stageKey === journey.currentStage;
            const isPastStage = index < currentStageIndex;
            const isFutureStage = index > currentStageIndex;
            const defaultStageTasks = defaultTasks[stageKey] || [];
            // Mark completed tasks
            const tasks = defaultStageTasks.map(task => ({
              ...task,
              completed: completedTaskIds.has(task.id)
            }));
            return (
              <div 
                key={stageKey}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  isCurrentStage ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {isPastStage ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : isCurrentStage ? (
                      <Clock className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <h3 className={`text-lg font-medium ${
                        isCurrentStage ? 'text-blue-700' : 
                        isPastStage ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {onboardingService.getPhaseTitle(stageKey)}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {tasks.filter(t => t.completed).length}/{tasks.length} Tasks
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{onboardingService.getPhaseDescription(stageKey)}</p>
                    
                    {/* Tasks list - only show for current and past stages */}
                    {(isCurrentStage || isPastStage) && (
                      <div className="mt-3 space-y-2">
                        {tasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="flex items-center text-sm"
                          >
                            <div 
                              className={`flex-shrink-0 mr-2 ${
                                canEditTasks && !isEmployee ? 'cursor-pointer' : 'cursor-not-allowed'
                              }`}
                              onClick={() => canEditTasks && !isEmployee && handleTaskToggle(task.id, !task.completed)}
                            >
                              {task.completed ? (
                                <CheckCircle className={`w-4 h-4 ${isEmployee ? 'text-gray-400' : 'text-green-500'}`} />
                              ) : (
                                <Circle className={`w-4 h-4 ${isEmployee ? 'text-gray-300' : 'text-gray-300'}`} />
                              )}
                            </div>
                            <span className={`${task.completed ? 'text-gray-600' : 'text-gray-400'} ${
                              isEmployee ? 'italic' : ''
                            }`}>
                              {task.title}
                              {isEmployee && !task.completed && (
                                <span className="text-xs text-gray-400 ml-2">(Pending completion)</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Current stage action button */}
                    {isCurrentStage && canAdvancePhases && !isEmployee && (
                      <Link to="/onboarding" className="mt-3 inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Continue Onboarding
                      </Link>
                    )}
                    
                    {/* Employee view message */}
                    {isCurrentStage && isEmployee && (
                      <div className="mt-3 p-2 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-600">
                          Your supervisor or HR will mark tasks as complete. Contact them if you have questions.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OnboardingProgress;