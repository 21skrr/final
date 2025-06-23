import React, { useState, useEffect } from 'react';
import { Button, Table, Space, message, Modal, Select, DatePicker } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { User } from '../../types/user';
import { Resource } from '../../types/resource';
import teamService from '../../services/teamService';
import resourceService from '../../services/resourceService';
import toast from 'react-hot-toast';

const { Option } = Select;

const SupervisorResourceView: React.FC = () => {
  const [team, setTeam] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const teamData = await teamService.getMyTeam();
      const resourceData = await resourceService.getAllResources();
      setTeam(teamData);
      setResources(resourceData);
    } catch (error) {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showAssignModal = (user: User) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedUser(null);
    setSelectedResources([]);
    setDueDate(undefined);
  };

  const handleAssign = async () => {
    if (!selectedUser || selectedResources.length === 0) {
      toast.error('Please select a user and at least one resource.');
      return;
    }
    setFormLoading(true);
    try {
      await resourceService.assignResources({
        employeeIds: [selectedUser.id],
        resourceIds: selectedResources,
        dueDate,
      });
      toast.success(`Resources assigned to ${selectedUser.name} successfully.`);
      handleCancel();
    } catch (error) {
      toast.error('Failed to assign resources.');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Button icon={<UserAddOutlined />} onClick={() => showAssignModal(record)}>
          Assign Resources
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Table
        dataSource={team}
        columns={columns}
        rowKey="id"
        loading={loading}
        bordered
        title={() => <h3 style={{ margin: 0 }}>My Team</h3>}
      />
      <Modal
        title={`Assign Resources to ${selectedUser?.name}`}
        open={isModalVisible}
        onOk={handleAssign}
        onCancel={handleCancel}
        confirmLoading={formLoading}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            placeholder="Please select resources"
            onChange={setSelectedResources}
            value={selectedResources}
          >
            {resources.map(res => (
              <Option key={res.id} value={res.id}>{res.title}</Option>
            ))}
          </Select>
          <DatePicker 
            style={{ width: '100%' }} 
            onChange={(date, dateString) => setDueDate(dateString as string)}
          />
        </Space>
      </Modal>
    </div>
  );
};

export default SupervisorResourceView; 