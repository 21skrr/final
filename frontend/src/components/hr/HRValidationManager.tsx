// components/hr/HRValidationManager.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Input,
  Modal,
  message,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Table,
  Alert,
  Badge,
  Select,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  UserOutlined,
  TrophyOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import supervisorAssessmentService from "../../services/supervisorAssessmentService";
import { SupervisorAssessment, HRApprovalFormData } from "../../types/supervisorAssessment";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface HRValidationManagerProps {
  assessment: SupervisorAssessment;
  onUpdate: () => void;
}

const HRValidationManager: React.FC<HRValidationManagerProps> = ({
  assessment,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalForm] = Form.useForm();

  const handleHRApproval = async (values: HRApprovalFormData) => {
    try {
      setLoading(true);
      await supervisorAssessmentService.hrApprove(assessment.id, values);
      message.success("HR approval completed successfully");
      setApprovalModalVisible(false);
      approvalForm.resetFields();
      onUpdate();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to complete HR approval");
    } finally {
      setLoading(false);
    }
  };

  const canApprove = supervisorAssessmentService.canApprove(
    assessment.status,
    user?.role || ""
  );

  const getApprovalStatus = () => {
    if (assessment.status === "hr_approved") {
      return { status: "success", text: "Approved", icon: <CheckCircleOutlined /> };
    } else if (assessment.status === "hr_rejected") {
      return { status: "error", text: "Rejected", icon: <CloseCircleOutlined /> };
    } else if (assessment.status === "hr_approval_pending") {
      return { status: "processing", text: "Pending HR Approval", icon: <ExclamationCircleOutlined /> };
    } else {
      return { status: "default", text: "Not Ready", icon: <EyeOutlined /> };
    }
  };

  const approvalStatus = getApprovalStatus();

  return (
    <div>
      <Card title="HR Approval" className="mb-4">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div className="mb-4">
              <Title level={4}>Employee: {assessment.employee?.name}</Title>
              <Text type="secondary">Department: {assessment.employee?.department}</Text>
            </div>

            {/* Status Display */}
            <div className="mb-4">
              <Badge
                status={approvalStatus.status as any}
                text={approvalStatus.text}
                icon={approvalStatus.icon}
              />
              <Tag color={supervisorAssessmentService.getStatusColor(assessment.status)}>
                {supervisorAssessmentService.getStatusDisplayText(assessment.status)}
              </Tag>
              {assessment.supervisorDecision && (
                <Tag color={supervisorAssessmentService.getDecisionColor(assessment.supervisorDecision)}>
                  {supervisorAssessmentService.getDecisionDisplayText(assessment.supervisorDecision)}
                </Tag>
              )}
            </div>

            {/* Action Button */}
            {canApprove && (
              <div className="mb-4">
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setApprovalModalVisible(true)}
                >
                  Review & Approve
                </Button>
              </div>
            )}

            {/* Assessment Details */}
            {assessment.certificateFile && (
              <Alert
                message="Certificate Uploaded"
                description={`File: ${assessment.certificateFile}`}
                type="success"
                showIcon
                className="mb-4"
              />
            )}

            {assessment.assessmentNotes && (
              <Card size="small" title="Assessment Notes" className="mb-4">
                <Text>{assessment.assessmentNotes}</Text>
                {assessment.assessmentScore && (
                  <div className="mt-2">
                    <Text strong>Score: {assessment.assessmentScore}%</Text>
                  </div>
                )}
              </Card>
            )}

            {assessment.supervisorComments && (
              <Card size="small" title="Supervisor Decision" className="mb-4">
                <div className="mb-2">
                  <Tag color={supervisorAssessmentService.getDecisionColor(assessment.supervisorDecision)}>
                    {supervisorAssessmentService.getDecisionDisplayText(assessment.supervisorDecision)}
                  </Tag>
                </div>
                <Text>{assessment.supervisorComments}</Text>
                {assessment.decisionDate && (
                  <div className="mt-2">
                    <Text type="secondary">Decision Date: {new Date(assessment.decisionDate).toLocaleDateString()}</Text>
                  </div>
                )}
              </Card>
            )}

            {assessment.hrDecision && (
              <Card size="small" title="HR Decision" className="mb-4">
                <div className="mb-2">
                  <Tag color={assessment.hrDecision === "approve" ? "success" : assessment.hrDecision === "reject" ? "error" : "warning"}>
                    {assessment.hrDecision === "approve" ? "Approved" : assessment.hrDecision === "reject" ? "Rejected" : "Request Changes"}
                  </Tag>
                </div>
                <Text>{assessment.hrDecisionComments}</Text>
                {assessment.hrDecisionDate && (
                  <div className="mt-2">
                    <Text type="secondary">Decision Date: {new Date(assessment.hrDecisionDate).toLocaleDateString()}</Text>
                  </div>
                )}
              </Card>
            )}

            {/* Workflow Summary */}
            <Card size="small" title="Workflow Summary" className="mb-4">
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text strong>Supervisor:</Text>
                  <br />
                  <Text>{assessment.supervisor?.name}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Phase 1 Completed:</Text>
                  <br />
                  <Text>{assessment.phase1CompletedDate ? new Date(assessment.phase1CompletedDate).toLocaleDateString() : "N/A"}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Assessment Date:</Text>
                  <br />
                  <Text>{assessment.assessmentDate ? new Date(assessment.assessmentDate).toLocaleDateString() : "N/A"}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Decision Date:</Text>
                  <br />
                  <Text>{assessment.decisionDate ? new Date(assessment.decisionDate).toLocaleDateString() : "N/A"}</Text>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* HR Approval Modal */}
      <Modal
        title="HR Approval Decision"
        open={approvalModalVisible}
        onCancel={() => setApprovalModalVisible(false)}
        footer={null}
      >
        <Form form={approvalForm} onFinish={handleHRApproval} layout="vertical">
          <Form.Item
            name="decision"
            label="HR Decision"
            rules={[{ required: true, message: "HR decision is required" }]}
          >
            <Select placeholder="Select your decision">
              <Option value="approve">Approve - Allow to proceed to Phase 2</Option>
              <Option value="reject">Reject - Terminate onboarding</Option>
              <Option value="request_changes">Request Changes - Send back to supervisor</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comments"
            label="Decision Comments"
            rules={[{ required: true, message: "Decision comments are required" }]}
          >
            <TextArea rows={4} placeholder="Provide detailed comments for your decision..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Submit Decision
              </Button>
              <Button onClick={() => setApprovalModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HRValidationManager; 