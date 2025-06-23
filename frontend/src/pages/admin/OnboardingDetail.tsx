import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Progress, Tag, message, Card, Timeline, Spin, Modal, Input, Divider, List, Checkbox } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  CommentOutlined
} from '@ant-design/icons';

interface Task {
  id: string;
  title: string;
  description: string;
  stage: string;
  order: number;
  completed: boolean;
  hrValidated: boolean;
  completedAt?: string;
  hrValidatedAt?: string;
  hrComments?: string;
  controlledBy?: 'hr' | 'employee';
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface OnboardingProgress {
  stage: string;
  progress: number;
  status: string;
  stageStartDate: string;
  estimatedCompletionDate: string;
}

interface TasksByPhase {
  [key: string]: Task[];
}

interface ProgressData {
  [key: string]: number;
}

const OnboardingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState('');
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [tasksByPhase, setTasksByPhase] = useState<TasksByPhase>({});
  const [progressByPhase, setProgressByPhase] = useState<ProgressData>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationComment, setValidationComment] = useState('');
  const [validationLoading, setValidationLoading] = useState(false);

  const phases = [
    {
      key: 'prepare',
      title: 'Prepare',
      description: 'Complete paperwork, review materials, and set up accounts'
    },
    {
      key: 'orient',
      title: 'Orient',
      description: 'Attend orientation, meet the team, and receive equipment'
    },
    {
      key: 'land',
      title: 'Land',
      description: 'Start self-study, get a buddy, and shadow interactions'
    },
    {
      key: 'integrate',
      title: 'Integrate',
      description: 'Lead interactions, demonstrate autonomy, complete assessments'
    },
    {
      key: 'excel',
      title: 'Excel',
      description: 'Set up development plan, join coaching, and track KPIs'
    }
  ];

  useEffect(() => {
    fetchOnboardingDetails();
  }, [id]);

  const fetchOnboardingDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/onboarding/progress/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch onboarding details');
      }
      
      const data = await response.json();
      
      setProgress({
        stage: data.currentStage,
        progress: data.progress.overall || 0,
        status: data.status || 'in_progress',
        stageStartDate: data.stageStartDate,
        estimatedCompletionDate: data.estimatedCompletionDate
      });

      setTasksByPhase(data.tasksByPhase || {});
      setProgressByPhase(data.progress || {});

      const userResponse = await fetch(`/api/users/${id}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setEmployeeName(userData.name || 'Employee');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching onboarding details:', error);
      message.error('Failed to load onboarding details');
      setLoading(false);
    }
  };

  const handleValidateTask = async (taskId: string, isValidated: boolean) => {
    try {
      setValidationLoading(true);
      const response = await fetch(`/api/onboarding/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          completed: true,
          hrValidated: isValidated,
          comments: validationComment
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate task');
      }
      
      message.success(isValidated ? 'Task validated successfully' : 'Task validation rejected');
      setValidationModalVisible(false);
      setValidationComment('');
      setSelectedTask(null);
      fetchOnboardingDetails();
    } catch (error) {
      console.error('Error validating task:', error);
      message.error('Failed to update task validation');
    } finally {
      setValidationLoading(false);
    }
  };

  const handleAdvancePhase = async () => {
    Modal.confirm({
      title: 'Advance to Next Phase',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to advance this employee to the next phase? This action cannot be undone.',
      okText: 'Yes, Advance',
      cancelText: 'No, Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`/api/onboarding/advance/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to advance phase');
          }
          
          message.success('Advanced to next phase successfully');
          fetchOnboardingDetails();
        } catch (error) {
          console.error('Error advancing phase:', error);
          message.error('Failed to advance phase');
        }
      }
    });
  };

  const getTaskStatusTag = (task: Task) => {
    if (task.hrValidated) {
      return <Tag icon={<CheckCircleOutlined />} color="success">HR Validated</Tag>;
    }
    if (task.completed) {
      return <Tag icon={<ClockCircleOutlined />} color="warning">Pending HR Validation</Tag>;
    }
    return <Tag>Not Started</Tag>;
  };

  const openValidationModal = (task: Task) => {
    setSelectedTask(task);
    setValidationModalVisible(true);
  };

  if (loading || !progress) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-medium mb-2">{employeeName}'s Onboarding Journey</h1>
            <div className="text-gray-500">
              Started: {new Date(progress.stageStartDate).toLocaleDateString()}
              {progress.estimatedCompletionDate && 
                ` • Expected Completion: ${new Date(progress.estimatedCompletionDate).toLocaleDateString()}`
              }
            </div>
          </div>
          <Button 
            type="primary" 
            onClick={handleAdvancePhase}
            disabled={progress.progress < 100}
          >
            Advance to Next Phase
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Overall Progress</div>
            <div className="text-2xl font-medium mb-2">{progress.progress}%</div>
            <Progress percent={progress.progress} showInfo={false} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <Tag icon={<CheckCircleOutlined />} color="success">
              {progress.status}
            </Tag>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Current Stage</div>
            <div className="capitalize font-medium">{progress.stage}</div>
          </div>
        </div>
      </Card>

      {phases.map(phase => {
        const phaseTasks = tasksByPhase[phase.key] || [];
        const phaseProgress = progressByPhase[phase.key] || 0;
        const isCurrentPhase = phase.key === progress.stage;
        
        return (
          <Card 
            key={phase.key} 
            className="mb-6"
            title={
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-medium">{phase.title}</span>
                  <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                </div>
                <Tag color={isCurrentPhase ? 'blue' : undefined}>
                  {isCurrentPhase ? 'Current' : 'Upcoming'}
                </Tag>
              </div>
            }
          >
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <Progress 
                percent={phaseProgress} 
                status={phaseProgress === 100 ? "success" : "active"}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {phaseTasks.map(task => (
                <Card 
                  key={task.id} 
                  className="border border-gray-200 hover:border-blue-300 transition-colors"
                  bodyStyle={{ padding: '16px' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-grow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={task.completed}
                            disabled={true}
                          />
                          <div>
                            <h4 className="text-base font-medium m-0">{task.title}</h4>
                            <p className="text-gray-600 mb-0 text-sm">{task.description}</p>
                          </div>
                        </div>
                        {getTaskStatusTag(task)}
                      </div>
                      <div className="ml-7">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          {task.completedAt && (
                            <span className="flex items-center">
                              <CheckOutlined className="mr-1" />
                              Completed: {new Date(task.completedAt).toLocaleDateString()}
                            </span>
                          )}
                          {task.hrValidatedAt && (
                            <span className="flex items-center">
                              <CheckCircleOutlined className="mr-1" />
                              Validated: {new Date(task.hrValidatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {task.hrComments && (
                          <div className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded">
                            <CommentOutlined className="mr-2" />
                            {task.hrComments}
                          </div>
                        )}
                      </div>
                    </div>
                    {task.completed && !task.hrValidated && (
                      <Button 
                        type="primary"
                        onClick={() => openValidationModal(task)}
                        className="ml-4"
                      >
                        Review & Validate
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
              {phaseTasks.length === 0 && (
                <div className="text-gray-400 text-center py-8 bg-gray-50 rounded-lg">
                  No tasks available for this phase
                </div>
              )}
            </div>
          </Card>
        );
      })}

      <Modal
        title="Task Validation"
        open={validationModalVisible}
        onCancel={() => {
          setValidationModalVisible(false);
          setValidationComment('');
          setSelectedTask(null);
        }}
        footer={[
          <Button 
            key="reject"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleValidateTask(selectedTask?.id || '', false)}
            loading={validationLoading}
          >
            Reject
          </Button>,
          <Button
            key="validate"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleValidateTask(selectedTask?.id || '', true)}
            loading={validationLoading}
          >
            Validate
          </Button>
        ]}
      >
        {selectedTask && (
          <>
            <div className="mb-4">
              <h3 className="font-medium">{selectedTask.title}</h3>
              <p className="text-gray-600">{selectedTask.description}</p>
              <div className="mt-2">
                Current Status: {getTaskStatusTag(selectedTask)}
              </div>
            </div>
            <Divider />
            <div className="mb-4">
              <label className="block mb-2">Validation Comments:</label>
              <Input.TextArea
                rows={4}
                value={validationComment}
                onChange={(e) => setValidationComment(e.target.value)}
                placeholder="Add any comments about this task validation..."
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default OnboardingDetail; 