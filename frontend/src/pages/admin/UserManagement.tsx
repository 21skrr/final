import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { User, UserPlus, Search, Edit, Trash2 } from 'lucide-react';
import { Modal, Button, Input, Select, message, Form, Popconfirm } from 'antd';

const { Option } = Select;

type UserType = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  programType?: string;
  startDate?: string;
  status?: string;
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      message.error('Failed to load users');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setShowModal(true);
  };

  const handleEdit = async (user: UserType) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      const userData = await res.json();
      console.log('Fetched user data:', userData);
      setEditingUser(userData);
      const formData = {
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || '',
        department: userData.department || '',
        programType: userData.programType || '',
        startDate: userData.startDate ? userData.startDate.slice(0, 10) : '',
        password: '',
      };
      console.log('Form data to set:', formData);
      form.setFieldsValue(formData);
      setShowModal(true);
    } catch {
      message.error('Failed to fetch user data');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete user');
      message.success('User deleted');
      fetchUsers();
    } catch {
      message.error('Failed to delete user');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser
        ? `http://localhost:5000/api/users/${editingUser.id}`
        : 'http://localhost:5000/api/users';
      // Extra safeguard: remove password if not present or empty
      if (!values.password) {
        delete values.password;
      }
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Failed to save user');
      message.success(editingUser ? 'User updated' : 'User created');
      setShowModal(false);
      fetchUsers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save user';
      message.error(errorMessage);
    }
  };

  // Password change handler
  const handlePasswordChange = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (values.newPassword !== values.repeatPassword) {
        message.error('New passwords do not match');
        return;
      }
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/users/${editingUser?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: values.currentPassword, password: values.newPassword }),
      });
      if (!res.ok) throw new Error('Failed to update password');
      message.success('Password updated');
      setShowPasswordModal(false);
      passwordForm.resetFields();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update password';
      message.error(errorMessage);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <Button
            type="primary"
            icon={<UserPlus className="h-5 w-5 mr-2" />}
            onClick={handleAdd}
          >
            Add New User
          </Button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {/* Filters can be added here */}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">{user.role}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{user.department}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{user.programType || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{user.status || 'active'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.startDate ? new Date(user.startDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button icon={<Edit className="h-4 w-4" />} size="small" onClick={() => handleEdit(user)} />
                      <Popconfirm title="Delete this user?" onConfirm={() => handleDelete(user.id)} okText="Delete" cancelText="Cancel">
                        <Button icon={<Trash2 className="h-4 w-4" />} size="small" danger />
                      </Popconfirm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          title={editingUser ? 'Edit User' : 'Add New User'}
          open={showModal}
          onCancel={() => setShowModal(false)}
          onOk={handleModalOk}
          okText={editingUser ? 'Update' : 'Create'}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="Name" rules={[{ required: true }]}> 
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}> 
              <Input />
            </Form.Item>
            {/* Only show password field when adding a new user */}
            {!editingUser && (
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}> 
                <Input.Password />
              </Form.Item>
            )}
            <Form.Item name="role" label="Role" rules={[{ required: true }]}> 
              <Select>
                <Option value="employee">Employee</Option>
                <Option value="supervisor">Supervisor</Option>
                <Option value="manager">Manager</Option>
                <Option value="admin">Admin</Option>
                <Option value="hr">HR</Option>
              </Select>
            </Form.Item>
            <Form.Item name="department" label="Department" rules={[{ required: true }]}> 
              <Input />
            </Form.Item>
            <Form.Item name="programType" label="Program Type" rules={[{ required: true }]}> 
              <Select>
                <Option value="inkompass">Inkompass</Option>
                <Option value="earlyTalent">Early Talent</Option>
                <Option value="apprenticeship">Apprenticeship</Option>
                <Option value="academicPlacement">Academic Placement</Option>
                <Option value="workExperience">Work Experience</Option>
              </Select>
            </Form.Item>
            <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}> 
              <Input type="date" />
            </Form.Item>
          </Form>
          {/* Show change password button when editing */}
          {editingUser && (
            <Button style={{ marginTop: 16 }} onClick={() => setShowPasswordModal(true)}>
              Change Password
            </Button>
          )}
        </Modal>
        {/* Password Change Modal */}
        <Modal
          title="Change Password"
          open={showPasswordModal}
          onCancel={() => setShowPasswordModal(false)}
          onOk={handlePasswordChange}
          okText="Update Password"
        >
          <Form form={passwordForm} layout="vertical">
            <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true, min: 6 }]}> 
              <Input.Password />
            </Form.Item>
            <Form.Item name="newPassword" label="New Password" rules={[{ required: true, min: 6 }]}> 
              <Input.Password />
            </Form.Item>
            <Form.Item name="repeatPassword" label="Repeat New Password" dependencies={["newPassword"]} rules={[
              { required: true, min: 6 },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match!'));
                },
              }),
            ]}>
              <Input.Password />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default UserManagement;