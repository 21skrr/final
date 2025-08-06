// components/hr/HRAssessmentManager.tsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Select, message, Modal, Descriptions, Tag } from 'antd';
import { User, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import hrAssessmentService from '../../services/hrAssessmentService';
import { HRAssessment, ConductAssessmentFormData, MakeDecisionFormData } from '../../types/hrAssessment';

const { TextArea } = Input;
const { Option } = Select;

interface HRAssessmentManagerProps {
  assessmentId: string;
  onUpdate?: () => void;
}

const HRAssessmentManager: React.FC<HRAssessmentManagerProps> = ({ assessmentId, onUpdate }) => {
  const [assessment, setAssessment] = useState<HRAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [conductModalVisible, setConductModalVisible] = useState(false);
  const [decisionModalVisible, setDecisionModalVisible] = useState(false);
  const [conductForm] = Form.useForm();
  const [decisionForm] = Form.useForm();

  useEffect(() => {
    fetchAssessment();
  }, [assessmentId]);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const response = await hrAssessmentService.getAssessment(assessmentId);
      setAssessment(response.assessment);
    } catch (error) {
      message.error('Failed to fetch assessment details');
    } finally {
      setLoading(false);
    }
  };

  const handleConductAssessment = async (values: ConductAssessmentFormData) => {
    try {
      // Convert score to number if it exists
      const formData = {
        ...values,
        assessmentScore: values.assessmentScore ? Number(values.assessmentScore) : undefined
      };
      
      await hrAssessmentService.conductAssessment(assessmentId, formData);
      message.success('Assessment conducted successfully');
      setConductModalVisible(false);
      conductForm.resetFields();
      fetchAssessment();
      onUpdate?.();
    } catch (error) {
      message.error('Failed to conduct assessment');
    }
  };

  const handleMakeDecision = async (values: MakeDecisionFormData) => {
    try {
      await hrAssessmentService.makeDecision(assessmentId, values);
      message.success('Decision made successfully');
      setDecisionModalVisible(false);
      decisionForm.resetFields();
      fetchAssessment();
      onUpdate?.();
    } catch (error) {
      message.error('Failed to make decision');
    }
  };

  if (loading) {
    return <Card loading={true} />;
  }

  if (!assessment) {
    return <Card>Assessment not found</Card>;
  }

  const canConductAssessment = hrAssessmentService.canConductAssessment(assessment);
  const canMakeDecision = hrAssessmentService.canMakeDecision(assessment);
  const isDecisionMade = hrAssessmentService.isDecisionMade(assessment);

  return (
    <div className="space-y-6">
      <Card title="HR Assessment Details" className="shadow-md">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Employee">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              {assessment.employee?.name} ({assessment.employee?.email})
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            {assessment.employee?.department}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag className={hrAssessmentService.getStatusColor(assessment)}>
              {hrAssessmentService.getStatusDisplayText(assessment)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Phase 2 Completed">
            {assessment.phase2CompletedDate ? 
              new Date(assessment.phase2CompletedDate).toLocaleDateString() : 
              'N/A'
            }
          </Descriptions.Item>
          <Descriptions.Item label="Assessment Requested">
            {assessment.assessmentRequestedDate ? 
              new Date(assessment.assessmentRequestedDate).toLocaleDateString() : 
              'N/A'
            }
          </Descriptions.Item>
          <Descriptions.Item label="HR Assessor">
            {assessment.hr?.name} ({assessment.hr?.email})
          </Descriptions.Item>
        </Descriptions>

        {assessment.assessmentDate && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Assessment Details</h4>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Assessment Date">
                {new Date(assessment.assessmentDate).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Assessment Score">
                {assessment.assessmentScore ? `${assessment.assessmentScore}/100` : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Assessment Notes">
                {assessment.assessmentNotes || 'No notes provided'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}

        {assessment.hrDecision && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">HR Decision</h4>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Decision">
                <Tag color={assessment.hrDecision === 'approve' ? 'green' : 'red'}>
                  {assessment.hrDecision.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Decision Date">
                {assessment.hrDecisionDate ? 
                  new Date(assessment.hrDecisionDate).toLocaleDateString() : 
                  'N/A'
                }
              </Descriptions.Item>
              <Descriptions.Item label="Decision Comments">
                {assessment.hrDecisionComments || 'No comments provided'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Card>

      <div className="flex gap-4">
        {canConductAssessment && (
          <Button
            type="primary"
            icon={<FileText />}
            onClick={() => setConductModalVisible(true)}
            className="flex items-center"
          >
            Conduct Assessment
          </Button>
        )}

        {canMakeDecision && (
          <Button
            type="primary"
            icon={<CheckCircle />}
            onClick={() => setDecisionModalVisible(true)}
            className="flex items-center"
          >
            Make Decision
          </Button>
        )}

        {isDecisionMade && (
          <div className="flex items-center gap-2">
            {hrAssessmentService.isApproved(assessment) ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {hrAssessmentService.isApproved(assessment) ? 'Assessment Approved' : 'Assessment Rejected'}
            </span>
          </div>
        )}
      </div>

      {/* Conduct Assessment Modal */}
      <Modal
        title="Conduct HR Assessment"
        open={conductModalVisible}
        onCancel={() => setConductModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={conductForm}
          layout="vertical"
          onFinish={handleConductAssessment}
        >
          <Form.Item
            label="Assessment Notes"
            name="assessmentNotes"
            rules={[{ required: true, message: 'Assessment notes are required' }]}
          >
            <TextArea rows={6} placeholder="Provide detailed assessment notes..." />
          </Form.Item>

          <Form.Item
            label="Assessment Score (0-100)"
            name="assessmentScore"
            rules={[
              {
                validator: (_, value) => {
                  if (value === undefined || value === null || value === '') {
                    return Promise.resolve(); // Optional field
                  }
                  const numValue = Number(value);
                  if (isNaN(numValue)) {
                    return Promise.reject(new Error('Score must be a valid number'));
                  }
                  if (numValue < 0 || numValue > 100) {
                    return Promise.reject(new Error('Score must be between 0 and 100'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input type="number" min={0} max={100} placeholder="Enter score (optional)" />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setConductModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Complete Assessment
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Make Decision Modal */}
      <Modal
        title="Make HR Decision"
        open={decisionModalVisible}
        onCancel={() => setDecisionModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={decisionForm}
          layout="vertical"
          onFinish={handleMakeDecision}
        >
          <Form.Item
            label="HR Decision"
            name="hrDecision"
            rules={[{ required: true, message: 'Decision is required' }]}
          >
            <Select placeholder="Select decision">
              <Option value="approve">Approve - Complete Onboarding</Option>
              <Option value="reject">Reject - Terminate Onboarding</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Decision Comments"
            name="hrDecisionComments"
            rules={[{ required: true, message: 'Decision comments are required' }]}
          >
            <TextArea rows={4} placeholder="Provide detailed comments for your decision..." />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setDecisionModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Make Decision
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default HRAssessmentManager; 