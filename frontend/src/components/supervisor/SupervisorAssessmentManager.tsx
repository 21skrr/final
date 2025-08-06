// components/supervisor/SupervisorAssessmentManager.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Upload,
  Form,
  Input,
  Select,
  Modal,
  message,
  Tag,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Progress,
  Alert,
} from "antd";
import {
  UploadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import supervisorAssessmentService from "../../services/supervisorAssessmentService";
import { SupervisorAssessment, AssessmentFormData, DecisionFormData } from "../../types/supervisorAssessment";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface SupervisorAssessmentManagerProps {
  assessment: SupervisorAssessment;
  onUpdate: () => void;
}

const SupervisorAssessmentManager: React.FC<SupervisorAssessmentManagerProps> = ({
  assessment,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [assessmentModalVisible, setAssessmentModalVisible] = useState(false);
  const [decisionModalVisible, setDecisionModalVisible] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [assessmentForm] = Form.useForm();
  const [decisionForm] = Form.useForm();

  const handleCertificateUpload = async () => {
    if (!certificateFile) {
      message.error("Please select a certificate file");
      return;
    }

    try {
      setLoading(true);
      await supervisorAssessmentService.uploadCertificate(assessment.id, certificateFile);
      message.success("Certificate uploaded successfully");
      setCertificateModalVisible(false);
      setCertificateFile(null);
      onUpdate(); // This will refresh the assessment data
      
      // After a short delay, automatically open the assessment modal
      setTimeout(() => {
        setAssessmentModalVisible(true);
      }, 1000);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to upload certificate");
    } finally {
      setLoading(false);
    }
  };

  const handleConductAssessment = async (values: AssessmentFormData) => {
    try {
      setLoading(true);
      await supervisorAssessmentService.conductAssessment(assessment.id, values);
      message.success("Assessment completed successfully");
      setAssessmentModalVisible(false);
      assessmentForm.resetFields();
      onUpdate(); // This will refresh the assessment data
      
      // After a short delay, automatically open the decision modal
      setTimeout(() => {
        setDecisionModalVisible(true);
      }, 1000);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to complete assessment");
    } finally {
      setLoading(false);
    }
  };

  const handleMakeDecision = async (values: DecisionFormData) => {
    try {
      setLoading(true);
      await supervisorAssessmentService.makeDecision(assessment.id, values);
      message.success("Decision made successfully");
      setDecisionModalVisible(false);
      decisionForm.resetFields();
      onUpdate();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to make decision");
    } finally {
      setLoading(false);
    }
  };

  const canUploadCertificate = supervisorAssessmentService.canUploadCertificate(
    assessment.status,
    user?.role || ""
  );

  const canConductAssessment = supervisorAssessmentService.canConductAssessment(
    assessment.status,
    user?.role || ""
  );

  const canMakeDecision = supervisorAssessmentService.canMakeDecision(
    assessment.status,
    user?.role || ""
  );

  const getWorkflowStep = () => {
    switch (assessment.status) {
      case "pending_certificate":
        return { step: 1, title: "Upload Certificate", description: "Upload the employee's certificate" };
      case "certificate_uploaded":
        return { step: 2, title: "Conduct Assessment", description: "Conduct the employee assessment" };
      case "assessment_completed":
        return { step: 3, title: "Make Decision", description: "Make your decision about the employee" };
      case "decision_made":
        return { step: 4, title: "HR Validation", description: "Waiting for HR validation" };
      case "hr_validated":
        return { step: 5, title: "Completed", description: "Assessment workflow completed" };
      default:
        return { step: 0, title: "Unknown", description: "Unknown status" };
    }
  };

  const workflowStep = getWorkflowStep();

  return (
    <div>
      <Card title="Supervisor Assessment Workflow" className="mb-4">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div className="mb-4">
              <Title level={4}>Employee: {assessment.employee?.name}</Title>
              <Text type="secondary">Department: {assessment.employee?.department}</Text>
            </div>

            {/* Workflow Progress */}
            <div className="mb-6">
              <Progress
                percent={(workflowStep.step / 5) * 100}
                status={assessment.status === "hr_validated" ? "success" : "active"}
                format={() => `Step ${workflowStep.step} of 5`}
              />
              <div className="mt-2">
                <Text strong>{workflowStep.title}</Text>
                <br />
                <Text type="secondary">{workflowStep.description}</Text>
              </div>
            </div>

            {/* Status Display */}
            <div className="mb-4">
              <Tag color={supervisorAssessmentService.getStatusColor(assessment.status)}>
                {supervisorAssessmentService.getStatusDisplayText(assessment.status)}
              </Tag>
              {assessment.supervisorDecision && (
                <Tag color={supervisorAssessmentService.getDecisionColor(assessment.supervisorDecision)}>
                  {supervisorAssessmentService.getDecisionDisplayText(assessment.supervisorDecision)}
                </Tag>
              )}
            </div>

            {/* Action Buttons */}
            <Space className="mb-4">
              {canUploadCertificate && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => setCertificateModalVisible(true)}
                >
                  Upload Certificate
                </Button>
              )}

              {canConductAssessment && (
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => setAssessmentModalVisible(true)}
                >
                  Conduct Assessment
                </Button>
              )}

              {canMakeDecision && (
                <Button
                  type="primary"
                  icon={<TrophyOutlined />}
                  onClick={() => setDecisionModalVisible(true)}
                >
                  Make Decision
                </Button>
              )}
            </Space>

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
              </Card>
            )}

            {assessment.hrValidationComments && (
              <Card size="small" title="HR Validation" className="mb-4">
                <div className="mb-2">
                  <Tag color={assessment.hrValidated ? "success" : "error"}>
                    {assessment.hrValidated ? "Approved" : "Rejected"}
                  </Tag>
                </div>
                <Text>{assessment.hrValidationComments}</Text>
              </Card>
            )}
          </Col>
        </Row>
      </Card>

      {/* Certificate Upload Modal */}
      <Modal
        title="Upload Certificate"
        open={certificateModalVisible}
        onCancel={() => setCertificateModalVisible(false)}
        onOk={handleCertificateUpload}
        confirmLoading={loading}
      >
        <Upload
          beforeUpload={(file) => {
            setCertificateFile(file);
            return false;
          }}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>Select Certificate File</Button>
        </Upload>
        {certificateFile && (
          <div className="mt-2">
            <Text>Selected: {certificateFile.name}</Text>
          </div>
        )}
      </Modal>

      {/* Assessment Modal */}
      <Modal
        title="Conduct Assessment"
        open={assessmentModalVisible}
        onCancel={() => setAssessmentModalVisible(false)}
        footer={null}
      >
        <Form form={assessmentForm} onFinish={handleConductAssessment} layout="vertical">
          <Form.Item
            name="assessmentNotes"
            label="Assessment Notes"
            rules={[{ required: true, message: "Assessment notes are required" }]}
          >
            <TextArea rows={6} placeholder="Provide detailed assessment notes..." />
          </Form.Item>

          <Form.Item name="assessmentScore" label="Assessment Score (Optional)">
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="Enter score (0-100)"
              suffix="%"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Complete Assessment
              </Button>
              <Button onClick={() => setAssessmentModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Decision Modal */}
      <Modal
        title="Make Decision"
        open={decisionModalVisible}
        onCancel={() => setDecisionModalVisible(false)}
        footer={null}
      >
        <Form form={decisionForm} onFinish={handleMakeDecision} layout="vertical">
          <Form.Item
            name="decision"
            label="Decision"
            rules={[{ required: true, message: "Decision is required" }]}
          >
            <Select placeholder="Select your decision">
              <Option value="proceed_to_phase_2">Proceed to Phase 2</Option>
              <Option value="terminate">Terminate</Option>
              <Option value="put_on_hold">Put on Hold</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comments"
            label="Comments"
            rules={[{ required: true, message: "Comments are required" }]}
          >
            <TextArea rows={4} placeholder="Provide detailed comments for your decision..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Make Decision
              </Button>
              <Button onClick={() => setDecisionModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export { SupervisorAssessmentManager };
export default SupervisorAssessmentManager; 