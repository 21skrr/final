import React, { useState, useEffect } from 'react';
import { Button, Table, Space, Popconfirm, message, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import resourceService from '../../services/resourceService';
import { Resource } from '../../types/resource';
import ResourceForm from './ResourceForm';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const HRResourceManager: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await resourceService.getAllResources();
      setResources(data);
    } catch (error) {
      toast.error('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await resourceService.getResourceAnalytics();
      // Flatten/mapping for table/chart
      const formatted = data.map((item: any) => ({
        resourceTitle: item.resource?.title || item.title || 'Unknown',
        type: item.resource?.type || item.type || 'Unknown',
        accessCount: item.accessCount || 0,
        resourceId: item.resource?.id || item.id,
      }));
      setAnalytics(formatted);
    } catch (error) {
      toast.error('Failed to load analytics.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchAnalytics();
  }, []);

  const handleAdd = () => {
    setEditingResource(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: Resource) => {
    setEditingResource(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await resourceService.deleteResource(id);
      toast.success('Resource deleted successfully');
      fetchResources(); // Refresh list
    } catch (error) {
      toast.error('Failed to delete resource.');
    }
  };

  const handleFormFinish = async (values: any) => {
    setFormLoading(true);
    try {
      if (editingResource) {
        await resourceService.updateResource(editingResource.id, values);
        toast.success('Resource updated successfully');
      } else {
        await resourceService.createResource(values);
        toast.success('Resource created successfully');
      }
      setIsModalVisible(false);
      fetchResources(); // Refresh list
    } catch (error) {
      toast.error(`Failed to ${editingResource ? 'update' : 'create'} resource.`);
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Stage', dataIndex: 'stage', key: 'stage' },
    { title: 'Program', dataIndex: 'programType', key: 'programType' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Resource) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure you want to delete this resource?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Tabs defaultActiveKey="resources">
      <Tabs.TabPane tab="Resources" key="resources">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Resource
          </Button>
        </div>
        <Table
          dataSource={resources}
          columns={columns}
          rowKey="id"
          loading={loading}
          bordered
        />
        <ResourceForm
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onFinish={handleFormFinish}
          initialValues={editingResource || undefined}
          loading={formLoading}
        />
      </Tabs.TabPane>
      <Tabs.TabPane tab="Analytics" key="analytics">
        {analyticsLoading ? (
          <div>Loading analytics...</div>
        ) : (
          <>
            <div style={{ marginBottom: 32 }}>
              <h3>Resource Access Chart</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="resourceTitle" angle={-30} textAnchor="end" interval={0} height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="accessCount" fill="#1890ff" name="Access Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3>Resource Access Table</h3>
              <Table
                dataSource={analytics}
                columns={[
                  { title: 'Resource', dataIndex: 'resourceTitle', key: 'resourceTitle' },
                  { title: 'Type', dataIndex: 'type', key: 'type' },
                  { title: 'Access Count', dataIndex: 'accessCount', key: 'accessCount' },
                ]}
                rowKey={record => record.resourceId || record.id}
                bordered
                pagination={false}
              />
            </div>
          </>
        )}
      </Tabs.TabPane>
    </Tabs>
  );
};

export default HRResourceManager; 