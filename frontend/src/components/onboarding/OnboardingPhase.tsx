import React, { useState } from 'react';
import { Progress, Tooltip, Modal, Button, Tag, Checkbox, Input, message, Card, Divider, Upload } from 'antd';
import { InfoCircleOutlined, ClockCircleOutlined, CheckCircleOutlined, LockOutlined, CheckOutlined, CloseOutlined, CommentOutlined, UploadOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Task } from '../../types/onboarding';
import { useAuth } from '../../context/AuthContext';
import onboardingService from '../../services/onboardingService';

interface OnboardingPhaseProps {
  title: string;
  description?: string;
  progress: number;
  tasks: Task[];
  isCurrentPhase: boolean;
  onTaskComplete: (taskId: string) => void;
  canEditTasks: boolean;
  userRole: string;
  onTaskVerify?: (progressId: string, status: 'approved' | 'rejected', notes?: string) => void;
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
  const { user: currentUser } = useAuth();
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // State for checklist items when no tasks are available
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, title: 'Complete paperwork', description: 'Submit all required documents and forms', checked: false },
    { id: 2, title: 'Review materials', description: 'Read through company policies and guidelines', checked: false },
    { id: 3, title: 'Set up accounts', description: 'Create and configure all necessary system accounts', checked: false }
  ]);
  
  // Determine permissions based on user role
  const canEditTask = (task: Task) => {
    if (currentUser?.role === 'employee') {
      return false; // Employees cannot edit tasks
    }
    if (currentUser?.role === 'supervisor') {
      return true; // Supervisors can edit their direct reports' tasks
    }
    if (currentUser?.role === 'hr') {
      return true; // HR can edit all tasks
    }
    return false;
  };

  const canValidateTask = (task: Task) => {
    return currentUser?.role === 'hr' && task.completed && !task.hrValidated;
  };

  const isEmployee = currentUser?.role === 'employee';
  
  // Handle checklist item toggle
  const handleChecklistItemToggle = (id: number) => {
    if (isEmployee) {
      return; // Employees cannot toggle checklist items
    }
    setChecklistItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };
  
  // Calculate checklist progress
  const checklistProgress = checklistItems.length > 0 
    ? Math.round((checklistItems.filter(item => item.checked).length / checklistItems.length) * 100) 
    : 0;

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalVisible(true);
  };
  
  const openValidationModal = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canValidateTask(task)) {
      return;
    }
    setSelectedTask(task);
    setValidationModalVisible(true);
  };

  const handleValidation = async () => {
    if (!selectedTask) return;
    
    setValidationLoading(true);
    try {
      await onboardingService.validateTask(selectedTask.id);
      message.success('Task validated successfully');
      setValidationModalVisible(false);
      // Refresh the task list or update the task status
    } catch (error) {
      message.error('Failed to validate task');
    } finally {
      setValidationLoading(false);
    }
  };

  const getTaskStatusTag = (task: Task) => {
    if (task.hrValidated) {
      return <Tag icon={<CheckCircleOutlined />} color="success">HR Validated</Tag>;
    }
    if (task.completed) {
      return <Tag icon={<ClockCircleOutlined />} color="warning">Pending HR Validation</Tag>;
    }
    if (isEmployee) {
      return <Tag icon={<LockOutlined />} color="default">Read Only</Tag>;
    }
    return <Tag>Not Started</Tag>;
  };

  const handleTaskComplete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditTask({ id: taskId } as Task)) {
      message.info('You do not have permission to edit this task');
      return;
    }
    onTaskComplete(taskId);
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${isCurrentPhase ? 'border-blue-500 bg-blue-50' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Tag color={progress === 100 ? 'green' : isCurrentPhase ? 'blue' : 'default'}>
          {progress === 100 ? 'Completed' : progress > 0 ? `${progress}% Complete` : isCurrentPhase ? 'Current' : 'Upcoming'}
        </Tag>
      </div>
      
      {description && <p className="text-gray-600 mb-2">{description}</p>}
      
      <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} />
      
      <div className="mt-4">
        <h4 className="font-medium mb-2">Tasks</h4>
        <div className="space-y-3">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <Card 
                key={task.id} 
                className={`border hover:border-blue-300 transition-colors ${task.hrValidated ? 'border-green-200 bg-green-50' : (task.completed ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200')}`}
                bodyStyle={{ padding: '12px' }}
                onClick={() => handleTaskClick(task)}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={task.completed} 
                          onChange={(e) => handleTaskComplete(task.id, e)}
                          disabled={!canEditTask(task)}
                          className={!canEditTask(task) ? 'opacity-50' : ''}
                        />
                        <div>
                          <h4 className={`text-base font-medium m-0 ${task.completed && !task.hrValidated ? '' : (task.completed && task.hrValidated ? 'text-green-700' : '')}`}>
                            {task.title}
                            {isEmployee && (
                              <span className="text-xs text-gray-500 ml-2">(Read-only)</span>
                            )}
                          </h4>
                          {task.description && (
                            <p className="text-gray-600 mb-0 text-sm">{task.description}</p>
                          )}
                        </div>
                      </div>
                      {getTaskStatusTag(task)}
                    </div>
                    
                    {/* Task actions */}
                    <div className="flex gap-2 mt-2">
                      {canValidateTask(task) && (
                        <Button
                          size="small"
                          type="primary"
                          onClick={(e) => openValidationModal(task, e)}
                        >
                          Validate Task
                        </Button>
                      )}
                      
                      {isEmployee && !task.completed && (
                        <div className="text-xs text-gray-500 italic">
                          Contact your supervisor or HR to mark this task as complete
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            // Fallback to checklist items if no tasks are available
            <div className="space-y-2">
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded">
                  <Checkbox 
                    checked={item.checked} 
                    onChange={() => handleChecklistItemToggle(item.id)}
                    disabled={isEmployee}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Task Detail Modal */}
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
          ),
          // HR verification controls
          canValidateTask(selectedTask!) && (
            <Button
              key="validate"
              type="primary"
              onClick={() => {
                setTaskModalVisible(false);
                setValidationModalVisible(true);
              }}
            >
              Review & Validate
            </Button>
          )
        ]}
      >
        {selectedTask && (
          <div>
            <p className="mb-4">{selectedTask.description}</p>
            <div className="space-y-2">
              <div><strong>Status:</strong> {selectedTask.completed ? 'Completed' : 'Not Started'}</div>
              {selectedTask.completed && (
                <div><strong>HR Validated:</strong> {selectedTask.hrValidated ? 'Yes' : 'No'}</div>
              )}
              {isEmployee && (
                <div className="p-3 bg-gray-50 rounded text-sm text-gray-600">
                  <strong>Note:</strong> You cannot edit this task. Contact your supervisor or HR for assistance.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Validation Modal */}
      <Modal
        title="Validate Task"
        open={validationModalVisible}
        onCancel={() => setValidationModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setValidationModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="validate" 
            type="primary" 
            loading={validationLoading}
            onClick={handleValidation}
          >
            Validate Task
          </Button>
        ]}
      >
        <div className="space-y-4">
          <p>Are you sure you want to validate this task?</p>
          <div>
            <label className="block text-sm font-medium mb-2">Validation Notes (Optional)</label>
            <Input.TextArea
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Add any notes about the validation..."
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OnboardingPhase;