import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/layout/Layout';
import notificationService, { NotificationTemplate, NotificationPreferences } from '../../services/notificationService';
import userService from '../../services/userService';
import teamService from '../../services/teamService';
import { User, UserRole } from '../../types/user';
import Select from 'react-select';

const TABS = [
  { key: 'send', label: 'Send Notification' },
  { key: 'templates', label: 'Templates' },
];

const ALL_ROLES: UserRole[] = ['employee', 'supervisor', 'hr', 'manager'];

const HRNotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('send');

  // Data states for each tab
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Template CRUD state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<NotificationTemplate>>({});
  const [templateActionLoading, setTemplateActionLoading] = useState(false);
  const [templateActionError, setTemplateActionError] = useState<string | null>(null);
  const [templateActionSuccess, setTemplateActionSuccess] = useState<string | null>(null);
  const templateModalRef = useRef<HTMLDialogElement>(null);

  // Send Notification state
  const [sendUserIds, setSendUserIds] = useState<string[]>([]);
  const [sendDepartments, setSendDepartments] = useState<string[]>([]);
  const [sendRoles, setSendRoles] = useState<UserRole[]>([]);
  const [sendTitle, setSendTitle] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendTemplateId, setSendTemplateId] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  // Helper to normalize department options
  const departmentOptions = Array.isArray(departments) && departments.length > 0 && typeof departments[0] === 'object'
    ? departments.map((dep: any) => ({ value: dep.id || dep.name, label: dep.name }))
    : departments.map((dep: any) => ({ value: dep, label: dep }));
  const departmentValue = departmentOptions.filter(opt => sendDepartments.includes(opt.value));

  // Fetch data for each tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        switch (activeTab) {
          case 'templates':
            setTemplates(await notificationService.getTemplates());
            break;
          default:
            break;
        }
      } catch (err: any) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    if (activeTab === 'templates') fetchData();
  }, [activeTab]);

  useEffect(() => {
    // Fetch users and departments for send notification form
    userService.getUsers().then(setUsers);
    userService.getAllDepartments().then(deps => setDepartments(deps || []));
  }, []);

  // Template CRUD handlers
  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', title: '', message: '', type: '', isActive: true });
    setShowTemplateModal(true);
    setTemplateActionError(null);
    setTemplateActionSuccess(null);
  };
  const openEditTemplate = (tpl: NotificationTemplate) => {
    setEditingTemplate(tpl);
    setTemplateForm({ ...tpl });
    setShowTemplateModal(true);
    setTemplateActionError(null);
    setTemplateActionSuccess(null);
  };
  const closeTemplateModal = () => {
    setShowTemplateModal(false);
    setEditingTemplate(null);
    setTemplateForm({});
    setTemplateActionError(null);
    setTemplateActionSuccess(null);
  };
  const handleTemplateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setTemplateForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateActionLoading(true);
    setTemplateActionError(null);
    setTemplateActionSuccess(null);
    try {
      if (editingTemplate) {
        await notificationService.updateTemplate(editingTemplate.id, templateForm);
        setTemplateActionSuccess('Template updated!');
      } else {
        await notificationService.createTemplate(templateForm as any);
        setTemplateActionSuccess('Template created!');
      }
      setTemplates(await notificationService.getTemplates());
      setTimeout(closeTemplateModal, 1000);
    } catch (err: any) {
      setTemplateActionError('Failed to save template.');
    } finally {
      setTemplateActionLoading(false);
    }
  };
  const handleDeleteTemplate = async (tpl: NotificationTemplate) => {
    if (!window.confirm('Delete this template?')) return;
    setTemplateActionLoading(true);
    setTemplateActionError(null);
    try {
      await notificationService.deleteTemplate(tpl.id);
      setTemplates(await notificationService.getTemplates());
    } catch (err: any) {
      setTemplateActionError('Failed to delete template.');
    } finally {
      setTemplateActionLoading(false);
    }
  };
  const handlePreviewTemplate = (tpl: NotificationTemplate) => {
    setEditingTemplate(tpl);
    setShowTemplateModal(true);
    setTemplateForm({ ...tpl });
    setTemplateActionError(null);
    setTemplateActionSuccess(null);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendSuccess(null);
    setSendError(null);
    // Validation
    if (sendUserIds.length === 0 && sendDepartments.length === 0 && sendRoles.length === 0) {
      setSendError('Please select at least one user, department, or role.');
      return;
    }
    if (!sendTemplateId && (!sendTitle.trim() || !sendMessage.trim())) {
      setSendError('Title and message are required if no template is selected.');
      return;
    }
    setSendLoading(true);
    try {
      let templateVars = {};
      let title = sendTitle;
      let message = sendMessage;
      if (sendTemplateId) {
        const tpl = templates.find(t => t.id === sendTemplateId);
        if (tpl) {
          title = tpl.title;
          message = tpl.message;
        }
      }
      await notificationService.sendBulkNotification({
        userIds: sendUserIds,
        departments: sendDepartments,
        roles: sendRoles,
        title,
        message,
        type: 'info',
        templateName: sendTemplateId ? templates.find(t => t.id === sendTemplateId)?.name : undefined,
        templateVars,
      });
      setSendSuccess('Notification(s) sent!');
      setSendUserIds([]);
      setSendDepartments([]);
      setSendRoles([]);
      setSendTitle('');
      setSendMessage('');
      setSendTemplateId('');
    } catch (err) {
      setSendError('Failed to send notification.');
    } finally {
      setSendLoading(false);
    }
  };

  // Render helpers

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">HR Notification Control Center</h1>
        <div className="flex space-x-2 mb-8 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-t-md font-medium focus:outline-none transition-colors ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-b-lg shadow p-6 min-h-[400px]">
          {activeTab === 'templates' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Notification Templates</h2>
              <button onClick={openCreateTemplate} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ New Template</button>
              {templateActionError && <div className="text-red-600 mb-2">{templateActionError}</div>}
              {templateActionSuccess && <div className="text-green-600 mb-2">{templateActionSuccess}</div>}
              <table className="min-w-full text-sm border mb-4">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Name</th>
                    <th className="border px-2 py-1">Title</th>
                    <th className="border px-2 py-1">Type</th>
                    <th className="border px-2 py-1">Active</th>
                    <th className="border px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((tpl) => (
                    <tr key={tpl.id} className="border-t">
                      <td className="border px-2 py-1">{tpl.name}</td>
                      <td className="border px-2 py-1">{tpl.title}</td>
                      <td className="border px-2 py-1">{tpl.type}</td>
                      <td className="border px-2 py-1">{tpl.isActive ? 'Yes' : 'No'}</td>
                      <td className="border px-2 py-1 space-x-2">
                        <button onClick={() => openEditTemplate(tpl)} className="text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handlePreviewTemplate(tpl)} className="text-green-600 hover:underline">Preview</button>
                        <button onClick={() => handleDeleteTemplate(tpl)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Modal for create/edit/preview */}
              {showTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                    <button onClick={closeTemplateModal} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">&times;</button>
                    <h3 className="text-lg font-bold mb-4">{editingTemplate ? 'Edit Template' : 'New Template'}</h3>
                    <form onSubmit={handleTemplateSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium">Name</label>
                        <input name="name" value={templateForm.name || ''} onChange={handleTemplateFormChange} required className="w-full border rounded px-2 py-1" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Title</label>
                        <input name="title" value={templateForm.title || ''} onChange={handleTemplateFormChange} required className="w-full border rounded px-2 py-1" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Type</label>
                        <input name="type" value={templateForm.type || ''} onChange={handleTemplateFormChange} required className="w-full border rounded px-2 py-1" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Message</label>
                        <textarea name="message" value={templateForm.message || ''} onChange={handleTemplateFormChange} required className="w-full border rounded px-2 py-1" rows={4} />
                        <div className="text-xs text-gray-500 mt-1">You can use dynamic placeholders like <code>{'{userName}'}</code>, <code>{'{checklistName}'}</code>, etc.</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" name="isActive" checked={!!templateForm.isActive} onChange={handleTemplateFormChange} />
                        <label className="text-sm">Active</label>
                      </div>
                      <div className="flex space-x-2">
                        <button type="submit" disabled={templateActionLoading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{editingTemplate ? 'Save' : 'Create'}</button>
                        <button type="button" onClick={closeTemplateModal} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                      </div>
                      {templateActionLoading && <div className="text-blue-600">Saving...</div>}
                      {templateActionError && <div className="text-red-600">{templateActionError}</div>}
                      {templateActionSuccess && <div className="text-green-600">{templateActionSuccess}</div>}
                    </form>
                    {editingTemplate && (
                      <div className="mt-6 bg-gray-50 p-4 rounded">
                        <h4 className="font-semibold mb-2">Preview</h4>
                        <div><b>Title:</b> {templateForm.title}</div>
                        <div><b>Message:</b> {templateForm.message}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'send' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Send Notification</h2>
              <form onSubmit={handleSendNotification} className="space-y-4 bg-white shadow rounded-lg p-6 max-w-lg">
                <div>
                  <label className="block text-sm font-medium">Select Users</label>
                  <Select
                    isMulti
                    options={users.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                    value={users.filter(u => sendUserIds.includes(u.id)).map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                    onChange={opts => setSendUserIds(opts ? opts.map((o: any) => o.value) : [])}
                    placeholder="Type to search users..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Select Departments</label>
                  <Select
                    isMulti
                    options={departmentOptions}
                    value={departmentValue}
                    onChange={opts => setSendDepartments(opts ? opts.map((o: any) => o.label) : [])}
                    placeholder="Type to search departments..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Select Roles</label>
                  <Select
                    isMulti
                    options={ALL_ROLES.map(role => ({ value: role, label: role }))}
                    value={ALL_ROLES.filter(role => sendRoles.includes(role)).map(role => ({ value: role, label: role }))}
                    onChange={opts => setSendRoles(opts ? opts.map((o: any) => o.value) : [])}
                    placeholder="Type to search roles..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Use Template</label>
                  <select value={sendTemplateId} onChange={e => setSendTemplateId(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                    <option value="">-- None --</option>
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Title</label>
                  <input type="text" value={sendTitle} onChange={e => setSendTitle(e.target.value)} disabled={!!sendTemplateId} required={!sendTemplateId} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Message</label>
                  <textarea value={sendMessage} onChange={e => setSendMessage(e.target.value)} disabled={!!sendTemplateId} required={!sendTemplateId} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                <button type="submit" disabled={sendLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{sendLoading ? 'Sending...' : 'Send Notification(s)'}</button>
                {sendSuccess && <div className="text-green-600 text-sm mt-2">{sendSuccess}</div>}
                {sendError && <div className="text-red-600 text-sm mt-2">{sendError}</div>}
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HRNotificationCenter; 