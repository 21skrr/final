import React from 'react';
import { Progress, Tooltip, Modal, Button, Tag, Checkbox } from 'antd';
import { InfoCircleOutlined, ClockCircleOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { Task } from '../../types/onboarding';

interface OnboardingPhaseProps {
  title: string;
  description?: string;
  progress: number;
  tasks: Task[];
  isCurrentPhase: boolean;
  onTaskComplete: (taskId: string) => void;
  canEditTasks: boolean;
  userRole: string;
}

const OnboardingPhase: React.FC<OnboardingPhaseProps> = ({
  title,
  description,
  progress,
  tasks,
  isCurrentPhase,
  onTaskComplete,
  canEditTasks,
  userRole
}) => {
  const [taskModalVisible, setTaskModalVisible] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalVisible(true);
  };

  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate) return false;
    return new Date() > new Date(task.dueDate) && !task.completed;
  };

  // Determine if user can edit a specific task based on controlledBy and role
  const canEditTask = (task: Task) => {
    if (!canEditTasks) return false;
    if (task.controlledBy === 'hr' && userRole !== 'hr' && userRole !== 'manager') return false;
    return true;
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${isCurrentPhase ? 'border-blue-500 bg-blue-50' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Tag color={progress === 100 ? 'green' : isCurrentPhase ? 'blue' : 'default'}>
          {progress === 100 ? 'Completed' : isCurrentPhase ? 'Current' : 'Upcoming'}
        </Tag>
      </div>
      
      {description && <p className="text-gray-600 mb-2">{description}</p>}
      
      <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} />
      
      <div className="mt-4">
        <h4 className="font-medium mb-2">Tasks</h4>
        <ul className="space-y-2">
          {tasks.map(task => (
            <li key={task.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox 
                  checked={task.completed} 
                  onChange={() => canEditTask(task) && onTaskComplete(task.id)}
                  disabled={!canEditTask(task)}
                />
                <span 
                  className={`ml-2 cursor-pointer ${task.completed ? 'line-through text-gray-500' : ''} ${isTaskOverdue(task) ? 'text-red-500' : ''}`}
                  onClick={() => handleTaskClick(task)}
                >
                  {task.title}
                </span>
                <Tooltip title="View details">
                  <InfoCircleOutlined className="ml-2 text-blue-500 cursor-pointer" onClick={() => handleTaskClick(task)} />
                </Tooltip>
                {task.controlledBy === 'hr' && userRole !== 'hr' && userRole !== 'manager' && (
                  <Tooltip title="HR controlled task">
                    <LockOutlined className="ml-2 text-gray-500" />
                  </Tooltip>
                )}
              </div>
              
              {isTaskOverdue(task) && (
                <Tooltip title="Task is overdue">
                  <ClockCircleOutlined className="text-red-500" />
                </Tooltip>
              )}
              
              {task.completed && (
                <Tooltip title={`Completed on ${new Date(task.completedAt || '').toLocaleDateString()}`}>
                  <CheckCircleOutlined className="text-green-500" />
                </Tooltip>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      <Modal
        title={selectedTask?.title}
        open={taskModalVisible}
        onCancel={() => setTaskModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTaskModalVisible(false)}>
            Close
          </Button>,
          canEditTasks && selectedTask && !selectedTask.completed && canEditTask(selectedTask) && (
            <Button 
              key="complete" 
              type="primary" 
              onClick={() => {
                onTaskComplete(selectedTask.id);
                setTaskModalVisible(false);
              }}
            >
              Mark as Complete
            </Button>
          )
        ]}
      >
        {selectedTask && (
          <div>
            <p>{selectedTask.description}</p>
            <div className="mt-4">
              <p><strong>Due Date:</strong> {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No due date'}</p>
              <p><strong>Status:</strong> {selectedTask.completed ? 'Completed' : isTaskOverdue(selectedTask) ? 'Overdue' : 'Pending'}</p>
              {selectedTask.controlledBy === 'hr' && userRole !== 'hr' && userRole !== 'manager' && (
                <p><strong>Note:</strong> <span className="text-orange-500">This task can only be completed by HR personnel</span></p>
              )}
              {selectedTask.completedAt && (
                <p><strong>Completed On:</strong> {new Date(selectedTask.completedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OnboardingPhase;