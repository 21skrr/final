import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Input,
  Select,
  Slider,
  Button,
  Tag,
  Space,
  Tooltip,
  Modal,
  message,
  Row,
  Col,
  Radio,
  Typography,
  Form,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  DownloadOutlined,
  ReloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Clock, AlertTriangle, Users, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  OnboardingStage,
  OnboardingJourney,
  TaskStatus,
  JourneyType,
  JourneyTypeOption,
  OnboardingProgressResponse,
} from "../../types/onboarding";
import onboardingService from "../../services/onboardingService";
import api from "../../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import Layout from "../../components/layout/Layout";
import { ColumnsType } from "antd/es/table";
import { useAuth } from "../../context/AuthContext";

const { Option } = Select;
const { confirm } = Modal;
const { Title } = Typography;

type UserOnboarding = {
  id: string;
  name: string;
  department: string;
  email?: string;
  role: 'employee' | 'supervisor';
  programType?: string;
  startDate?: string;
  currentPhase?: OnboardingStage;
  completionPercentage?: number;
  status?: TaskStatus;
  daysSinceStart?: number;
  daysSinceLastActivity?: number;
};

const ManagerOnboardingManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserOnboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserOnboarding | null>(null);
  const [journeyTypes, setJourneyTypes] = useState<JourneyTypeOption[]>([]);
  const [selectedJourneyType, setSelectedJourneyType] = useState<JourneyType | null>(null);
  const [selectedRole, setSelectedRole] = useState<'employee' | 'supervisor'>('employee');
  const [filters, setFilters] = useState({
    department: "",
    phase: "",
    completionRange: [0, 100],
    search: "",
  });
  const [csvLoading, setCsvLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentPhases, setCurrentPhases] = useState<{
    [userId: string]: string;
  }>({});
  const [currentStatuses, setCurrentStatuses] = useState<{
    [userId: string]: string;
  }>({});
  const { user } = useAuth();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
    fetchJourneyTypes();
    fetchAllUsers();
  }, [selectedRole]);

  const fetchJourneyTypes = async () => {
    try {
      const response = await onboardingService.getJourneyTypes();
      setJourneyTypes(response.journeyTypes || []);
    } catch (error) {
      console.error("Failed to fetch journey types:", error);
      message.error("Failed to load journey types");
    }
  };

  const fetchAllUsers = async () => {
    try {
      console.log("Fetching all users for create journey modal...");
      const response = await api.get("/users");
      const users = response.data || response;
      console.log("All users received:", users);
      setAllUsers(users);
    } catch (error) {
      console.error("Failed to fetch all users:", error);
      console.log("Falling back to existing users data for create journey modal");
      // Don't show error message, just use existing users as fallback
      setAllUsers([]);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      console.log(`Fetching ${selectedRole}s onboarding data...`);
      
      // Get all onboarding progress data (same as admin)
      const allProgressData = await onboardingService.getAllProgresses();
      console.log("All progress data received:", allProgressData);
      console.log("All progress data length:", allProgressData.length);
      
      // Filter to only include users with the selected role
      const roleProgressData = allProgressData.filter(progress => 
        progress.User?.role === selectedRole
      );
      console.log(`Filtered ${selectedRole} progress data:`, roleProgressData);
      console.log(`Filtered ${selectedRole} progress data length:`, roleProgressData.length);
      
      // Map the progress data to UserOnboarding format
      const usersWithProgress: UserOnboarding[] = roleProgressData.map((item: any) => ({
        id: item.User?.id || "",
        name: item.User?.name || 'Unknown',
        department: item.User?.department || 'Unknown',
        email: item.User?.email || '',
        role: selectedRole,
        programType: item.User?.programType || 'inkompass',
        startDate: item.User?.startDate,
        currentPhase: item.stage || 'pre_onboarding',
        completionPercentage: typeof item.progress === 'number' ? item.progress : 0,
        status: item.stage === 'completed' ? 'completed' : 'in_progress',
        daysSinceStart: item.User?.startDate ? 
          Math.floor((new Date().getTime() - new Date(item.User.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        daysSinceLastActivity: 0,
      }));
      
      console.log(`Mapped ${selectedRole}s with progress:`, usersWithProgress);
      setUsers(usersWithProgress);
      fetchCurrentPhases(usersWithProgress);
    } catch (error) {
      console.error(`Failed to fetch ${selectedRole}s:`, error);
      message.error(`Failed to load ${selectedRole}s`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (userId: string) => {
    navigate(`/manager/onboarding/${userId}`);
  };

  const handleCreateJourney = async (values: { userId: string; journeyType: JourneyType }) => {
    try {
      setLoading(true);
      console.log("Creating journey for user:", values.userId, "with type:", values.journeyType);
      const result = await onboardingService.createJourney(values.userId, values.journeyType);
      console.log("Journey creation result:", result);
      message.success("Onboarding journey created successfully");
      setCreateModalVisible(false);
      setSelectedUser(null);
      setSelectedJourneyType(null);
      form.resetFields();
      console.log("Refreshing users data...");
      await fetchUsers();
      console.log("Users data refreshed");
    } catch (error: any) {
      console.error("Failed to create journey:", error);
      message.error(error?.response?.data?.message || "Failed to create onboarding journey");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJourney = (userId: string, name: string) => {
    confirm({
      title: "Are you sure you want to delete this onboarding journey?",
      icon: <ExclamationCircleOutlined />,
      content: `This will permanently delete ${name}'s onboarding journey and cannot be undone.`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      async onOk() {
        try {
          await onboardingService.deleteUserProgress(userId);
          message.success("Onboarding journey deleted successfully");
          fetchUsers();
        } catch {
          message.error("Failed to delete onboarding journey");
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "green";
      case "in_progress":
        return "blue";
      case "not_started":
        return "default";
      case "delayed":
        return "red";
      default:
        return "default";
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase.toLowerCase()) {
      case "pre_onboarding":
        return "orange";
      case "phase_1":
        return "blue";
      case "phase_2":
        return "purple";
      case "completed":
        return "green";
      default:
        return "default";
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesDepartment =
      !filters.department || user.department === filters.department;
    const matchesPhase = !filters.phase || user.currentPhase === filters.phase;
    const matchesCompletion =
      (user.completionPercentage || 0) >= filters.completionRange[0] &&
      (user.completionPercentage || 0) <= filters.completionRange[1];
    const matchesSearch =
      !filters.search ||
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.department.toLowerCase().includes(filters.search.toLowerCase());

    return (
      matchesDepartment && matchesPhase && matchesCompletion && matchesSearch
    );
  });

  // Analytics data preparation
  const departmentData = React.useMemo(() => {
    const deptMap = new Map();
    users.forEach((user) => {
      if (!deptMap.has(user.department)) {
        deptMap.set(user.department, {
          department: user.department,
          avgCompletion: 0,
          count: 0,
          totalCompletion: 0,
        });
      }
      const dept = deptMap.get(user.department);
      dept.count++;
      dept.totalCompletion += user.completionPercentage || 0;
    });

    return Array.from(deptMap.values()).map((dept) => ({
      ...dept,
      avgCompletion: Math.round(dept.totalCompletion / dept.count),
    }));
  }, [users]);

  const phaseDistribution = React.useMemo(() => {
    const phaseCounts = {
      "Pre-Onboarding": 0,
      "Phase 1": 0,
      "Phase 2": 0,
      Completed: 0,
    };

    users.forEach((user) => {
      if ((user.completionPercentage || 0) === 100) {
        phaseCounts["Completed"]++;
      } else {
        const phaseKey = user.currentPhase === "pre_onboarding" ? "Pre-Onboarding" :
                        user.currentPhase === "phase_1" ? "Phase 1" :
                        user.currentPhase === "phase_2" ? "Phase 2" :
                        user.currentPhase;
        if (phaseKey in phaseCounts) {
          phaseCounts[phaseKey as keyof typeof phaseCounts]++;
        }
      }
    });

    return Object.entries(phaseCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [users]);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#52c41a",
  ];

  // Alert list - users with overdue or stalled onboarding
  const alertUsers = users.filter(
    (user) =>
      (user.status && user.status.toLowerCase() === "delayed") ||
      (user.daysSinceLastActivity && user.daysSinceLastActivity > 14) ||
      (user.completionPercentage || 0) < 20 && (user.daysSinceStart || 0) > 30
  );

  const fetchCurrentPhases = async (users: UserOnboarding[]) => {
    const phases: { [userId: string]: string } = {};
    const statuses: { [userId: string]: string } = {};
    
    await Promise.all(
      users.map(async (user) => {
        try {
          const journey: OnboardingJourney = await onboardingService.getJourney(user.id);
          const phasesArr = journey.phases || journey.stages || [];
          
          // Find the first phase with incomplete tasks
          const currentPhaseObj = phasesArr.find((phase) =>
            phase.tasks.some((task) => !task.completed)
          );
          
          let phaseTitle = "";
          if (currentPhaseObj) {
            phaseTitle = currentPhaseObj.title;
          } else if (phasesArr.length > 0) {
            phaseTitle = "Completed";
          } else {
            phaseTitle = user.currentPhase || "Pre-Onboarding";
          }
          
          if (phaseTitle) {
            phaseTitle = phaseTitle.charAt(0).toUpperCase() + phaseTitle.slice(1);
          }
          
          phases[user.id] = phaseTitle;
          
          // Status logic
          const allTasks = phasesArr.flatMap((phase) => phase.tasks);
          const allCompleted = allTasks.length > 0 && allTasks.every((task) => task.completed);
          statuses[user.id] = allCompleted ? "Completed" : "In Progress";
        } catch {
          let phaseTitle = user.currentPhase || "Pre-Onboarding";
          if (phaseTitle) {
            phaseTitle = phaseTitle.charAt(0).toUpperCase() + phaseTitle.slice(1);
          }
          phases[user.id] = phaseTitle;
          statuses[user.id] = user.status || "Not Started";
        }
      })
    );
    
    setCurrentPhases(phases);
    setCurrentStatuses(statuses);
  };

  // Define columns with proper TypeScript typing
  const columns: ColumnsType<UserOnboarding> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: UserOnboarding, b: UserOnboarding) => a.name.localeCompare(b.name),
      render: (name: string, record: UserOnboarding) => (
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            record.role === 'employee' ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'
          }`}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === 'employee' ? 'blue' : 'purple'}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Current Phase",
      dataIndex: "currentPhase",
      key: "currentPhase",
      render: (_: unknown, record: UserOnboarding) => {
        const phase = currentPhases[record.id] || record.currentPhase;
        return (
          <Tag color={getPhaseColor(phase || "")}>
            {phase ? phase.charAt(0).toUpperCase() + phase.slice(1) : "Pre-Onboarding"}
          </Tag>
        );
      },
    },
    {
      title: "Progress",
      dataIndex: "completionPercentage",
      key: "progress",
      render: (completion: number) => (
        <div className="flex items-center space-x-2">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${completion === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${completion || 0}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium">{completion || 0}%</span>
        </div>
      ),
      sorter: (a: UserOnboarding, b: UserOnboarding) => 
        (a.completionPercentage || 0) - (b.completionPercentage || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_: unknown, record: UserOnboarding) => {
        const status = currentStatuses[record.id] || record.status || "Not Started";
        return <Tag color={getStatusColor(status)}>{status}</Tag>;
      },
    },
    {
      title: "Days in Program",
      dataIndex: "daysSinceStart",
      key: "daysSinceStart",
      render: (days: number) => (
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{days || 0} days</span>
        </div>
      ),
      sorter: (a: UserOnboarding, b: UserOnboarding) => 
        (a.daysSinceStart || 0) - (b.daysSinceStart || 0),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: UserOnboarding) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewUser(record.id)}
              type="primary"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete Journey">
            <Button
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteJourney(record.id, record.name)}
              danger
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleExportCSV = async () => {
    setCsvLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/onboarding/export/csv",
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "text/csv",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let filename = `${selectedRole}_onboarding_report.csv`;
      const contentDisposition = response.headers.get("content-disposition");
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const csvText = await response.text();
      const blob = new Blob([csvText], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export CSV:", err);
      message.error("Failed to export CSV. Please try again.");
    } finally {
      setCsvLoading(false);
    }
  };

  const avgProgress = users.length > 0 
    ? Math.round(users.reduce((sum, user) => sum + (user.completionPercentage || 0), 0) / users.length)
    : 0;

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <Title level={2} className="mb-0 text-gray-800">Onboarding Management</Title>
              <p className="text-gray-600 mt-1">Comprehensive onboarding oversight for your team</p>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <Card className="mb-6 shadow-sm border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Onboarding Management</h3>
                <p className="text-sm text-gray-600">Select the role type to manage</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="relative">
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                  <button
                    onClick={() => setSelectedRole("employee")}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedRole === "employee"
                        ? "bg-blue-600 text-white shadow-md transform scale-105"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Employees
                  </button>
                  <button
                    onClick={() => setSelectedRole("supervisor")}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedRole === "supervisor"
                        ? "bg-blue-600 text-white shadow-md transform scale-105"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Supervisors
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                selectedRole === 'employee' ? 'bg-blue-100' : 'bg-purple-100'
              }`}>
                <Users className={`h-6 w-6 ${selectedRole === 'employee' ? 'text-blue-600' : 'text-purple-600'}`} />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{users.length}</div>
              <div className="text-sm font-medium text-gray-600">{selectedRole === 'employee' ? 'Employees' : 'Supervisors'}</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{avgProgress}%</div>
              <div className="text-sm font-medium text-gray-600">Avg. Progress</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {users.filter(u => (u.completionPercentage || 0) < 100).length}
              </div>
              <div className="text-sm font-medium text-gray-600">In Progress</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{alertUsers.length}</div>
              <div className="text-sm font-medium text-gray-600">Need Attention</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={12}>
            <Card title="Department Progress" className="h-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis
                    label={{
                      value: "Avg. Completion %",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <RechartsTooltip />
                  <Bar
                    dataKey="avgCompletion"
                    fill="#8884d8"
                    name="Avg. Completion %"
                  />
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
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {phaseDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Needs Attention Section */}
        {alertUsers.length > 0 && (
          <Card
            title={
              <>
                <WarningOutlined className="text-red-500 mr-2" />
                {selectedRole === 'employee' ? 'Employees' : 'Supervisors'} Needing Attention
              </>
            }
            className="mb-6"
            bordered={false}
            style={{ backgroundColor: "#fff2f0" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alertUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-3 bg-white rounded p-3 shadow">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    user.role === 'employee' ? 'bg-red-200 text-red-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500">
                      {user.department} • {(user.completionPercentage || 0)}% complete
                    </div>
                    <div className="text-xs text-red-600">
                      {user.status === "delayed" ? "Overdue tasks" : 
                       (user.daysSinceLastActivity || 0) > 14 ? `No activity for ${user.daysSinceLastActivity} days` :
                       "Low progress"}
                    </div>
                  </div>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleViewUser(user.id)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="w-full md:w-64">
              <Input
                placeholder="Search by name or department"
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>

            <div className="w-full md:w-48">
              <Select
                placeholder="Filter by department"
                style={{ width: "100%" }}
                value={filters.department || undefined}
                onChange={(value) =>
                  setFilters({ ...filters, department: value })
                }
                allowClear
              >
                {[...new Set(users.map((u) => u.department))]
                  .filter((dept) => dept != null)
                  .map((dept) => (
                    <Option key={dept} value={dept}>
                      {dept}
                    </Option>
                  ))}
              </Select>
            </div>

            <div className="w-full md:w-48">
              <Select
                placeholder="Filter by phase"
                style={{ width: "100%" }}
                value={filters.phase || undefined}
                onChange={(value) => setFilters({ ...filters, phase: value })}
                allowClear
              >
                {["pre_onboarding", "phase_1", "phase_2"].map(
                  (phase) => (
                    <Option key={phase} value={phase}>
                      {phase === "pre_onboarding" ? "Pre-Onboarding" : 
                       phase === "phase_1" ? "Phase 1" : 
                       phase === "phase_2" ? "Phase 2" : 
                       phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </Option>
                  )
                )}
              </Select>
            </div>

            <div className="w-full md:w-64">
              <span className="block mb-1">Completion Range</span>
              <Slider
                range
                value={filters.completionRange}
                onChange={(value) =>
                  setFilters({
                    ...filters,
                    completionRange: value as [number, number],
                  })
                }
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="mb-6 flex gap-4">
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            onClick={() => {
              fetchAllUsers();
              setCreateModalVisible(true);
            }}
          >
            <span className="font-semibold">Create New Journey</span>
          </Button>
          <Button
            size="large"
            icon={<DownloadOutlined />}
            loading={csvLoading}
            className="border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all duration-200"
            onClick={handleExportCSV}
          >
            <span className="font-medium">Export CSV</span>
          </Button>
          <Button 
            size="large"
            icon={<ReloadOutlined />}
            className="border-gray-300 hover:border-green-400 hover:text-green-600 transition-all duration-200"
            onClick={fetchUsers}
          >
            <span className="font-medium">Refresh Data</span>
          </Button>
        </div>

        {/* Users Table */}
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          className="bg-white"
        />

        {/* Create Journey Modal */}
        <Modal
          title="Create New Onboarding Journey"
          open={createModalVisible}
          onCancel={() => {
            setCreateModalVisible(false);
            setSelectedUser(null);
            setSelectedJourneyType(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical">
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Select {selectedRole === 'employee' ? 'Employee' : 'Supervisor'}:</label>
                <Select
                  style={{ width: "100%" }}
                  placeholder={`Choose an ${selectedRole}`}
                  value={selectedUser?.id}
                  onChange={(userId) => {
                    const user = allUsers.length > 0 
                      ? allUsers.find((u) => u.id === userId)
                      : users.find((u) => u.id === userId);
                    if (user) {
                      setSelectedUser({
                        id: user.id,
                        name: user.name || 'Unknown',
                        department: user.department || 'Unknown',
                        email: user.email,
                        role: selectedRole,
                        programType: user.programType || 'inkompass',
                        startDate: user.startDate,
                        currentPhase: 'pre_onboarding',
                        completionPercentage: 0,
                        status: 'not_started',
                        daysSinceStart: 0,
                        daysSinceLastActivity: 0,
                      });
                    } else {
                      setSelectedUser(null);
                    }
                  }}
                  notFoundContent={
                    users.length === 0 ? `No ${selectedRole}s available` : `Loading ${selectedRole}s...`
                  }
                >
                  {allUsers.length > 0 ? allUsers
                    .filter(user => user.role === selectedRole)
                    .map((user) => (
                      <Option key={user.id} value={user.id}>
                        {user.name} - {user.department}
                      </Option>
                    )) : users
                    .filter(user => user.role === selectedRole)
                    .map((user) => (
                      <Option key={user.id} value={user.id}>
                        {user.name} - {user.department}
                      </Option>
                    ))}
                </Select>
              </div>

              <div>
                <label className="block mb-2">Journey Type:</label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select journey type"
                  value={selectedJourneyType}
                  onChange={(value) => setSelectedJourneyType(value)}
                >
                  {journeyTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => {
                    setCreateModalVisible(false);
                    setSelectedUser(null);
                    setSelectedJourneyType(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={loading}
                  disabled={!selectedUser || !selectedJourneyType}
                  onClick={() =>
                    handleCreateJourney({ 
                      userId: selectedUser!.id, 
                      journeyType: selectedJourneyType! 
                    })
                  }
                >
                  Create Journey
                </Button>
              </div>
            </div>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default ManagerOnboardingManagement;
