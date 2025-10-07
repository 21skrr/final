import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { User, UserPlus, Search, Edit, Trash2, RotateCcw } from 'lucide-react';
import { Modal, Button, Input, Select, message, Form, Popconfirm, Tabs } from 'antd';
import teamService, { Team } from '../../services/teamService';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

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
  deletedAt?: string;
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [deactivatedUsers, setDeactivatedUsers] = useState<UserType[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [programFilter, setProgramFilter] = useState<string | undefined>(undefined);
  const [roles, setRoles] = useState<{ id: string; name: string; description: string }[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined);
  const { user } = useAuth();
  // Team management state
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', description: '', managerId: '', members: [] as string[] });
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [supervisors, setSupervisors] = useState<UserType[]>([]);
  // Fetch all users for dropdowns when modal opens
  useEffect(() => {
    if (showTeamModal) {
      userService.getUsers().then(setAllUsers);
    }
  }, [showTeamModal]);

  // Fetch supervisors and teams when modal opens for user creation
  useEffect(() => {
    if (showModal) {
      // Fetch supervisors (users with role 'supervisor')
      const fetchSupervisors = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:5000/api/users?role=supervisor', {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          });
          if (!res.ok) throw new Error('Failed to fetch supervisors');
          const data = await res.json();
          setSupervisors(data);
        } catch (err) {
          console.error('Error fetching supervisors:', err);
          message.error('Failed to load supervisors');
        }
      };
      
      // Fetch teams
      const fetchTeams = async () => {
        try {
          const data = await teamService.getTeams();
          if (Array.isArray(data)) {
            setTeams(data);
          } else if (data && typeof data === 'object') {
            setTeams([data]);
          } else {
            setTeams([]);
          }
        } catch (err) {
          console.error('Error fetching teams:', err);
          setTeams([]);
        }
      };

      fetchSupervisors();
      fetchTeams();
    }
  }, [showModal]);

  const roleOptions = [
    { value: 'employee', label: 'Employee' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr', label: 'HR' },
  ];
  const programOptions = [
    { value: 'inkompass', label: 'Inkompass' },
    { value: 'earlyTalent', label: 'Early Talent' },
    { value: 'apprenticeship', label: 'Apprenticeship' },
    { value: 'academicPlacement', label: 'Academic Placement' },
    { value: 'workExperience', label: 'Work Experience' },
  ];

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

  const fetchDeactivatedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users/deactivated', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch deactivated users');
      const data = await res.json();
      setDeactivatedUsers(data);
    } catch (err) {
      console.error('Error fetching deactivated users:', err);
      message.error('Failed to load deactivated users');
    }
  };

  useEffect(() => { 
    fetchUsers(); 
    fetchDeactivatedUsers();
    // Fetch departments
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/users/departments/all', {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch departments');
        const data = await res.json();
        setDepartments(data);
      } catch (err) {
        console.error('Error fetching departments:', err);
        message.error('Failed to load departments');
      }
    };
    fetchDepartments();
    // Fetch roles
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/roles', {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch roles');
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error('Error fetching roles:', err);
        message.error('Failed to load roles');
      }
    };
    fetchRoles();
    // Fetch teams for HR
    if (user?.role === 'hr') {
      teamService.getTeams()
        .then(data => {
          if (Array.isArray(data)) {
            setTeams(data);
          } else if (data && typeof data === 'object') {
            setTeams([data]);
          } else {
            setTeams([]);
          }
        })
        .catch(() => setTeams([]));
    }
  }, [user]);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setSelectedRole(undefined);
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
      setSelectedRole(formData.role);
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
      if (!res.ok) throw new Error('Failed to deactivate user');
      message.success('User deactivated successfully');
      fetchUsers();
      fetchDeactivatedUsers();
    } catch {
      message.error('Failed to deactivate user');
    }
  };

  const handleRestore = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/users/${userId}/restore`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to restore user');
      message.success('User restored successfully');
      fetchUsers();
      fetchDeactivatedUsers();
    } catch {
      message.error('Failed to restore user');
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

  // Team modal handlers
  const openCreateTeam = () => {
    setEditingTeam(null);
    setTeamForm({ name: '', description: '', managerId: '', members: [] });
    setShowTeamModal(true);
  };
  const openEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description || '',
      managerId: team.managerId,
      members: team.members ? team.members.map(m => m.id) : [],
    });
    setShowTeamModal(true);
  };
  const handleTeamFormChange = (field: string, value: any) => {
    setTeamForm(prev => ({ ...prev, [field]: value }));
  };
  const handleSaveTeam = async () => {
    try {
      if (editingTeam) {
        await teamService.updateTeam(editingTeam.id, teamForm);
      } else {
        await teamService.createTeam(teamForm);
      }
      setShowTeamModal(false);
      setEditingTeam(null);
      teamService.getTeams()
        .then(data => {
          if (Array.isArray(data)) {
            setTeams(data);
          } else if (data && typeof data === 'object') {
            setTeams([data]);
          } else {
            setTeams([]);
          }
        })
        .catch(() => setTeams([]));
    } catch (err) {
      message.error('Failed to save team');
    }
  };

  const filteredUsers = users.filter(u =>
    (departmentFilter ? u.department === departmentFilter : true) &&
    (roleFilter ? u.role === roleFilter : true) &&
    (programFilter ? u.programType === programFilter : true) &&
    (u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">User Management</h1>
      <p className="mb-6 text-gray-600">Manage user accounts, roles, and permissions</p>
      <Tabs defaultActiveKey="active" style={{ background: '#fff', padding: 16 }}>
        <Tabs.TabPane tab={`Active Users (${filteredUsers.length})`} key="active">
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search active users..."
                    className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Select
                  allowClear
                  placeholder="Filter by Department"
                  style={{ minWidth: 160 }}
                  value={departmentFilter}
                  onChange={setDepartmentFilter}
                >
                  {departments.map(dep => (
                    <Option key={dep.id} value={dep.name}>{dep.name}</Option>
                  ))}
                </Select>
                <Select
                  allowClear
                  placeholder="Filter by Role"
                  style={{ minWidth: 140 }}
                  value={roleFilter}
                  onChange={setRoleFilter}
                >
                  {roles.map(opt => (
                    <Option key={opt.name} value={opt.name}>{opt.name.charAt(0).toUpperCase() + opt.name.slice(1)}</Option>
                  ))}
                </Select>
                <Select
                  allowClear
                  placeholder="Filter by Program"
                  style={{ minWidth: 180 }}
                  value={programFilter}
                  onChange={setProgramFilter}
                >
                  {programOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
                <Button 
                  type="primary" 
                  icon={<UserPlus className="h-4 w-4" />}
                  onClick={handleAdd}
                  className="whitespace-nowrap"
                >
                  Add New User
                </Button>
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
                        <Popconfirm title="Deactivate this user?" onConfirm={() => handleDelete(user.id)} okText="Deactivate" cancelText="Cancel">
                          <Button icon={<Trash2 className="h-4 w-4" />} size="small" danger />
                        </Popconfirm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={`Deactivated Users (${deactivatedUsers.length})`} key="deactivated">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deactivated Date</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deactivatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-600" />
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.deletedAt ? new Date(user.deletedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Popconfirm title="Restore this user?" onConfirm={() => handleRestore(user.id)} okText="Restore" cancelText="Cancel">
                          <Button icon={<RotateCcw className="h-4 w-4" />} size="small" type="primary" />
                        </Popconfirm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Tabs.TabPane>
        {user?.role === 'hr' && (
          <Tabs.TabPane tab="Teams" key="teams">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Teams</h2>
              <Button type="primary" onClick={openCreateTeam}>Create Team</Button>
            </div>
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Description</th>
                  <th className="px-4 py-2 border">Manager</th>
                  <th className="px-4 py-2 border">Members</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(teams) ? teams : []).map(team => (
                  <tr key={team.id}>
                    <td className="px-4 py-2 border">{team.name}</td>
                    <td className="px-4 py-2 border">{team.description}</td>
                    <td className="px-4 py-2 border">{team.managerId}</td>
                    <td className="px-4 py-2 border">{team.members?.map(m => m.name).join(', ')}</td>
                    <td className="px-4 py-2 border">
                      <Button size="small" onClick={() => openEditTeam(team)}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Modal
              title={editingTeam ? 'Edit Team' : 'Create Team'}
              open={showTeamModal}
              onCancel={() => setShowTeamModal(false)}
              onOk={handleSaveTeam}
            >
              <Form layout="vertical">
                <Form.Item label="Team Name" required>
                  <Input value={teamForm.name} onChange={e => handleTeamFormChange('name', e.target.value)} />
                </Form.Item>
                <Form.Item label="Description">
                  <Input value={teamForm.description} onChange={e => handleTeamFormChange('description', e.target.value)} />
                </Form.Item>
                <Form.Item label="Manager" required>
                  <Select
                    showSearch
                    value={teamForm.managerId}
                    onChange={value => handleTeamFormChange('managerId', value)}
                    filterOption={(input, option) =>
                      (option?.children as string).toLowerCase().includes(input.toLowerCase())
                    }
                    placeholder="Select a manager"
                  >
                    {allUsers.filter(u => u.role === 'manager').map(u => (
                      <Select.Option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Members">
                  <Select
                    mode="multiple"
                    showSearch
                    value={teamForm.members}
                    onChange={value => handleTeamFormChange('members', value)}
                    filterOption={(input, option) =>
                      (option?.children as string).toLowerCase().includes(input.toLowerCase())
                    }
                    placeholder="Select team members"
                  >
                    {allUsers.map(u => (
                      <Select.Option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Form>
            </Modal>
          </Tabs.TabPane>
        )}
      </Tabs>

        <Modal
          title={editingUser ? 'Edit User' : 'Add New User'}
          open={showModal}
          onCancel={() => setShowModal(false)}
          onOk={handleModalOk}
          okText={editingUser ? 'Update' : 'Create'}
        >
          <Form
            form={form}
            onValuesChange={(changed, all) => {
              if ('role' in changed) setSelectedRole(changed.role);
            }}
            layout="vertical"
          >
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
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select a role' }]}
            >
              <Select
                placeholder="Select role"
                onChange={() => {
                  // Reset programType if role changes
                  form.setFieldsValue({ programType: undefined });
                }}
              >
                {roles.map(opt => (
                  <Option key={opt.name} value={opt.name}>{opt.name.charAt(0).toUpperCase() + opt.name.slice(1)}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Please select a department' }]}
            >
              <Select placeholder="Select department">
                {departments.map(dep => (
                  <Option key={dep.id} value={dep.name}>{dep.name}</Option>
                ))}
              </Select>
            </Form.Item>
            {/* Program Type: required only for employees */}
            {selectedRole === 'employee' && (
              <Form.Item
                name="programType"
                label="Program Type"
                rules={[{ required: true, message: 'Please select a program type' }]}
              >
                <Select placeholder="Select program type">
                  <Option value="inkompass">Inkompass</Option>
                  <Option value="earlyTalent">Early Talent</Option>
                  <Option value="apprenticeship">Apprenticeship</Option>
                  <Option value="academicPlacement">Academic Placement</Option>
                  <Option value="workExperience">Work Experience</Option>
                </Select>
              </Form.Item>
            )}
            {selectedRole !== 'employee' && (
              <Form.Item
                name="programType"
                label="Program Type"
                rules={[]}
                style={{ display: 'none' }}
              >
                <Input disabled />
              </Form.Item>
            )}
            {/* Supervisor: required only for employees */}
            {selectedRole === 'employee' && (
              <Form.Item
                name="supervisorId"
                label="Supervisor"
                rules={[{ required: true, message: 'Please select a supervisor' }]}
              >
                <Select 
                  placeholder="Select supervisor"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as string).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {supervisors.map(supervisor => (
                    <Option key={supervisor.id} value={supervisor.id}>
                      {supervisor.name} ({supervisor.email})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            {selectedRole !== 'employee' && (
              <Form.Item
                name="supervisorId"
                label="Supervisor"
                rules={[]}
                style={{ display: 'none' }}
              >
                <Input disabled />
              </Form.Item>
            )}
            {/* Team: required only for employees */}
            {selectedRole === 'employee' && (
              <Form.Item
                name="teamId"
                label="Team"
                rules={[{ required: true, message: 'Please select a team' }]}
              >
                <Select 
                  placeholder="Select team"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as string).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {teams.map(team => (
                    <Option key={team.id} value={team.id}>
                      {team.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            {selectedRole !== 'employee' && (
              <Form.Item
                name="teamId"
                label="Team"
                rules={[]}
                style={{ display: 'none' }}
              >
                <Input disabled />
              </Form.Item>
            )}
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
    </Layout>
  );
};

export default UserManagement;