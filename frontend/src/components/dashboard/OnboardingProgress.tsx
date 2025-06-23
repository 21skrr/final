import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { User, OnboardingStage } from '../../types/user';
import onboardingService from '../../services/onboardingService';
import type { OnboardingJourney } from '../../types/onboarding';
import { Link } from 'react-router-dom';

interface OnboardingProgressProps {
  user: User;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ user }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [journey, setJourney] = useState<OnboardingJourney | null>(null);
  const [defaultTasks, setDefaultTasks] = useState<Record<string, any[]> | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    try {
      // Use updateTaskProgress instead of updateMyProgress
      await onboardingService.updateTaskProgress(taskId, {
        isCompleted: completed
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
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Onboarding Journey</h2>
        
        {/* Progress percentage */}
        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-blue-600">{journey.overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${journey.overallProgress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Journey steps */}
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
                    {!isFutureStage && (
                      <div className="mt-3 space-y-2">
                        {tasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="flex items-center text-sm"
                          >
                            <div 
                              className="flex-shrink-0 mr-2 cursor-pointer" 
                              onClick={() => handleTaskToggle(task.id, !task.completed)}
                            >
                              {task.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                            <span className={task.completed ? 'text-gray-600' : 'text-gray-400'}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Current stage action button */}
                    {isCurrentStage && (
                      <Link to="/onboarding" className="mt-3 inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Continue Onboarding
                      </Link>
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