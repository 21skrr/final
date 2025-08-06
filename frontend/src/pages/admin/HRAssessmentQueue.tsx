// pages/admin/HRAssessmentQueue.tsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Modal, message, Statistic, Row, Col } from 'antd';
import { User, FileText, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import hrAssessmentService from '../../services/hrAssessmentService';
import { HRAssessment } from '../../types/hrAssessment';
import HRAssessmentManager from '../../components/hr/HRAssessmentManager';
import Layout from '../../components/layout/Layout';

const HRAssessmentQueue: React.FC = () => {
  const [assessments, setAssessments] = useState<HRAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<HRAssessment | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingAssessments();
  }, []);

  const fetchPendingAssessments = async () => {
    try {
      setLoading(true);
      const response = await hrAssessmentService.getPendingAssessments();
      setAssessments(response.assessments);
    } catch (error) {
      message.error('Failed to fetch pending HR assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (assessment: HRAssessment) => {
    setSelectedAssessment(assessment);
    setDetailModalVisible(true);
  };

  const handleAssessmentUpdate = () => {
    fetchPendingAssessments();
    setDetailModalVisible(false);
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (assessment: HRAssessment) => (
        <div className="flex items-center">
          <User className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <div className="font-medium">{assessment.employee?.name}</div>
            <div className="text-sm text-gray-500">{assessment.employee?.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department'],
      key: 'department',
    },
    {
      title: 'Status',
      key: 'status',
      render: (assessment: HRAssessment) => (
        <Tag className={hrAssessmentService.getStatusColor(assessment)}>
          {hrAssessmentService.getStatusDisplayText(assessment)}
        </Tag>
      ),
    },
    {
      title: 'Phase 2 Completed',
      key: 'phase2CompletedDate',
      render: (assessment: HRAssessment) => (
        assessment.phase2CompletedDate ? 
          new Date(assessment.phase2CompletedDate).toLocaleDateString() : 
          'N/A'
      ),
    },
    {
      title: 'Assessment Requested',
      key: 'assessmentRequestedDate',
      render: (assessment: HRAssessment) => (
        assessment.assessmentRequestedDate ? 
          new Date(assessment.assessmentRequestedDate).toLocaleDateString() : 
          'N/A'
      ),
    },
    {
      title: 'HR Assessor',
      key: 'hr',
      render: (assessment: HRAssessment) => (
        <div>
          <div className="font-medium">{assessment.hr?.name}</div>
          <div className="text-sm text-gray-500">{assessment.hr?.email}</div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (assessment: HRAssessment) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<Eye />}
            onClick={() => handleViewDetails(assessment)}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  const pendingCount = assessments.filter(a => a.status === 'pending_assessment').length;
  const completedCount = assessments.filter(a => 
    a.status === 'assessment_completed' || 
    a.status === 'decision_made' || 
    a.status === 'completed'
  ).length;
  const totalCount = assessments.length;

  return (
    <Layout>
      <div className="p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">HR Assessment Queue</h1>
            <Button onClick={() => navigate('/admin')}>
              Back to Admin Panel
            </Button>
          </div>

      {/* Statistics */}
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Pending Assessments"
              value={pendingCount}
              prefix={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
              valueStyle={{ color: '#d97706' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Completed Assessments"
              value={completedCount}
              prefix={<FileText className="w-5 h-5 text-blue-500" />}
              valueStyle={{ color: '#2563eb' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Assessments"
              value={totalCount}
              prefix={<User className="w-5 h-5 text-gray-500" />}
              valueStyle={{ color: '#6b7280' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Assessments Table */}
      <Card title="Pending HR Assessments" className="shadow-md">
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
        title="HR Assessment Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedAssessment && (
          <HRAssessmentManager
            assessmentId={selectedAssessment.id}
            onUpdate={handleAssessmentUpdate}
          />
        )}
      </Modal>
        </div>
      </div>
    </Layout>
  );
};

export default HRAssessmentQueue; 