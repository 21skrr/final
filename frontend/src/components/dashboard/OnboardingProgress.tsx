import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { OnboardingStage } from '../../types/user';
import onboardingService from '../../services/onboardingService';
import type { OnboardingJourney } from '../../types/onboarding';
import { useAuth } from '../../context/AuthContext';

type Task = {
  id: string;
  title: string;
  isCompleted: boolean;
  [key: string]: unknown;
};

// If needed, extend OnboardingProgress type for 'overall'
type OnboardingProgressWithOverall = {
  [key: string]: unknown;
  overall?: number;
};

const OnboardingProgress: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [journey, setJourney] = useState<(OnboardingJourney & { tasksByPhase?: Record<string, Task[]> }) | null>(null);
  const [defaultTasks, setDefaultTasks] = useState<Record<string, Task[]> | null>(null);
  const [error, setError] = useState<string | null>(null);
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
  
  // Calculate overall progress using backend value
  const progressPercent = ((journey.progress as unknown) as OnboardingProgressWithOverall)?.overall ?? 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Onboarding Journey</h2>
        {/* Progress Bar */}
        <div className="flex items-center mb-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="text-blue-600 text-sm font-medium">{progressPercent}%</span>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {stages.map((stageKey, index) => {
            const isCurrentStage = stageKey === journey.currentStage;
            const isPastStage = index < currentStageIndex;
            // Use tasksByPhase from journey, which includes isCompleted
            const tasks: Task[] = journey.tasksByPhase?.[stageKey] || [];
            return (
              <div 
                key={stageKey}
                className="border rounded-lg p-4 transition-all duration-200 border-gray-200 bg-white"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {(isCurrentStage || isPastStage) ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {onboardingService.getPhaseTitle(stageKey)}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {tasks.filter((t) => t.isCompleted).length}/{tasks.length} Tasks
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{onboardingService.getPhaseDescription(stageKey)}</p>
                    {/* Always show tasks for all phases */}
                      <div className="mt-3 space-y-2">
                        {tasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="flex items-center text-sm"
                          >
                          <CheckCircle className={`w-4 h-4 mr-2 ${task.isCompleted ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className={`${task.isCompleted ? 'text-gray-800' : 'text-gray-400'} ${isEmployee ? 'italic' : ''}`}>{task.title}</span>
                          </div>
                        ))}
                      </div>
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