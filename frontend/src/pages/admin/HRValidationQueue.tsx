// pages/admin/HRValidationQueue.tsx
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
  Alert,
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import supervisorAssessmentService from "../../services/supervisorAssessmentService";
import { SupervisorAssessment } from "../../types/supervisorAssessment";
import HRValidationManager from "../../components/hr/HRValidationManager";
import Layout from "../../components/layout/Layout";

const { Title, Text } = Typography;

const HRValidationQueue: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<SupervisorAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<SupervisorAssessment | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await supervisorAssessmentService.getPendingHRApproval();
      setAssessments(response.assessments);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to fetch pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAssessment = (assessment: SupervisorAssessment) => {
    setSelectedAssessment(assessment);
    setDetailModalVisible(true);
  };

  const handleAssessmentUpdate = () => {
    fetchPendingApprovals();
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
    const pending = assessments.filter(a => a.status === "hr_approval_pending").length;
    const approved = assessments.filter(a => a.status === "hr_approved").length;
    const rejected = assessments.filter(a => a.status === "hr_rejected").length;

    return { total, pending, approved, rejected };
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
      title: "Supervisor",
      dataIndex: "supervisor",
      key: "supervisor",
      render: (supervisor: any) => (
        <div>
          <Text strong>{supervisor?.name}</Text>
          <br />
          <Text type="secondary">{supervisor?.email}</Text>
        </div>
      ),
    },
    {
      title: "Decision",
      dataIndex: "supervisorDecision",
      key: "supervisorDecision",
      render: (decision: string) => (
        <Tag color={supervisorAssessmentService.getDecisionColor(decision)}>
          {supervisorAssessmentService.getDecisionDisplayText(decision)}
        </Tag>
      ),
    },
    {
      title: "Decision Date",
      dataIndex: "decisionDate",
      key: "decisionDate",
      render: (date: string) => (
        date ? new Date(date).toLocaleDateString() : "N/A"
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
            {supervisorAssessmentService.canApprove(record.status, user?.role || "") 
              ? "Review & Approve" 
              : "View Details"
            }
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <div className="p-6">
        <Title level={2}>HR Approval Queue</Title>
        <Text type="secondary">Review and approve supervisor assessments</Text>

        {/* Statistics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Assessments"
                value={statistics.total}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Awaiting Approval"
                value={statistics.pending}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Approved"
                value={statistics.approved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Rejected"
                value={statistics.rejected}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Info Alert */}
        {statistics.pending > 0 && (
          <Alert
            message="Pending Approvals"
            description={`You have ${statistics.pending} assessment(s) waiting for HR approval. Please review them promptly.`}
            type="info"
            showIcon
            className="mb-4"
          />
        )}

        {/* Assessments Table */}
        <Card title="Approval Queue">
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
          title="Assessment Approval"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={800}
          footer={null}
        >
          {selectedAssessment && (
            <HRValidationManager
              assessment={selectedAssessment}
              onUpdate={handleAssessmentUpdate}
            />
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default HRValidationQueue; 