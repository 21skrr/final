// pages/supervisor/SupervisorAssessments.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  message,
  Modal,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  EyeOutlined,
  UserOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import supervisorAssessmentService from "../../services/supervisorAssessmentService";
import { SupervisorAssessment } from "../../types/supervisorAssessment";
import { SupervisorAssessmentManager } from "../../components/supervisor/SupervisorAssessmentManager";
import Layout from "../../components/layout/Layout";

const { Title, Text } = Typography;

const SupervisorAssessments: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<SupervisorAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<SupervisorAssessment | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAssessments();
    }
  }, [user?.id]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await supervisorAssessmentService.getSupervisorAssessments(user!.id);
      setAssessments(response.assessments);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to fetch assessments");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAssessment = (assessment: SupervisorAssessment) => {
    setSelectedAssessment(assessment);
    setDetailModalVisible(true);
  };

  const handleAssessmentUpdate = () => {
    fetchAssessments();
    if (selectedAssessment) {
      // Refresh the selected assessment
      const updatedAssessment = assessments.find(a => a.id === selectedAssessment.id);
      if (updatedAssessment) {
        setSelectedAssessment(updatedAssessment);
      }
    }
  };

  const getStatistics = () => {
    const total = assessments.length;
    
    // Pending: Just started, waiting for certificate upload
    const pending = assessments.filter(a => a.status === "pending_certificate").length;
    
    // In Progress: Certificate uploaded but not yet decided by HR
    const inProgress = assessments.filter(a => 
      [
        "certificate_uploaded", 
        "assessment_pending", 
        "assessment_completed", 
        "decision_pending",
        "decision_made",
        "hr_approval_pending"
      ].includes(a.status)
    ).length;
    
    // Completed: HR has made final decision (approved or rejected)
    const completed = assessments.filter(a => 
      ["hr_approved", "hr_rejected", "completed"].includes(a.status)
    ).length;

    return { total, pending, inProgress, completed };
  };

  const statistics = getStatistics();

  const columns = [
    {
      title: "Employee",
      dataIndex: "employee",
      key: "employee",
      render: (employee: any) => (
        <div>
          <Text strong>{employee?.name}</Text>
          <br />
          <Text type="secondary">{employee?.department}</Text>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={supervisorAssessmentService.getStatusColor(status)}>
          {supervisorAssessmentService.getStatusDisplayText(status)}
        </Tag>
      ),
    },
    {
      title: "Decision",
      dataIndex: "supervisorDecision",
      key: "supervisorDecision",
      render: (decision: string) => (
        decision ? (
          <Tag color={supervisorAssessmentService.getDecisionColor(decision)}>
            {supervisorAssessmentService.getDecisionDisplayText(decision)}
          </Tag>
        ) : (
          <Text type="secondary">Not decided</Text>
        )
      ),
    },
    {
      title: "Phase 1 Completed",
      dataIndex: "phase1CompletedDate",
      key: "phase1CompletedDate",
      render: (date: string) => (
        date ? new Date(date).toLocaleDateString() : "N/A"
      ),
    },
    {
      title: "Assessment Date",
      dataIndex: "assessmentDate",
      key: "assessmentDate",
      render: (date: string) => (
        date ? new Date(date).toLocaleDateString() : "N/A"
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: SupervisorAssessment) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewAssessment(record)}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <div className="p-6">
        <Title level={2}>Supervisor Assessments</Title>
        <Text type="secondary">Manage employee assessments after Phase 1 completion</Text>

        {/* Statistics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Assessments"
                value={statistics.total}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pending"
                value={statistics.pending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={statistics.inProgress}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed"
                value={statistics.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Assessments Table */}
        <Card title="Assessment List">
          <Table
            columns={columns}
            dataSource={assessments}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} assessments`,
            }}
          />
        </Card>

        {/* Assessment Detail Modal */}
        <Modal
          title="Assessment Details"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={800}
          footer={null}
        >
          {selectedAssessment && (
            <SupervisorAssessmentManager
              assessment={selectedAssessment}
              onUpdate={handleAssessmentUpdate}
            />
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default SupervisorAssessments; 