import React, { useState } from 'react';
import { Progress, Tooltip, Modal, Button, Tag, Checkbox, Input, message, Card, Divider, Upload } from 'antd';
import { InfoCircleOutlined, ClockCircleOutlined, CheckCircleOutlined, LockOutlined, CheckOutlined, CloseOutlined, CommentOutlined, UploadOutlined, PaperClipOutlined } from '@ant-design/icons';
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
  
  // Handle checklist item toggle
  const handleChecklistItemToggle = (id: number) => {
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
    setSelectedTask(task);
    setValidationModalVisible(true);
  };

  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate) return false;
    return new Date() > new Date(task.dueDate) && !task.completed;
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

  // Determine if user can edit a specific task based on controlledBy and role
  const canEditTask = (task: Task) => {
    // HR/Manager can edit any task
    if (userRole === 'hr' || userRole === 'manager') return true;
    
    // If task is controlled by HR, only HR/Manager can edit
    if (task.controlledBy === 'hr') return false;
    
    // If task is already validated, it cannot be edited
    if (task.hrValidated) return false;
    
    // Otherwise, if user has edit permission, they can edit
    return canEditTasks;
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
          {tasks.map(task => (
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
                        onChange={(e) => {
                          e.stopPropagation();
                          canEditTask(task) && onTaskComplete(task.id);
                        }}
                        disabled={!canEditTask(task)}
                      />
                      <div>
                        <h4 className={`text-base font-medium m-0 ${task.completed && !task.hrValidated ? '' : (task.completed && task.hrValidated ? 'text-green-700' : '')}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-gray-600 mb-0 text-sm">{task.description}</p>
                        )}
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
                      {task.hrValidated && task.hrValidatedAt && (
                        <span className="flex items-center">
                          <CheckCircleOutlined className="mr-1 text-green-600" />
                          Validated: {new Date(task.hrValidatedAt).toLocaleDateString()}
                        </span>
                      )}
                      {task.controlledBy === 'hr' && userRole !== 'hr' && userRole !== 'manager' && (
                        <Tooltip title="HR controlled task">
                          <LockOutlined className="ml-2 text-gray-500" />
                        </Tooltip>
                      )}
                      {task.evidenceRequired && (
                        <Tooltip title="Evidence required for validation">
                          <span className="flex items-center text-blue-600">
                            <InfoCircleOutlined className="mr-1" />
                            Evidence Required
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    {task.hrComments && (
                      <div className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded">
                        <CommentOutlined className="mr-2" />
                        {task.hrComments}
                      </div>
                    )}
                    {task.evidenceUrl && (
                      <div className="text-sm text-blue-600 mt-3">
                        <Button 
                          type="link" 
                          size="small" 
                          className="p-0" 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(task.evidenceUrl, '_blank');
                          }}
                        >
                          <InfoCircleOutlined className="mr-1" />
                          View Evidence Document
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {task.completed && !task.hrValidated && (userRole === 'hr' || userRole === 'manager') && (
                  <Button 
                    type="primary"
                    onClick={(e) => openValidationModal(task, e)}
                    className="ml-4"
                    icon={<CheckCircleOutlined />}
                  >
                    Review & Validate
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {tasks.length === 0 && (
             <div className="bg-white p-4 rounded-lg border border-gray-200">
               <div className="flex justify-between items-center mb-3">
                 <h4 className="font-medium">{title} Checklist</h4>
                 <Tag color={checklistProgress === 100 ? 'success' : 'processing'}>
                   {checklistProgress}% Complete
                 </Tag>
               </div>
               
               <Progress percent={checklistProgress} status={checklistProgress === 100 ? 'success' : 'active'} className="mb-4" />
               
               <div className="space-y-3">
                 {checklistItems.map(item => (
                   <div key={item.id} className={`flex items-start p-3 rounded-lg ${item.checked ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'}`}>
                     <Checkbox 
                       className="mt-1" 
                       checked={item.checked}
                       onChange={() => handleChecklistItemToggle(item.id)}
                     />
                     <div className="ml-2">
                       <p className={`font-medium ${item.checked ? 'text-green-700' : ''}`}>{item.title}</p>
                       <p className="text-gray-500 text-sm">{item.description}</p>
                     </div>
                   </div>
                 ))}
               </div>
               
               <div className="mt-4 flex justify-end">
                 <Button 
                   type="primary" 
                   disabled={checklistProgress !== 100}
                   onClick={() => {
                     message.success('Checklist submitted for validation!');
                   }}
                 >
                   {checklistProgress === 100 ? 'Submit for Validation' : 'Complete All Items'}
                 </Button>
               </div>
             </div>
           )}
        </div>
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
          ),
          // HR verification controls
          userRole && (userRole === 'hr' || userRole === 'manager') && selectedTask && selectedTask.completed && !selectedTask.hrValidated && (
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
            <p>{selectedTask.description}</p>
            <div className="mt-4">
              <p><strong>Due Date:</strong> {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No due date'}</p>
              <p><strong>Status:</strong> {selectedTask.completed ? (selectedTask.hrValidated ? 'Validated' : 'Completed, Pending Validation') : isTaskOverdue(selectedTask) ? 'Overdue' : 'Pending'}</p>
              {selectedTask.controlledBy === 'hr' && userRole !== 'hr' && userRole !== 'manager' && (
                <p><strong>Note:</strong> <span className="text-orange-500">This task can only be completed by HR personnel</span></p>
              )}
              {selectedTask.completedAt && (
                <p><strong>Completed On:</strong> {new Date(selectedTask.completedAt).toLocaleString()}</p>
              )}
              {selectedTask.hrValidated && selectedTask.hrValidatedAt && (
                <p><strong>Validated On:</strong> {new Date(selectedTask.hrValidatedAt).toLocaleString()}</p>
              )}
              {selectedTask.hrComments && (
                <p><strong>HR Comments:</strong> {selectedTask.hrComments}</p>
              )}
              
              {/* Evidence section */}
              {selectedTask.evidenceRequired && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium mb-2">Evidence Required</h4>
                  {selectedTask.evidenceUrl ? (
                    <div className="bg-blue-50 p-3 rounded">
                      <p><strong>Evidence Provided:</strong> {selectedTask.evidenceDescription || 'No description provided'}</p>
                      <Button 
                        type="link" 
                        icon={<PaperClipOutlined />} 
                        href={selectedTask.evidenceUrl} 
                        target="_blank"
                      >
                        View Evidence Document
                      </Button>
                    </div>
                  ) : canEditTask(selectedTask) && !selectedTask.hrValidated ? (
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="mb-2">Please provide evidence to complete this task:</p>
                      <div className="mb-3">
                        <label className="block mb-1 text-sm">Evidence Description:</label>
                        <Input 
                          placeholder="Describe the evidence you're providing"
                          value={evidenceDescription}
                          onChange={(e) => setEvidenceDescription(e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block mb-1 text-sm">Evidence URL:</label>
                        <Input 
                          placeholder="Paste a link to your evidence document"
                          value={evidenceUrl}
                          onChange={(e) => setEvidenceUrl(e.target.value)}
                          addonAfter={
                            <Tooltip title="Provide a link to your evidence document (Google Drive, SharePoint, etc.)">
                              <InfoCircleOutlined />
                            </Tooltip>
                          }
                        />
                      </div>
                      <Button 
                        type="primary" 
                        icon={<UploadOutlined />}
                        loading={uploadLoading}
                        onClick={async () => {
                          if (!evidenceUrl) {
                            message.error('Please provide an evidence URL');
                            return;
                          }
                          
                          try {
                            setUploadLoading(true);
                            const response = await fetch(`/api/onboarding/tasks/${selectedTask.id}/evidence`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                evidenceUrl,
                                evidenceDescription
                              })
                            });
                            
                            if (!response.ok) {
                              throw new Error('Failed to upload evidence');
                            }
                            
                            message.success('Evidence uploaded successfully');
                            // Update the task with the new evidence
                            selectedTask.evidenceUrl = evidenceUrl;
                            selectedTask.evidenceDescription = evidenceDescription;
                            setEvidenceUrl('');
                            setEvidenceDescription('');
                            // Refresh the page to show the updated task
                            window.location.reload();
                          } catch (error) {
                            console.error('Error uploading evidence:', error);
                            message.error('Failed to upload evidence');
                          } finally {
                            setUploadLoading(false);
                          }
                        }}
                      >
                        Submit Evidence
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-red-600">Evidence is required but has not been provided yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
      
      <Modal
        title="Task Validation"
        open={validationModalVisible}
        onCancel={() => {
          setValidationModalVisible(false);
          setVerificationNotes('');
        }}
        width={700}
        footer={[
          <Button 
            key="reject"
            danger
            icon={<CloseOutlined />}
            onClick={async () => {
              try {
                setValidationLoading(true);
                const response = await fetch(`/api/onboarding/tasks/${selectedTask?.id}/status`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    completed: true,
                    hrValidated: false,
                    comments: verificationNotes,
                    hrValidatedBy: userRole === 'hr' ? 'HR' : 'Manager',
                    hrValidatedAt: new Date().toISOString()
                  })
                });
                
                if (!response.ok) {
                  throw new Error('Failed to reject task');
                }
                
                message.success('Task validation rejected');
                setValidationModalVisible(false);
                setVerificationNotes('');
                // Refresh data
                window.location.reload();
              } catch (error) {
                console.error('Error rejecting task:', error);
                message.error('Failed to reject task');
              } finally {
                setValidationLoading(false);
              }
            }}
            loading={validationLoading}
          >
            Reject
          </Button>,
          <Button
            key="validate"
            type="primary"
            icon={<CheckOutlined />}
            onClick={async () => {
              try {
                setValidationLoading(true);
                const response = await fetch(`/api/onboarding/tasks/${selectedTask?.id}/status`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    completed: true,
                    hrValidated: true,
                    comments: verificationNotes,
                    hrValidatedBy: userRole === 'hr' ? 'HR' : 'Manager',
                    hrValidatedAt: new Date().toISOString()
                  })
                });
                
                if (!response.ok) {
                  throw new Error('Failed to validate task');
                }
                
                message.success('Task validated successfully');
                setValidationModalVisible(false);
                setVerificationNotes('');
                // Refresh data
                window.location.reload();
              } catch (error) {
                console.error('Error validating task:', error);
                message.error('Failed to validate task');
              } finally {
                setValidationLoading(false);
              }
            }}
            loading={validationLoading}
          >
            Validate
          </Button>
        ]}
      >
        {selectedTask && (
          <>
            <div className="mb-4">
              <h3 className="font-medium text-lg">{selectedTask.title}</h3>
              <p className="text-gray-600">{selectedTask.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-medium">Current Status:</span> {getTaskStatusTag(selectedTask)}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-2">Task Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Completed On:</strong> {selectedTask.completedAt ? new Date(selectedTask.completedAt).toLocaleString() : 'Not completed'}</p>
                  <p><strong>Completed By:</strong> {selectedTask.completedBy || (selectedTask.User?.name) || 'Unknown'}</p>
                  {selectedTask.dueDate && (
                    <p><strong>Due Date:</strong> {new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                  )}
                </div>
                <div>
                  <p><strong>Task Type:</strong> {selectedTask.controlledBy === 'hr' ? 'HR Controlled' : 'Employee Task'}</p>
                  <p><strong>Phase:</strong> {selectedTask.stage.charAt(0).toUpperCase() + selectedTask.stage.slice(1)}</p>
                </div>
              </div>
            </div>
            
            {selectedTask.evidenceUrl && (
              <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Task Evidence</h4>
                <p>{selectedTask.evidenceDescription || 'No description provided'}</p>
                <div className="mt-2">
                  <Button type="link" href={selectedTask.evidenceUrl} target="_blank">
                    View Evidence Document
                  </Button>
                </div>
              </div>
            )}
            
            <Divider />
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">Validation Comments:</label>
              <Input.TextArea
                rows={4}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add any comments about this task validation..."
                className="w-full"
              />
              <p className="text-gray-500 text-sm mt-1">These comments will be visible to the employee</p>
            </div>
            
            {selectedTask?.evidenceRequired && !selectedTask?.evidenceUrl && (
              <div className="mb-4 bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-red-600">Evidence Required</h4>
                <p className="text-red-600">This task requires evidence for validation, but none has been provided.</p>
                <p className="text-gray-600 mt-2">Please ask the employee to provide evidence before validating this task.</p>
              </div>
            )}
            
            <div className="bg-yellow-50 p-3 rounded-lg text-sm">
              <p className="font-medium">Validation Guidelines:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Verify that the task was completed according to company standards</li>
                <li>Check if any required documentation or evidence is present and valid</li>
                <li>Provide constructive feedback in the comments if rejecting the task</li>
              </ul>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default OnboardingPhase;