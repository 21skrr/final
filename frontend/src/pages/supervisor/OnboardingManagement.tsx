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
  Progress,
  Badge,
  Form,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
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
import teamService from "../../services/teamService";
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

type TeamMember = {
  id: string;
  name: string;
  department: string;
  email?: string;
  role?: string;
  programType?: string;
  startDate?: string;
  currentPhase?: OnboardingStage;
  completionPercentage?: number;
  status?: TaskStatus;
  daysSinceStart?: number;
  daysSinceLastActivity?: number;
};

const SupervisorOnboardingManagement: React.FC = () => {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [journeyTypes, setJourneyTypes] = useState<JourneyTypeOption[]>([]);
  const [selectedJourneyType, setSelectedJourneyType] = useState<JourneyType | null>(null);
  const [filters, setFilters] = useState({
    department: "",
    phase: "",
    completionRange: [0, 100],
    search: "",
  });
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
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
    fetchTeamMembers();
    fetchJourneyTypes();
    fetchAllUsers();
  }, []);

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
      console.log("Fetching all employees for create journey modal...");
      console.log("Current token:", localStorage.getItem('token'));
      const response = await api.get("/users?role=employee");
      const users = response.data || response;
      console.log("All employees received:", users);
      console.log("Number of employees:", users.length);
      console.log("Employee names:", users.map(u => u.name));
      console.log("Employee departments:", users.map(u => u.department));
      console.log("Employee IDs:", users.map(u => u.id));
      console.log("Full employee data:", users);
      setAllUsers(users);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.log("Falling back to team members data for create journey modal");
      // Don't show error message, just use team members as fallback
      setAllUsers([]);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      
      // First, get team members
      console.log("Fetching team members...");
      const teamData = await teamService.getMyTeam();
      console.log("Team data received:", teamData);
      
      // Check if teamData is valid
      if (!teamData || !Array.isArray(teamData)) {
        console.warn("No team data received or invalid format:", teamData);
        setTeamMembers([]);
        return;
      }
      
      // Get team member IDs
      const teamMemberIds = teamData.map(member => member.id);
      console.log("Team member IDs:", teamMemberIds);
      
      // Get all onboarding progress data (same as admin)
      console.log("Fetching all onboarding progress...");
      const allProgressData = await onboardingService.getAllProgresses();
      console.log("All progress data received:", allProgressData);
      console.log("All progress data length:", allProgressData.length);
      
      // Debug: Check what user IDs are in the progress data
      const progressUserIds = allProgressData.map(progress => progress.User?.id).filter(Boolean);
      console.log("Progress data user IDs:", progressUserIds);
      console.log("Team member IDs:", teamMemberIds);
      console.log("Matching IDs:", teamMemberIds.filter(id => progressUserIds.includes(id)));
      
      // Filter to only include team members
      const teamProgressData = allProgressData.filter(progress => 
        teamMemberIds.includes(progress.User?.id)
      );
      console.log("Filtered team progress data:", teamProgressData);
      console.log("Filtered team progress data length:", teamProgressData.length);
      
      // If no team progress data found, fallback to individual progress fetching
      if (teamProgressData.length === 0) {
        console.log("No team progress data found in getAllProgresses, falling back to individual fetching...");
        const membersWithProgress: TeamMember[] = [];
        
        for (const member of teamData) {
          try {
            const progressData = await onboardingService.getUserProgress(member.id);
            const progress = progressData.data || progressData;
            
            membersWithProgress.push({
              id: member.id,
              name: member.name || 'Unknown',
              department: member.department || 'Unknown',
              email: member.email,
              role: member.role || 'employee',
              programType: member.programType || 'inkompass',
              startDate: member.startDate,
              currentPhase: progress.stage || 'pre_onboarding',
              completionPercentage: typeof progress.progress === 'number' ? progress.progress : 0,
              status: progress.stage === 'completed' ? 'completed' : 'in_progress',
              daysSinceStart: member.startDate ? 
                Math.floor((new Date().getTime() - new Date(member.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
              daysSinceLastActivity: 0,
            });
          } catch (error) {
            console.log(`No progress data for member ${member.id} (${member.name}):`, error);
            // If no onboarding progress exists, still include the member
            membersWithProgress.push({
              id: member.id,
              name: member.name || 'Unknown',
              department: member.department || 'Unknown',
              email: member.email,
              role: member.role || 'employee',
              programType: member.programType || 'inkompass',
              startDate: member.startDate,
              currentPhase: 'pre_onboarding',
              completionPercentage: 0,
              status: 'not_started',
              daysSinceStart: member.startDate ? 
                Math.floor((new Date().getTime() - new Date(member.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
              daysSinceLastActivity: 0,
            });
          }
        }
        
        console.log("Fallback mapped team members with progress:", membersWithProgress);
        console.log("Setting team members state with:", membersWithProgress.length, "members");
        setTeamMembers(membersWithProgress);
        fetchCurrentPhases(membersWithProgress);
        return;
      }
      
      // Map the progress data to TeamMember format
      const membersWithProgress: TeamMember[] = teamProgressData.map((item: any) => ({
        id: item.User?.id || "",
        name: item.User?.name || 'Unknown',
        department: item.User?.department || 'Unknown',
        email: item.User?.email || '',
        role: item.User?.role || 'employee',
        programType: item.User?.programType || 'inkompass',
        startDate: item.User?.startDate,
        currentPhase: item.stage || 'pre_onboarding',
        completionPercentage: typeof item.progress === 'number' ? item.progress : 0,
        status: item.stage === 'completed' ? 'completed' : 'in_progress',
        daysSinceStart: item.User?.startDate ? 
          Math.floor((new Date().getTime() - new Date(item.User.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        daysSinceLastActivity: 0,
      }));
      
      console.log("Mapped team members with progress:", membersWithProgress);
      console.log("Setting team members state with:", membersWithProgress.length, "members");
      
      setTeamMembers(membersWithProgress);
      fetchCurrentPhases(membersWithProgress);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
      message.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handleViewMember = (memberId: string) => {
    navigate(`/supervisor/onboarding/${memberId}`);
  };

  const handleCreateJourney = async (values: { memberId: string; journeyType: JourneyType }) => {
    try {
      setLoading(true);
      console.log("Creating journey for user:", values.memberId, "with type:", values.journeyType);
      const result = await onboardingService.createJourney(values.memberId, values.journeyType);
      console.log("Journey creation result:", result);
      message.success("Onboarding journey created successfully");
      setCreateModalVisible(false);
      setSelectedMember(null);
      setSelectedJourneyType(null);
      form.resetFields();
      console.log("Refreshing team members data...");
      await fetchTeamMembers();
      console.log("Team members data refreshed");
    } catch (error: any) {
      console.error("Failed to create journey:", error);
      message.error(error?.response?.data?.message || "Failed to create onboarding journey");
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteJourney = (memberId: string, name: string) => {
    confirm({
      title: "Are you sure you want to delete this onboarding journey?",
      icon: <ExclamationCircleOutlined />,
      content: `This will permanently delete ${name}'s onboarding journey and cannot be undone.`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      async onOk() {
        try {
          await onboardingService.deleteUserProgress(memberId);
          message.success("Onboarding journey deleted successfully");
          fetchTeamMembers();
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

  const filteredMembers = teamMembers.filter((member) => {
    const matchesDepartment =
      !filters.department || member.department === filters.department;
    const matchesPhase = !filters.phase || member.currentPhase === filters.phase;
    const matchesCompletion =
      (member.completionPercentage || 0) >= filters.completionRange[0] &&
      (member.completionPercentage || 0) <= filters.completionRange[1];
    const matchesSearch =
      !filters.search ||
      member.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      member.department.toLowerCase().includes(filters.search.toLowerCase());

    return (
      matchesDepartment && matchesPhase && matchesCompletion && matchesSearch
    );
  });

  // Analytics data preparation
  const departmentData = React.useMemo(() => {
    const deptMap = new Map();
    teamMembers.forEach((member) => {
      if (!deptMap.has(member.department)) {
        deptMap.set(member.department, {
          department: member.department,
          avgCompletion: 0,
          count: 0,
          totalCompletion: 0,
        });
      }
      const dept = deptMap.get(member.department);
      dept.count++;
      dept.totalCompletion += member.completionPercentage || 0;
    });

    return Array.from(deptMap.values()).map((dept) => ({
      ...dept,
      avgCompletion: Math.round(dept.totalCompletion / dept.count),
    }));
  }, [teamMembers]);

  const phaseDistribution = React.useMemo(() => {
    const phaseCounts = {
      "Pre-Onboarding": 0,
      "Phase 1": 0,
      "Phase 2": 0,
      Completed: 0,
    };

    teamMembers.forEach((member) => {
      if ((member.completionPercentage || 0) === 100) {
        phaseCounts["Completed"]++;
      } else {
        const phaseKey = member.currentPhase === "pre_onboarding" ? "Pre-Onboarding" :
                        member.currentPhase === "phase_1" ? "Phase 1" :
                        member.currentPhase === "phase_2" ? "Phase 2" :
                        member.currentPhase;
        if (phaseKey in phaseCounts) {
          phaseCounts[phaseKey as keyof typeof phaseCounts]++;
        }
      }
    });

    return Object.entries(phaseCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [teamMembers]);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#52c41a",
  ];

  // Alert list - members with overdue or stalled onboarding
  const alertMembers = teamMembers.filter(
    (member) =>
      (member.status && member.status.toLowerCase() === "delayed") ||
      (member.daysSinceLastActivity && member.daysSinceLastActivity > 14) ||
      (member.completionPercentage || 0) < 20 && (member.daysSinceStart || 0) > 30
  );

  const fetchCurrentPhases = async (members: TeamMember[]) => {
    const phases: { [userId: string]: string } = {};
    const statuses: { [userId: string]: string } = {};
    
    await Promise.all(
      members.map(async (member) => {
        try {
          const journey: OnboardingJourney = await onboardingService.getJourney(member.id);
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
            phaseTitle = member.currentPhase || "Pre-Onboarding";
          }
          
          if (phaseTitle) {
            phaseTitle = phaseTitle.charAt(0).toUpperCase() + phaseTitle.slice(1);
          }
          
          phases[member.id] = phaseTitle;
          
          // Status logic
          const allTasks = phasesArr.flatMap((phase) => phase.tasks);
          const allCompleted = allTasks.length > 0 && allTasks.every((task) => task.completed);
          statuses[member.id] = allCompleted ? "Completed" : "In Progress";
        } catch {
          let phaseTitle = member.currentPhase || "Pre-Onboarding";
          if (phaseTitle) {
            phaseTitle = phaseTitle.charAt(0).toUpperCase() + phaseTitle.slice(1);
          }
          phases[member.id] = phaseTitle;
          statuses[member.id] = member.status || "Not Started";
        }
      })
    );
    
    setCurrentPhases(phases);
    setCurrentStatuses(statuses);
  };

  // Define columns with proper TypeScript typing
  const columns: ColumnsType<TeamMember> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: TeamMember, b: TeamMember) => a.name.localeCompare(b.name),
      render: (name: string, record: TeamMember) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-blue-200 text-blue-800">
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
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Current Phase",
      dataIndex: "currentPhase",
      key: "currentPhase",
      render: (_: unknown, record: TeamMember) => {
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
          <Progress 
            percent={completion || 0} 
            size="small" 
            style={{ width: 80 }}
            strokeColor={completion === 100 ? '#52c41a' : '#1890ff'}
          />
          <span className="text-sm font-medium">{completion || 0}%</span>
        </div>
      ),
      sorter: (a: TeamMember, b: TeamMember) => 
        (a.completionPercentage || 0) - (b.completionPercentage || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_: unknown, record: TeamMember) => {
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
      sorter: (a: TeamMember, b: TeamMember) => 
        (a.daysSinceStart || 0) - (b.daysSinceStart || 0),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: TeamMember) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewMember(record.id)}
              type="primary"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete Journey">
            <Button
              icon={<ExclamationCircleOutlined />}
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

      let filename = "team_onboarding_report.csv";
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

  const avgProgress = teamMembers.length > 0 
    ? Math.round(teamMembers.reduce((sum, member) => sum + (member.completionPercentage || 0), 0) / teamMembers.length)
    : 0;

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Team Onboarding Management</h1>
          <div className="flex items-center space-x-4">
            <Badge count={alertMembers.length} size="small">
              <Button
                icon={<AlertTriangle />}
                type={alertMembers.length > 0 ? "primary" : "default"}
                danger={alertMembers.length > 0}
              >
                Needs Attention ({alertMembers.length})
              </Button>
            </Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <div className="text-sm text-gray-500">Team Members</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{avgProgress}%</div>
              <div className="text-sm text-gray-500">Avg. Progress</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center">
              <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {teamMembers.filter(m => (m.completionPercentage || 0) < 100).length}
              </div>
              <div className="text-sm text-gray-500">In Progress</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{alertMembers.length}</div>
              <div className="text-sm text-gray-500">Need Attention</div>
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
        {alertMembers.length > 0 && (
          <Card
            title={
              <>
                <WarningOutlined className="text-red-500 mr-2" />
                Team Members Needing Attention
              </>
            }
            className="mb-6"
            variant="outlined"
            style={{ backgroundColor: "#fff2f0" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alertMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 bg-white rounded p-3 shadow">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-red-200 text-red-800">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-gray-500">
                      {member.department} • {(member.completionPercentage || 0)}% complete
                    </div>
                    <div className="text-xs text-red-600">
                      {member.status === "delayed" ? "Overdue tasks" : 
                       (member.daysSinceLastActivity || 0) > 14 ? `No activity for ${member.daysSinceLastActivity} days` :
                       "Low progress"}
                    </div>
                  </div>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleViewMember(member.id)}
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
                {[...new Set(teamMembers.map((m) => m.department))]
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
        <div className="mb-4 flex gap-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              console.log("Create journey button clicked");
              console.log("Current team members:", teamMembers);
              console.log("Current allUsers:", allUsers);
              fetchAllUsers();
              setSelectedMember(null);
              setSelectedJourneyType(null);
              setCreateModalVisible(true);
            }}
          >
            Create New Journey
          </Button>
          <Button
            icon={<DownloadOutlined />}
            loading={csvLoading}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button onClick={fetchTeamMembers} icon={<ReloadOutlined />}>
            Refresh Data
          </Button>
        </div>

        {/* Team Members Table */}
        <Table
          columns={columns}
          dataSource={filteredMembers}
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
            setSelectedMember(null);
            setSelectedJourneyType(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical">
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Select Employee:</label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Choose an employee"
                  value={selectedMember?.id}
                  onChange={(memberId) => {
                    const member = allUsers.length > 0 
                      ? allUsers.find((u) => u.id === memberId)
                      : teamMembers.find((m) => m.id === memberId);
                    if (member) {
                      setSelectedMember({
                        id: member.id,
                        name: member.name || 'Unknown',
                        department: member.department || 'Unknown',
                        email: member.email,
                        role: 'employee', // Always employee for journey creation
                        programType: member.programType || 'inkompass',
                        startDate: member.startDate,
                        currentPhase: 'pre_onboarding',
                        completionPercentage: 0,
                        status: 'not_started',
                        daysSinceStart: 0,
                        daysSinceLastActivity: 0,
                      });
                    } else {
                      setSelectedMember(null);
                    }
                  }}
                  notFoundContent={
                    allUsers.length === 0 && teamMembers.length === 0 ? "No employees available" : "Loading employees..."
                  }
                >
                  {allUsers.length > 0 ? allUsers.map((user) => (
                    <Option key={user.id} value={user.id}>
                      {user.name} - {user.department}
                    </Option>
                  )) : teamMembers.map((member) => (
                    <Option key={member.id} value={member.id}>
                      {member.name} - {member.department}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block mb-2">Journey Type:</label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select journey type"
                  value={selectedJourneyType && journeyTypes.some(type => type.value === selectedJourneyType) ? selectedJourneyType : undefined}
                  onChange={(value) => setSelectedJourneyType(value)}
                  allowClear
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
                    setSelectedMember(null);
                    setSelectedJourneyType(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={loading}
                  disabled={!selectedMember || !selectedJourneyType}
                  onClick={() =>
                    handleCreateJourney({ 
                      memberId: selectedMember!.id, 
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

export default SupervisorOnboardingManagement; 