import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Slider, Button, Tag, Space, Tooltip, Modal, message, Row, Col, Form } from 'antd';
import { SearchOutlined, EyeOutlined, DeleteOutlined, ExclamationCircleOutlined, WarningOutlined, PlusOutlined, DownloadOutlined, RollbackOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { EmployeeOnboarding, OnboardingStage, OnboardingJourney, OnboardingProgressResponse, ProgramType, TaskStatus, UserRole } from '../../types/onboarding';
import onboardingService from '../../services/onboardingService';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import Layout from '../../components/layout/Layout';
import { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { confirm } = Modal;

type SimpleUser = { id: string; name: string; department: string; email?: string; role?: string; programType?: string; startDate?: string };

const OnboardingManagement: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState<EmployeeOnboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOnboarding | null>(null);
  const [allUsers, setAllUsers] = useState<SimpleUser[]>([]);
  const [filters, setFilters] = useState({
    department: '',
    phase: '',
    completionRange: [0, 100],
    search: ''
  });
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editPhase, setEditPhase] = useState<OnboardingStage>('prepare');
  const [editCompletion, setEditCompletion] = useState<number>(0);
  const [currentPhases, setCurrentPhases] = useState<{ [userId: string]: string }>({});
  const [currentStatuses, setCurrentStatuses] = useState<{ [userId: string]: string }>({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data: OnboardingProgressResponse[] = await onboardingService.getAllProgresses();
      // Map backend data to table row shape
      const mapped: EmployeeOnboarding[] = data.map((item: OnboardingProgressResponse) => ({
        userId: item.User?.id || '',
        name: item.User?.name || '',
        email: item.User?.email || '',
        role: (item.User?.role ?? 'employee') as UserRole,
        department: item.User?.department || '',
        programType: (item.User?.programType as ProgramType) || 'inkompass',
        currentPhase: item.stage,
        completionPercentage: typeof item.progress === 'number' ? item.progress : 0,
        status: 'in_progress' as TaskStatus,
        startDate: item.User?.startDate || '',
        daysSinceStart: 0, // calculate if needed
        daysSinceLastActivity: 0, // calculate if needed
      }));
      setEmployees(mapped);
      // Always fetch current phases after employees are set
      fetchCurrentPhases(mapped);
    } catch {
      message.error('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/users?role=employee');
      setAllUsers(response.data);
    } catch {
      message.error('Failed to fetch users');
    }
  };

  const handleCreateJourney = async (values: { employeeId: string }) => {
    try {
      setLoading(true);
      await onboardingService.createJourney(values.employeeId);
      message.success('Onboarding journey created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      // Refresh the data
      await fetchEmployees();
      await fetchAllUsers();
    } catch {
      message.error('Failed to create onboarding journey');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmployee = (userId: string) => {
    navigate(`/admin/onboarding/${userId}`);
  };

  const handleDeleteJourney = (userId: string, name: string) => {
    confirm({
      title: 'Are you sure you want to delete this onboarding journey?',
      icon: <ExclamationCircleOutlined />,
      content: `This will permanently delete ${name}'s onboarding journey and cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      async onOk() {
        try {
          await onboardingService.deleteUserProgress(userId);
          message.success('Onboarding journey deleted successfully');
          fetchEmployees();
        } catch {
          message.error('Failed to delete onboarding journey');
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'green';
      case 'on track': return 'blue';
      case 'excel': return 'purple';
      case 'delayed': return 'red';
      default: return 'default';
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesDepartment = !filters.department || emp.department === filters.department;
    const matchesPhase = !filters.phase || emp.currentPhase === filters.phase;
    const matchesCompletion = emp.completionPercentage >= filters.completionRange[0] && 
                              emp.completionPercentage <= filters.completionRange[1];
    const matchesSearch = !filters.search || 
                          emp.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                          emp.role.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesDepartment && matchesPhase && matchesCompletion && matchesSearch;
  });

  // Analytics data preparation
  const departmentData = React.useMemo(() => {
    const deptMap = new Map();
    employees.forEach(emp => {
      if (!deptMap.has(emp.department)) {
        deptMap.set(emp.department, {
          department: emp.department,
          avgCompletion: 0,
          count: 0,
          totalCompletion: 0
        });
      }
      const dept = deptMap.get(emp.department);
      dept.count++;
      dept.totalCompletion += emp.completionPercentage;
    });
    
    return Array.from(deptMap.values()).map(dept => ({
      ...dept,
      avgCompletion: Math.round(dept.totalCompletion / dept.count)
    }));
  }, [employees]);

  const phaseDistribution = React.useMemo(() => {
    const phaseCounts = {
      'Prepare': 0,
      'Orient': 0,
      'Land': 0,
      'Integrate': 0,
      'Excel': 0,
      'Completed': 0
    };
    
    employees.forEach(emp => {
      if (emp.completionPercentage === 100) {
        phaseCounts['Completed']++;
      } else {
        phaseCounts[emp.currentPhase as keyof typeof phaseCounts]++;
      }
    });
    
    return Object.entries(phaseCounts).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#52c41a'];

  // Alert list - employees with overdue or stalled onboarding
  const alertEmployees = employees.filter(emp => 
    (emp.status && emp.status.toLowerCase() === 'delayed') || 
    (emp.daysSinceLastActivity && emp.daysSinceLastActivity > 14)
  );

  const handleResetJourney = (employee: EmployeeOnboarding) => {
    setSelectedEmployee(employee);
    setResetModalVisible(true);
  };

  const confirmResetJourney = async () => {
    if (!selectedEmployee) return;
    setActionLoading(true);
    try {
      await api.post(`/onboarding/${selectedEmployee.userId}/reset`, { resetToStage: 'prepare', keepCompletedTasks: false });
      message.success('Journey reset successfully');
      setResetModalVisible(false);
      fetchEmployees();
    } catch {
      message.error('Failed to reset journey');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!selectedEmployee) return;
    setActionLoading(true);
    try {
      await onboardingService.updateUserProgress(selectedEmployee.userId, { stage: editPhase, progress: editCompletion });
      message.success('Progress updated successfully');
      setEditModalVisible(false);
      fetchEmployees();
    } catch {
      message.error('Failed to update progress');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchCurrentPhases = async (users: EmployeeOnboarding[]) => {
    const phases: { [userId: string]: string } = {};
    const statuses: { [userId: string]: string } = {};
    await Promise.all(users.map(async (emp) => {
      try {
        const journey: OnboardingJourney = await onboardingService.getJourney(emp.userId);
        const phasesArr = journey.phases || journey.stages || [];
        // Find the first phase with incomplete tasks (the "current" phase, blue in UI)
        const currentPhaseObj = phasesArr.find(phase => phase.tasks.some(task => !task.completed));
        let phaseTitle = '';
        if (currentPhaseObj) {
          phaseTitle = currentPhaseObj.title;
        } else if (phasesArr.length > 0) {
          // All phases completed
          phaseTitle = 'Completed';
        } else {
          phaseTitle = emp.currentPhase;
        }
        if (phaseTitle) phaseTitle = phaseTitle.charAt(0).toUpperCase() + phaseTitle.slice(1);
        phases[emp.userId] = phaseTitle;
        // Status logic (unchanged)
        const allTasks = phasesArr.flatMap(phase => phase.tasks);
        const allCompleted = allTasks.length > 0 && allTasks.every(task => task.completed);
        statuses[emp.userId] = allCompleted ? 'Completed' : 'in progress';
      } catch {
        let phaseTitle = emp.currentPhase;
        if (phaseTitle) phaseTitle = phaseTitle.charAt(0).toUpperCase() + phaseTitle.slice(1);
        phases[emp.userId] = phaseTitle;
        statuses[emp.userId] = emp.status;
      }
    }));
    setCurrentPhases(phases);
    setCurrentStatuses(statuses);
  };

  useEffect(() => {
    if (employees.length > 0) {
      fetchCurrentPhases(employees);
    }
  }, [employees]);

  // Define columns with proper TypeScript typing
  const columns: ColumnsType<EmployeeOnboarding> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: EmployeeOnboarding, b: EmployeeOnboarding) => a.name.localeCompare(b.name)
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      filters: [...new Set(employees.map(e => e.role))].map(role => ({ text: role, value: role })),
      onFilter: (value: boolean | React.Key, record: EmployeeOnboarding) => record.role === value.toString()
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: 'Current Phase',
      dataIndex: 'currentPhase',
      key: 'currentPhase',
      render: (_: unknown, record: EmployeeOnboarding) => currentPhases[record.userId] || record.currentPhase
    },
    {
      title: 'Completion',
      dataIndex: 'completionPercentage',
      key: 'completion',
      render: (completion: number) => `${completion}%`,
      sorter: (a: EmployeeOnboarding, b: EmployeeOnboarding) => a.completionPercentage - b.completionPercentage
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_: unknown, record: EmployeeOnboarding) => {
        const status = (record.completionPercentage === 100) ? 'Completed' : (currentStatuses[record.userId] || record.status);
        return (
          <Tag color={getStatusColor(status)}>
            {status}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: EmployeeOnboarding) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => handleViewEmployee(record.userId)}
              type="primary"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Reset Journey">
            <Button 
              icon={<RollbackOutlined />} 
              onClick={() => handleResetJourney(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete Journey">
            <Button 
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteJourney(record.userId, record.name)}
              danger
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Onboarding Management</h1>
        
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={12}>
            <Card title="Department Completion Rates" className="h-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis label={{ value: 'Avg. Completion %', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip />
                  <Bar dataKey="avgCompletion" fill="#8884d8" name="Avg. Completion %" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="Phase Distribution" className="h-full">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={phaseDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {phaseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
        
        {alertEmployees.length > 0 && (
          <Card 
            title={<><WarningOutlined className="text-red-500 mr-2" /> Attention Required</>}
            className="mb-6"
            bordered={false}
            style={{ backgroundColor: '#fff2f0' }}
          >
            <p className="mb-4">The following employees have delayed or stalled onboarding progress:</p>
            <ul className="list-disc pl-6">
              {alertEmployees.map(emp => (
                <li key={emp.userId} className="mb-2">
                  <span className="font-medium">{emp.name}</span> - {emp.department} - 
                  <span className="text-red-500">
                    {emp.status?.toLowerCase() === 'delayed' ? 'Has overdue tasks' : `No activity for ${emp.daysSinceLastActivity} days`}
                  </span>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => handleViewEmployee(emp.userId)}
                  >
                    View
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}
        
        <Card className="mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="w-full md:w-64">
              <Input 
                placeholder="Search by name or role" 
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
              />
            </div>
            
            <div className="w-full md:w-48">
              <Select
                placeholder="Filter by department"
                style={{ width: '100%' }}
                value={filters.department || undefined}
                onChange={value => setFilters({...filters, department: value})}
                allowClear
              >
                {[...new Set(employees.map(e => e.department))]
                  .filter(dept => dept != null)
                  .map(dept => (
                    <Option key={dept} value={dept}>{dept}</Option>
                  ))}
              </Select>
            </div>
            
            <div className="w-full md:w-48">
              <Select
                placeholder="Filter by phase"
                style={{ width: '100%' }}
                value={filters.phase || undefined}
                onChange={value => setFilters({...filters, phase: value})}
                allowClear
              >
                {['Prepare', 'Orient', 'Land', 'Integrate', 'Excel']
                  .map(phase => (
                    <Option key={phase} value={phase}>{phase}</Option>
                  ))}
              </Select>
            </div>
            
            <div className="w-full md:w-64">
              <span className="block mb-1">Completion Range</span>
              <Slider
                range
                value={filters.completionRange}
                onChange={value => setFilters({...filters, completionRange: value as [number, number]})}
              />
            </div>
          </div>
        </Card>
        
        <div className="mb-4 flex gap-4">
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => {
              fetchAllUsers();
              setCreateModalVisible(true);
            }}
          >
            Create New Onboarding Journey
          </Button>
          <Button
            icon={<DownloadOutlined />}
            loading={csvLoading}
            onClick={() => {
              setCsvLoading(true);
              // Implement CSV export logic here
              setCsvLoading(false);
            }}
          >
            Export CSV
          </Button>
          <Button onClick={fetchEmployees} icon={<ReloadOutlined />}>Refresh Table</Button>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={filteredEmployees} 
          rowKey="userId"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
        
        <Modal
          title="Create New Onboarding Journey"
          open={createModalVisible}
          onCancel={() => {
            setCreateModalVisible(false);
            setSelectedEmployee(null);
          }}
          footer={null}
        >
          <Form form={form} layout="vertical">
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Select Employee:</label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Choose an employee"
                  value={selectedEmployee?.userId}
                  onChange={(userId) => {
                    const user = allUsers.find(u => u.id === userId);
                    if (user) {
                      setSelectedEmployee({
                        userId: user.id,
                        name: user.name ?? '',
                        email: user.email ?? '',
                        role: (user.role ?? 'employee') as UserRole,
                        department: user.department ?? '',
                        programType: (user.programType ?? 'inkompass') as ProgramType,
                        currentPhase: 'prepare',
                        completionPercentage: 0,
                        status: 'in_progress',
                        startDate: user.startDate ?? '',
                        daysSinceStart: 0,
                        daysSinceLastActivity: 0,
                      });
                    } else {
                      setSelectedEmployee(null);
                    }
                  }}
                >
                  {allUsers.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name} - {user.department}
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button onClick={() => {
                  setCreateModalVisible(false);
                  setSelectedEmployee(null);
                }}>
                  Cancel
                </Button>
                <Button 
                  type="primary"
                  onClick={() => selectedEmployee && handleCreateJourney({ employeeId: selectedEmployee.userId })}
                  disabled={!selectedEmployee}
                >
                  Create Journey
                </Button>
              </div>
            </div>
          </Form>
        </Modal>
        <Modal
          title="Reset Onboarding Journey"
          open={resetModalVisible}
          onCancel={() => setResetModalVisible(false)}
          confirmLoading={actionLoading}
          onOk={confirmResetJourney}
        >
          <p>Reset {selectedEmployee?.name}'s onboarding journey? This cannot be undone.</p>
        </Modal>
        <Modal
          title="Edit Onboarding Progress"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onOk={handleEditSave}
          confirmLoading={actionLoading}
        >
          <div style={{ marginBottom: 16 }}>
            <label>Phase:</label>
            <Select value={editPhase} onChange={setEditPhase} style={{ width: '100%' }}>
              {['prepare', 'orient', 'land', 'integrate', 'excel'].map(phase => (
                <Option key={phase} value={phase}>{phase.charAt(0).toUpperCase() + phase.slice(1)}</Option>
              ))}
            </Select>
          </div>
          <div>
            <label>Completion (%):</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={editCompletion}
              onChange={e => setEditCompletion(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default OnboardingManagement;