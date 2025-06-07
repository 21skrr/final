import React from 'react';
import { Card, Progress, Statistic, Tag } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { OnboardingJourney, Task } from '../../types/onboarding';

interface OnboardingSummaryProps {
  journey: OnboardingJourney;
}

const OnboardingSummary: React.FC<OnboardingSummaryProps> = ({ journey }) => {
  const getOverallProgress = () => {
    const totalTasks = journey.phases.reduce((acc, phase) => acc + phase.tasks.length, 0);
    const completedTasks = journey.phases.reduce(
      (acc, phase) => acc + phase.tasks.filter(task => task.completed).length, 
      0
    );
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const getNextUpcomingTask = (): Task | null => {
    for (const phase of journey.phases) {
      const pendingTask = phase.tasks.find(task => !task.completed);
      if (pendingTask) return pendingTask;
    }
    return null;
  };

  const getStatusText = () => {
    if (journey.status) return journey.status;
    
    const currentPhase = journey.phases.find(phase => 
      phase.tasks.some(task => !task.completed)
    );
    
    if (!currentPhase) return 'Completed';
    
    if (currentPhase.title === 'Excel') return 'Excel stage started';
    
    const hasOverdueTasks = currentPhase.tasks.some(task => 
      task.dueDate && new Date() > new Date(task.dueDate) && !task.completed
    );
    
    if (hasOverdueTasks) return 'Has overdue tasks';
    
    return 'In progress';
  };

  const getStatusColor = () => {
    const status = getStatusText();
    if (status === 'Completed') return 'green';
    if (status === 'Excel stage started') return 'blue';
    if (status.includes('overdue')) return 'red';
    if (status.includes('Pending')) return 'orange';
    return 'blue';
  };

  const nextTask = getNextUpcomingTask();
  const overallProgress = getOverallProgress();
  const statusText = getStatusText();
  const statusColor = getStatusColor();

  return (
    <Card className="mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between">
        <div className="mb-4 md:mb-0 md:mr-6">
          <Statistic 
            title="Overall Progress" 
            value={overallProgress} 
            suffix="%" 
            valueStyle={{ color: overallProgress === 100 ? '#52c41a' : '#1890ff' }} 
          />
          <Progress percent={overallProgress} status={overallProgress === 100 ? 'success' : 'active'} />
        </div>
        
        <div className="mb-4 md:mb-0 md:mr-6">
          <h4 className="text-sm text-gray-500 mb-1">Status</h4>
          <Tag color={statusColor} className="text-base py-1 px-2">
            {statusText === 'Completed' && <CheckCircleOutlined className="mr-1" />}
            {statusText.includes('overdue') && <ExclamationCircleOutlined className="mr-1" />}
            {(statusText === 'In progress' || statusText === 'Excel stage started') && <ClockCircleOutlined className="mr-1" />}
            {statusText}
          </Tag>
        </div>
        
        <div>
          <h4 className="text-sm text-gray-500 mb-1">Next Task</h4>
          {nextTask ? (
            <div>
              <p className="font-medium">{nextTask.title}</p>
              {nextTask.dueDate && (
                <p className="text-sm text-gray-500">
                  Due: {new Date(nextTask.dueDate).toLocaleDateString()}
                  {new Date() > new Date(nextTask.dueDate) && (
                    <Tag color="red" className="ml-2">Overdue</Tag>
                  )}
                </p>
              )}
            </div>
          ) : (
            <p className="text-green-500 font-medium">All tasks completed!</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default OnboardingSummary;