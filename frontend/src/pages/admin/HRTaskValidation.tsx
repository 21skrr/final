import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Card, Select, message, Tabs, Progress, Modal, Input } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined, CommentOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface Task {
  id: string;
  title: string;
  stage: string;
  completed: boolean;
  hrValidated: boolean;
  description: string;
  UserId?: string;
}

interface ProgressData {
  [key: string]: number;
}

const HRTaskValidation: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressData>({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<{id: string, title: string} | null>(null);
  const [comments, setComments] = useState('');

  const phases = ['prepare', 'orient', 'land', 'integrate', 'excel'];
  const phaseNames = {
    prepare: 'Preparation',
    orient: 'Orientation',
    land: 'Landing',
    integrate: 'Integration',
    excel: 'Excellence'
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeTasks();
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/users?role=employee');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to load employees');
    }
  };

  const fetchEmployeeTasks = async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/onboarding/progress/${selectedEmployee}`);
      const data = await response.json();
      setTasks(data.tasksByPhase);
      setProgress(data.progress);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      message.error('Failed to load tasks');
      setLoading(false);
    }
  };

  const handleValidateTask = async (taskId: string, userId: string, comments?: string) => {
    try {
      const response = await fetch(`/api/onboarding/tasks/${taskId}/validate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          comments
        })
      });
      
      if (!response.ok) throw new Error('Failed to validate task');
      
      message.success('Task validated successfully');
      fetchEmployeeTasks(); // Refresh data
    } catch (error) {
      console.error('Error validating task:', error);
      message.error('Failed to validate task');
    }
  };

  const getTaskStatusTag = (task: Task) => {
    if (task.hrValidated) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>HR Validated</Tag>;
    }
    if (task.completed) {
      return <Tag color="orange" icon={<ClockCircleOutlined />}>Pending HR Validation</Tag>;
    }
    return <Tag color="default">Not Completed</Tag>;
  };

  const columns = [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      key: 'status',
      render: (task: Task) => getTaskStatusTag(task)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (task: Task) => (
        task.completed && !task.hrValidated ? (
          <div className="flex space-x-2">
            <Button 
              type="primary"
              onClick={() => {
                if (selectedEmployee) {
                  handleValidateTask(task.id, selectedEmployee);
                }
              }}
            >
              Validate
            </Button>
            <Button 
              type="default"
              icon={<CommentOutlined />}
              onClick={() => {
                setCurrentTask({ id: task.id, title: task.title });
                setComments('');
                setIsModalVisible(true);
              }}
            >
              With Comments
            </Button>
          </div>
        ) : null
      )
    }
  ];

  const items: TabsProps['items'] = phases.map(phase => ({
    key: phase,
    label: phaseNames[phase],
    children: (
      <div>
        <div className="mb-4">
          <Progress 
            percent={progress[phase] || 0} 
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>
        <Table 
          dataSource={tasks[phase] || []} 
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </div>
    ),
  }));

  return (
    <div className="p-6">
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">HR Task Validation</h1>
          <Select
            className="w-64"
            placeholder="Select Employee"
            onChange={setSelectedEmployee}
            value={selectedEmployee}
            loading={loading}
          >
            {employees.map(emp => (
              <Select.Option key={emp.id} value={emp.id}>
                <UserOutlined /> {emp.name} - {emp.department}
              </Select.Option>
            ))}
          </Select>
        </div>

        {selectedEmployee && (
          <div>
            <Card className="mb-4">
              <h2 className="text-lg mb-2">Overall Progress</h2>
              <Progress 
                percent={progress.overall || 0} 
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </Card>

            <Tabs 
              defaultActiveKey="prepare" 
              items={items}
              className="mt-4"
            />
          </div>
        )}
      </Card>

      {/* Modal for adding comments */}
      <Modal
        title={`Validate Task: ${currentTask?.title || ''}`}
        open={isModalVisible}
        onOk={() => {
          if (currentTask && selectedEmployee) {
            handleValidateTask(currentTask.id, selectedEmployee, comments);
            setIsModalVisible(false);
          }
        }}
        onCancel={() => setIsModalVisible(false)}
      >
        <p>Add comments for this task validation:</p>
        <Input.TextArea 
          rows={4} 
          value={comments} 
          onChange={(e) => setComments(e.target.value)} 
          placeholder="Enter your comments here..."
        />
      </Modal>
    </div>
  );
};

export default HRTaskValidation;