import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import notificationService, { NotificationTemplate } from '../../services/notificationService';
import userService from '../../services/userService';
import { User, UserRole } from '../../types/user';
import Select from 'react-select';
import {
  Bell, Send, FileText, Plus, Edit2, Trash2, Eye, X,
  CheckCircle2, AlertTriangle, Users, Layers, RefreshCw
} from 'lucide-react';
import { useConfirm } from '../../components/common/ConfirmDialog';

const ALL_ROLES: UserRole[] = ['employee', 'supervisor', 'hr', 'manager'];

const ROLE_COLOR: Record<string, string> = {
  employee:   'bg-blue-100 text-blue-700',
  supervisor: 'bg-violet-100 text-violet-700',
  manager:    'bg-amber-100 text-amber-700',
  hr:         'bg-emerald-100 text-emerald-700',
};

const HRNotificationCenter: React.FC = () => {
  const { confirm, Dialog: ConfirmDialogEl } = useConfirm();
  const [activeTab, setActiveTab] = useState<'send' | 'templates'>('send');

  // Templates
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<NotificationTemplate>>({});
  const [tplLoading, setTplLoading] = useState(false);
  const [tplError, setTplError] = useState<string | null>(null);
  const [tplSuccess, setTplSuccess] = useState<string | null>(null);

  // Send
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [sendUserIds, setSendUserIds] = useState<string[]>([]);
  const [sendDepartments, setSendDepartments] = useState<string[]>([]);
  const [sendRoles, setSendRoles] = useState<UserRole[]>([]);
  const [sendTitle, setSendTitle] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendTemplateId, setSendTemplateId] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try { setTemplates(await notificationService.getTemplates()); }
    catch { /* silent */ }
    finally { setTemplatesLoading(false); }
  };

  useEffect(() => {
    loadTemplates();
    userService.getUsers().then(setUsers).catch(() => {});
    userService.getAllDepartments().then(deps => setDepartments(deps || [])).catch(() => {});
  }, []);

  // Template handlers
  const openCreate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', title: '', message: '', type: '', isActive: true });
    setTplError(null); setTplSuccess(null);
    setShowTemplateModal(true);
  };
  const openEdit = (tpl: NotificationTemplate) => {
    setEditingTemplate(tpl);
    setTemplateForm({ ...tpl });
    setTplError(null); setTplSuccess(null);
    setShowTemplateModal(true);
  };
  const closeModal = () => {
    setShowTemplateModal(false); setEditingTemplate(null);
    setTemplateForm({}); setTplError(null); setTplSuccess(null);
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setTemplateForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTplLoading(true); setTplError(null); setTplSuccess(null);
    try {
      if (editingTemplate) {
        await notificationService.updateTemplate(editingTemplate.id, templateForm);
        setTplSuccess('Template updated!');
      } else {
        await notificationService.createTemplate(templateForm as any);
        setTplSuccess('Template created!');
      }
      await loadTemplates();
      setTimeout(closeModal, 1000);
    } catch { setTplError('Failed to save template.'); }
    finally { setTplLoading(false); }
  };
  const handleDeleteTemplate = async (tpl: NotificationTemplate) => {
    const ok = await confirm({ title: 'Delete Template', message: `Are you sure you want to delete "${tpl.name}"? This action cannot be undone.`, confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    setTplLoading(true);
    try {
      await notificationService.deleteTemplate(tpl.id);
      await loadTemplates();
    } catch { setTplError('Failed to delete template.'); }
    finally { setTplLoading(false); }
  };

  // Send notification handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendSuccess(null); setSendError(null);
    if (!sendUserIds.length && !sendDepartments.length && !sendRoles.length) {
      setSendError('Select at least one user, department, or role.');
      return;
    }
    if (!sendTemplateId && (!sendTitle.trim() || !sendMessage.trim())) {
      setSendError('Title and message are required when no template is selected.');
      return;
    }
    setSendLoading(true);
    try {
      let title = sendTitle;
      let message = sendMessage;
      if (sendTemplateId) {
        const tpl = templates.find(t => t.id === sendTemplateId);
        if (tpl) { title = tpl.title; message = tpl.message; }
      }
      await notificationService.sendBulkNotification({
        userIds: sendUserIds, departments: sendDepartments, roles: sendRoles,
        title, message, type: 'info',
        templateName: sendTemplateId ? templates.find(t => t.id === sendTemplateId)?.name : undefined,
        templateVars: {},
      });
      setSendSuccess('Notifications sent successfully!');
      setSendUserIds([]); setSendDepartments([]); setSendRoles([]);
      setSendTitle(''); setSendMessage(''); setSendTemplateId('');
    } catch { setSendError('Failed to send notification.'); }
    finally { setSendLoading(false); }
  };

  // Department options for react-select
  const deptOptions = departments.map((d: any) => ({
    value: typeof d === 'object' ? (d.id || d.name) : d,
    label: typeof d === 'object' ? d.name : d,
  }));

  const selectedTemplate = templates.find(t => t.id === sendTemplateId);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #002e6d 0%, #224f7d 60%, #2b6298 100%)' }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 40%, white 0%, transparent 60%)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Bell size={16} className="text-blue-300" />
              <span className="text-blue-300 text-sm font-medium">HR Admin</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Notification Control Center</h1>
            <p className="text-blue-200 text-sm mt-1">Send notifications and manage reusable message templates</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center"><Layers size={18} className="text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
              <div className="text-xs text-gray-500 font-medium">Total Templates</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center"><CheckCircle2 size={18} className="text-emerald-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{templates.filter(t => t.isActive).length}</div>
              <div className="text-xs text-gray-500 font-medium">Active Templates</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center"><Users size={18} className="text-violet-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
              <div className="text-xs text-gray-500 font-medium">Reachable Users</div>
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {[
              { key: 'send', label: 'Send Notification', icon: <Send size={14} /> },
              { key: 'templates', label: 'Templates', icon: <FileText size={14} /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Send Tab */}
          {activeTab === 'send' && (
            <div className="p-6">
              <form onSubmit={handleSend} className="space-y-5 max-w-2xl">
                {sendSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={15} /> {sendSuccess}
                  </div>
                )}
                {sendError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
                    <AlertTriangle size={15} /> {sendError}
                  </div>
                )}

                {/* Recipients */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipients</p>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Specific Users</label>
                    <Select
                      isMulti
                      options={users.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                      value={users.filter(u => sendUserIds.includes(u.id)).map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                      onChange={opts => setSendUserIds(opts ? opts.map((o: any) => o.value) : [])}
                      placeholder="Search and select users..."
                      classNamePrefix="rs"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Departments</label>
                    <Select
                      isMulti
                      options={deptOptions}
                      value={deptOptions.filter(o => sendDepartments.includes(o.label))}
                      onChange={opts => setSendDepartments(opts ? opts.map((o: any) => o.label) : [])}
                      placeholder="Select departments..."
                      classNamePrefix="rs"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Roles</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_ROLES.map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSendRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${sendRoles.includes(role) ? `${ROLE_COLOR[role]} border-current` : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</p>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Use Template (optional)</label>
                    <select
                      value={sendTemplateId}
                      onChange={e => { setSendTemplateId(e.target.value); if (e.target.value) { setSendTitle(''); setSendMessage(''); } }}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Write custom message —</option>
                      {templates.filter(t => t.isActive).map(tpl => (
                        <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                      ))}
                    </select>
                    {selectedTemplate && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                        <strong>{selectedTemplate.title}</strong>
                        <p className="text-blue-700 mt-0.5 text-xs">{selectedTemplate.message}</p>
                      </div>
                    )}
                  </div>
                  {!sendTemplateId && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Title</label>
                        <input
                          type="text" value={sendTitle} onChange={e => setSendTitle(e.target.value)} required
                          placeholder="Notification title..."
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Message</label>
                        <textarea
                          value={sendMessage} onChange={e => setSendMessage(e.target.value)} required rows={4}
                          placeholder="Write your notification message..."
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="submit" disabled={sendLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <Send size={15} />
                  {sendLoading ? 'Sending…' : 'Send Notification'}
                </button>
              </form>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-900">Notification Templates</h2>
                <div className="flex items-center gap-2">
                  <button onClick={loadTemplates} disabled={templatesLoading} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <RefreshCw size={15} className={templatesLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={openCreate}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Plus size={15} /> New Template
                  </button>
                </div>
              </div>

              {tplError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{tplError}</div>}

              {templatesLoading ? (
                <div className="py-16 text-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" /></div>
              ) : templates.length === 0 ? (
                <div className="py-16 text-center">
                  <FileText size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400 text-sm">No templates yet. Create your first one.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{tpl.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{tpl.type || 'General'}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${tpl.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                          {tpl.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{tpl.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tpl.message}</p>
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                        <button onClick={() => openEdit(tpl)} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors">
                          <Edit2 size={11} /> Edit
                        </button>
                        <button onClick={() => handleDeleteTemplate(tpl)} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editingTemplate ? 'Edit Template' : 'New Template'}</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleTemplateSubmit} className="p-6 space-y-4">
                {tplError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{tplError}</div>}
                {tplSuccess && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">{tplSuccess}</div>}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Template Name *</label>
                  <input name="name" value={templateForm.name || ''} onChange={handleFormChange} required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notification Title *</label>
                  <input name="title" value={templateForm.title || ''} onChange={handleFormChange} required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Type</label>
                  <input name="type" value={templateForm.type || ''} onChange={handleFormChange} placeholder="e.g. reminder, alert, info"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Message *</label>
                  <textarea name="message" value={templateForm.message || ''} onChange={handleFormChange} required rows={4}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none" />
                  <p className="text-xs text-gray-400 mt-1">Use placeholders like <code className="bg-gray-100 px-1 rounded">{'{userName}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{checklistName}'}</code></p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="isActive" checked={!!templateForm.isActive} onChange={handleFormChange} className="rounded" />
                  <span className="text-sm font-medium text-gray-700">Active template</span>
                </label>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={tplLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                    {tplLoading ? 'Saving…' : editingTemplate ? 'Save Changes' : 'Create Template'}
                  </button>
                  <button type="button" onClick={closeModal} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>

              {/* Preview */}
              {editingTemplate && (templateForm.title || templateForm.message) && (
                <div className="mx-6 mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1"><Eye size={11} /> Live Preview</p>
                  <p className="text-sm font-semibold text-gray-900">{templateForm.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{templateForm.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      {ConfirmDialogEl}
    </Layout>
  );
};

export default HRNotificationCenter;