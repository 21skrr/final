import React, { useState, useEffect } from 'react';
import { Card, Typography, Progress, Button, Space, Alert, Spin } from 'antd';
import { CheckCircle, Clock, AlertTriangle, XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import onboardingService from '../../services/onboardingService';
import type { OnboardingJourney, OnboardingStage } from '../../types/onboarding';
import Layout from '../../components/layout/Layout';

const { Title, Text } = Typography;

const SupervisorOnboardingProgress: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<OnboardingJourney | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch supervisor's own onboarding progress
        const data = await onboardingService.getMyProgress();
        
        // Map API response to OnboardingJourney shape
        const rawData = data as unknown;
        const tasksByPhase = (rawData as { tasksByPhase?: Record<string, any[]> }).tasksByPhase || {};
        const perPhaseProgress = typeof (rawData as { progress?: unknown }).progress === "object"
          ? (rawData as { progress: Record<string, number> }).progress
          : {};

        const mappedJourney: OnboardingJourney = {
          user: data.User || user,
          currentStage: (data.currentStage as OnboardingStage) || "pre_onboarding",
          progress: perPhaseProgress,
          overallProgress: (data.progress as any)?.overall || 0,
          tasksByPhase: tasksByPhase,
          phases: Object.keys(tasksByPhase).map(phaseKey => ({
            title: phaseKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            tasks: tasksByPhase[phaseKey] || [],
            completed: (perPhaseProgress[phaseKey] || 0) === 100
          })),
          journeyType: data.journeyType || "SFP",
          status: data.status || "in_progress"
        };

        setJourney(mappedJourney);
      } catch (err: any) {
        console.error('Error fetching supervisor onboarding journey:', err);
        
        // Check if it's a "no onboarding progress" case (404 error)
        if (err?.response?.status === 404 && 
            (err?.response?.data?.error?.includes('Onboarding progress not found') || 
             err?.response?.data?.message?.includes('Onboarding progress not found'))) {
          // This is not an error, just no onboarding journey exists
          setJourney(null);
        } else {
          // This is a real error
          setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to load onboarding progress');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchJourney();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Onboarding Progress"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (!journey) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center space-x-3">
              <Button
                icon={<ArrowLeft />}
                onClick={() => navigate('/dashboard')}
                className="mr-2"
              >
                Back to Dashboard
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <Title level={2} className="mb-0 text-gray-800">My Onboarding Progress</Title>
                <Text className="text-gray-600">Track your supervisor onboarding journey</Text>
              </div>
            </div>
          </div>

          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-gray-400" />
            </div>
            <Title level={3} className="text-gray-800 mb-4">No Onboarding Journey Yet</Title>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You don't have an active onboarding journey set up yet. This usually means your onboarding process hasn't been initiated or you're not assigned to a specific program.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="font-semibold text-blue-800 mb-2">What to do next:</h4>
                <ul className="text-sm text-blue-700 text-left space-y-1">
                  <li>• Contact your HR representative</li>
                  <li>• Ask about your onboarding program assignment</li>
                  <li>• Verify your role and department settings</li>
                </ul>
              </div>
              <Button 
                type="primary" 
                onClick={() => navigate('/dashboard')}
                className="mt-4"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const stages: OnboardingStage[] = [
    "pre_onboarding",
    "phase_1", 
    "phase_2"
  ];

  const getStageIcon = (stage: OnboardingStage, isCompleted: boolean, isCurrent: boolean) => {
    if (isCompleted) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (isCurrent) return <Clock className="w-5 h-5 text-blue-500" />;
    return <XCircle className="w-5 h-5 text-gray-400" />;
  };

  const getStageColor = (stage: OnboardingStage, isCompleted: boolean, isCurrent: boolean) => {
    if (isCompleted) return "bg-green-50 border-green-200";
    if (isCurrent) return "bg-blue-50 border-blue-200";
    return "bg-gray-50 border-gray-200";
  };

  const getStatusColor = () => {
    if (journey.status === "completed") return "text-green-600";
    if (journey.status === "in_progress") return "text-blue-600";
    return "text-gray-600";
  };

  const getStatusIcon = () => {
    if (journey.status === "completed") return <CheckCircle className="w-4 h-4" />;
    if (journey.status === "in_progress") return <Clock className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Button
              icon={<ArrowLeft />}
              onClick={() => navigate('/dashboard')}
              className="mr-2"
            >
              Back to Dashboard
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <Title level={2} className="mb-0 text-gray-800">My Onboarding Progress</Title>
              <Text className="text-gray-600">Track your supervisor onboarding journey</Text>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress Summary */}
      <Card className="mb-6 shadow-sm border-0 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {journey.overallProgress || 0}%
              </div>
              <div className="text-sm font-medium text-gray-600">Overall Progress</div>
            </div>
            <div className="flex-1 mx-6">
              <Progress
                percent={journey.overallProgress || 0}
                strokeColor={{
                  '0%': '#8b5cf6',
                  '100%': '#4f46e5',
                }}
                trailColor="#e5e7eb"
                strokeWidth={8}
                className="mb-2"
              />
            </div>
          </div>
          <div className="text-right">
            <div className={`flex items-center space-x-2 text-sm font-medium ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="capitalize">{journey.status || 'In Progress'}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {journey.currentStage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Pre Onboarding'}
            </div>
          </div>
        </div>
      </Card>

      {/* Onboarding Stages */}
      <div className="space-y-4">
        <Title level={4} className="text-gray-800 mb-4">Onboarding Stages</Title>
        
        {stages.map((stage, index) => {
          const isCompleted = (journey.progress as any)?.[stage] === 100;
          const isCurrent = journey.currentStage === stage;
          const progress = (journey.progress as any)?.[stage] || 0;
          
          return (
            <Card
              key={stage}
              className={`transition-all duration-200 hover:shadow-md ${getStageColor(stage, isCompleted, isCurrent)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStageIcon(stage, isCompleted, isCurrent)}
                  <div>
                    <div className="font-semibold text-gray-800">
                      {stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isCompleted ? 'Completed' : isCurrent ? 'Current Stage' : 'Upcoming'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">{progress}%</div>
                  <div className="w-24">
                    <Progress
                      percent={progress}
                      size="small"
                      strokeColor={isCompleted ? '#10b981' : isCurrent ? '#3b82f6' : '#9ca3af'}
                      showInfo={false}
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tasks by Phase */}
      {journey.phases && journey.phases.length > 0 && (
        <div className="mt-8">
          <Title level={4} className="text-gray-800 mb-4">Tasks by Phase</Title>
          <div className="space-y-4">
            {journey.phases.map((phase, phaseIndex) => (
              <Card key={phaseIndex} className="shadow-sm">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Title level={5} className="mb-0 text-gray-800">{phase.title}</Title>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {phase.tasks.filter(task => task.completed).length} / {phase.tasks.length} completed
                      </span>
                      <div className="w-16">
                        <Progress
                          percent={phase.tasks.length > 0 ? (phase.tasks.filter(task => task.completed).length / phase.tasks.length) * 100 : 0}
                          size="small"
                          strokeColor="#8b5cf6"
                          showInfo={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {phase.tasks && phase.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {phase.tasks.map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          task.completed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {task.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          <span className={`font-medium ${
                            task.completed ? 'text-green-800' : 'text-gray-700'
                          }`}>
                            {task.title || task.name || `Task ${taskIndex + 1}`}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {task.completed ? 'Completed' : 'Pending'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No tasks available for this phase
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Journey Information */}
      <Card className="mt-6 shadow-sm">
        <Title level={5} className="text-gray-800 mb-4">Journey Information</Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text strong className="text-gray-600">Journey Type:</Text>
            <div className="text-gray-800">{journey.journeyType || 'SFP'}</div>
          </div>
          <div>
            <Text strong className="text-gray-600">Current Stage:</Text>
            <div className="text-gray-800 capitalize">
              {journey.currentStage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Pre Onboarding'}
            </div>
          </div>
          <div>
            <Text strong className="text-gray-600">Overall Progress:</Text>
            <div className="text-gray-800">{journey.overallProgress || 0}%</div>
          </div>
          <div>
            <Text strong className="text-gray-600">Status:</Text>
            <div className={`capitalize ${getStatusColor()}`}>
              {journey.status || 'In Progress'}
            </div>
          </div>
        </div>
      </Card>
      </div>
    </Layout>
  );
};

export default SupervisorOnboardingProgress;
