import React, { useState, useEffect } from 'react';
import surveyService from '../../services/surveyService';
import Modal from 'antd/es/modal';
import DatePicker from 'antd/es/date-picker';
import Select from 'antd/es/select';
import Layout from '../../components/layout/Layout';
import {
  Plus, Edit2, Trash2, HelpCircle, Calendar, CheckCircle2,
  X, AlertTriangle, FileText, Search, ChevronDown, Clock,
  Tag, Send
} from 'lucide-react';
import { useConfirm } from '../../components/common/ConfirmDialog';

interface SurveyTemplate {
  id: string;
  name?: string;
  title?: string;
  description: string;
  status?: 'draft' | 'active' | 'completed';
  type?: string;
}

interface SurveyQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'rating';
  required: boolean;
  options?: string[];
}

interface Department { id: string; name: string; }
interface Program { id: string; title?: string; name?: string; }
interface Employee { id: string; name: string; email?: string; role: string; }

const TYPE_COLOR: Record<string, string> = {
  'general':  'bg-emerald-100 text-emerald-700 border-emerald-200',
  '3-month':  'bg-violet-100 text-violet-700 border-violet-200',
  '6-month':  'bg-blue-100 text-blue-700 border-blue-200',
  '12-month': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'training': 'bg-amber-100 text-amber-700 border-amber-200',
};

const STATUS_COLOR: Record<string, { cls: string; label: string }> = {
  active:    { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Active' },
  draft:     { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Draft' },
  completed: { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Completed' },
};

const QTYPE_LABEL: Record<string, string> = { text: 'Text', multiple_choice: 'Multiple Choice', rating: 'Rating' };

const SurveyTemplates: React.FC = () => {
  const { confirm, Dialog: ConfirmDialogEl } = useConfirm();
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'general' | '3-month' | '6-month' | '12-month' | 'training'>('general');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Questions modal
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<SurveyTemplate | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'text' | 'multiple_choice' | 'rating'>('text');
  const [questionRequired, setQuestionRequired] = useState(false);
  const [questionOptions, setQuestionOptions] = useState('');
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTemplate, setScheduleTemplate] = useState<SurveyTemplate | null>(null);
  const [scheduleType, setScheduleType] = useState('one-time');
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await surveyService.getSurveyTemplates();
      if (Array.isArray(res)) setTemplates(res);
      else if (res && Array.isArray((res as any).data)) setTemplates((res as any).data);
      else setTemplates([]);
    } catch { setError('Failed to load survey templates.'); }
    finally { setLoading(false); }
  };

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(null), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); }
  };

  const handleAddTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const payload = { title: name, description, type, questions: [{ question: 'Sample question?', type: 'text', required: true }] };
      const newT = await surveyService.createSurveyTemplate(payload);
      const t = (newT as any).data || newT;
      setTemplates(prev => [...prev, t]);
      setName(''); setDescription(''); setType('general');
      setShowCreateForm(false);
      showMsg('Template created successfully.');
    } catch { showMsg('Failed to create template.', true); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    const t = templates.find(x => x.id === id);
    const ok = await confirm({ title: 'Delete Template', message: `Delete "${t?.title || t?.name || 'this template'}" permanently? This cannot be undone.`, confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    setLoading(true);
    try {
      await surveyService.deleteSurveyTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      showMsg('Template deleted.');
    } catch { showMsg('Failed to delete template.', true); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    setLoading(true);
    try {
      const updated = await surveyService.updateSurveyTemplate(editingId, { name: editName, description: editDescription });
      const u = (updated as any).data || updated;
      setTemplates(prev => prev.map(t => t.id === editingId ? u : t));
      setEditingId(null);
      showMsg('Template updated.');
    } catch { showMsg('Failed to update template.', true); }
    finally { setLoading(false); }
  };

  const openQuestionsModal = async (template: SurveyTemplate) => {
    setActiveTemplate(template);
    setShowQuestionsModal(true);
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const res = await surveyService.getSurveyTemplateQuestions(template.id);
      if (Array.isArray(res)) setQuestions(res);
      else if (res && Array.isArray((res as any).data)) setQuestions((res as any).data);
      else setQuestions([]);
    } catch { setQuestionsError('Failed to load questions.'); setQuestions([]); }
    finally { setQuestionsLoading(false); }
  };

  const closeQuestionsModal = () => {
    setShowQuestionsModal(false); setActiveTemplate(null); setQuestions([]);
    setQuestionText(''); setQuestionType('text'); setQuestionRequired(false);
    setQuestionOptions(''); setQuestionsError(null);
  };

  const handleAddQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!questionText.trim() || !activeTemplate) return;
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const newQ = await surveyService.createSurveyTemplateQuestion(activeTemplate.id, {
        question: questionText, type: questionType, required: questionRequired,
        options: questionType === 'multiple_choice' ? questionOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      });
      const q = (newQ as any).data || newQ;
      setQuestions(prev => [...prev, q]);
      setQuestionText(''); setQuestionType('text'); setQuestionRequired(false); setQuestionOptions('');
    } catch { setQuestionsError('Failed to add question.'); }
    finally { setQuestionsLoading(false); }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!activeTemplate) return;
    setQuestionsLoading(true);
    try {
      await surveyService.deleteSurveyTemplateQuestion(activeTemplate.id, id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch { setQuestionsError('Failed to delete question.'); }
    finally { setQuestionsLoading(false); }
  };

  useEffect(() => {
    if (showScheduleModal) {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      fetch('http://localhost:5000/api/users/departments/all', { credentials: 'include', headers })
        .then(r => r.json()).then(setDepartments).catch(() => setDepartments([]));
      fetch('http://localhost:5000/api/programs', { credentials: 'include', headers })
        .then(r => r.json()).then(setPrograms).catch(() => setPrograms([]));
      fetch('http://localhost:5000/api/users', { credentials: 'include', headers })
        .then(r => r.json()).then(setEmployees).catch(() => setEmployees([]));
    }
  }, [showScheduleModal]);

  const openScheduleModal = (template: SurveyTemplate) => {
    setScheduleTemplate(template); setShowScheduleModal(true);
    setScheduleType('one-time'); setScheduleDate(null);
    setSelectedDepartments([]); setSelectedPrograms([]); setSelectedEmployees([]);
    setScheduleError(''); setScheduleSuccess('');
  };

  const handleScheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setScheduleLoading(true); setScheduleError(''); setScheduleSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/surveys/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({
          surveyId: scheduleTemplate?.id || '',
          scheduleType,
          targetDate: scheduleDate ? (scheduleDate as any).toISOString?.() || scheduleDate : null,
          targetDepartments: selectedDepartments,
          targetPrograms: selectedPrograms,
          targetEmployeeIds: selectedEmployees,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setScheduleSuccess('Survey scheduled successfully!');
      setTimeout(() => setShowScheduleModal(false), 1200);
    } catch { setScheduleError('An error occurred. Please try again.'); }
    finally { setScheduleLoading(false); }
  };

  const handleStatusChange = async (id: string, newStatus: 'draft' | 'active') => {
    setLoading(true);
    try {
      const qRes = await surveyService.getSurveyTemplateQuestions(id);
      const qs = Array.isArray(qRes) ? qRes : ((qRes as any).data || []);
      const template = templates.find(t => t.id === id);
      if (!template) throw new Error();
      await surveyService.updateSurveyTemplate(id, {
        title: template.title || template.name,
        description: template.description,
        type: template.type || 'general',
        questions: qs,
        status: newStatus,
      });
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      showMsg('Status updated.');
    } catch { showMsg('Failed to update status.', true); }
    finally { setLoading(false); }
  };

  const filtered = templates.filter(t =>
    ((t.title || t.name) || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #002e6d 0%, #224f7d 60%, #2b6298 100%)' }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 40%, white 0%, transparent 60%)' }} />
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className="text-blue-300" />
                <span className="text-blue-300 text-sm font-medium">HR Admin</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Survey Templates</h1>
              <p className="text-blue-200 text-sm mt-1">{templates.length} template{templates.length !== 1 ? 's' : ''} · Create, manage and schedule surveys</p>
            </div>
            <button
              onClick={() => { setShowCreateForm(f => !f); setEditingId(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all shadow-sm"
            >
              <Plus size={16} /> New Template
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3.5 rounded-2xl flex items-center gap-3 text-sm"><AlertTriangle size={16} />{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3.5 rounded-2xl flex items-center gap-3 text-sm"><CheckCircle2 size={16} />{success}</div>}

        {/* Create Form */}
        {showCreateForm && !editingId && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><Plus size={16} className="text-blue-600" /> Create New Template</h2>
            <form onSubmit={handleAddTemplate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text" placeholder="Template Name *" value={name}
                onChange={e => setName(e.target.value)} required disabled={loading}
                className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <input
                type="text" placeholder="Description" value={description}
                onChange={e => setDescription(e.target.value)} disabled={loading}
                className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <div className="relative">
                <select
                  value={type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as typeof type)}
                  className="w-full appearance-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="general">General</option>
                  <option value="3-month">3-Month</option>
                  <option value="6-month">6-Month</option>
                  <option value="12-month">12-Month</option>
                  <option value="training">Training</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold py-2.5 transition-colors disabled:opacity-50">
                  {loading ? 'Creating…' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Form */}
        {editingId && (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><Edit2 size={16} className="text-blue-600" /> Edit Template</h2>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text" placeholder="Template Name *" value={editName}
                onChange={e => setEditName(e.target.value)} required disabled={loading}
                className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <input
                type="text" placeholder="Description" value={editDescription}
                onChange={e => setEditDescription(e.target.value)} disabled={loading}
                className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold py-2.5 transition-colors disabled:opacity-50">
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Search */}
          <div className="p-5 border-b border-gray-100">
            <div className="relative max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Template', 'Type', 'Description', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={5} className="py-16 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading templates...</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-16 text-center">
                    <FileText size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-400 text-sm">{search ? `No results for "${search}"` : 'No templates yet. Create your first one above.'}</p>
                  </td></tr>
                ) : filtered.map(t => {
                  const status = t.status || 'draft';
                  const sc = STATUS_COLOR[status] || STATUS_COLOR.draft;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">{t.title || t.name}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLOR[t.type || 'general'] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {t.type || 'general'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 max-w-xs truncate">{t.description || '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="relative inline-block">
                          <select
                            value={status}
                            onChange={e => handleStatusChange(t.id, e.target.value as 'draft' | 'active')}
                            disabled={loading}
                            className={`appearance-none pl-2.5 pr-6 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${sc.cls}`}
                          >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { setEditingId(t.id); setEditName(t.title || t.name || ''); setEditDescription(t.description); setShowCreateForm(false); }}
                            title="Edit"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => openQuestionsModal(t)}
                            title="Manage Questions"
                            className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          >
                            <HelpCircle size={14} />
                          </button>
                          <button
                            onClick={() => openScheduleModal(t)}
                            title="Schedule"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Send size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            title="Delete"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Questions Modal */}
        {showQuestionsModal && activeTemplate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Manage Questions</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{activeTemplate.title || activeTemplate.name}</p>
                </div>
                <button onClick={closeQuestionsModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1"><X size={20} /></button>
              </div>

              {/* Add Question Form */}
              <div className="p-6 border-b border-gray-100 flex-shrink-0 bg-gray-50">
                <form onSubmit={handleAddQuestion} className="space-y-3">
                  <div className="flex gap-3 flex-wrap">
                    <input
                      type="text" placeholder="Question text *" value={questionText}
                      onChange={e => setQuestionText(e.target.value)} required
                      className="flex-1 min-w-[200px] px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="relative">
                      <select
                        value={questionType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setQuestionType(e.target.value as typeof questionType)}
                        className="appearance-none pl-3 pr-7 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="text">Text</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="rating">Rating</option>
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  {questionType === 'multiple_choice' && (
                    <input
                      type="text" placeholder="Options (comma separated: Yes, No, Maybe)"
                      value={questionOptions} onChange={e => setQuestionOptions(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={questionRequired} onChange={e => setQuestionRequired(e.target.checked)} className="rounded" />
                      Required question
                    </label>
                    <button type="submit" disabled={questionsLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                      {questionsLoading ? 'Adding…' : 'Add Question'}
                    </button>
                  </div>
                </form>
                {questionsError && <div className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={13} />{questionsError}</div>}
              </div>

              {/* Questions List */}
              <div className="overflow-y-auto flex-1 p-6">
                {questionsLoading ? (
                  <div className="text-center text-gray-400 py-8">Loading questions...</div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-12">
                    <HelpCircle size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-400 text-sm">No questions yet. Add your first question above.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{q.question}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{QTYPE_LABEL[q.type]}</span>
                            {q.required && <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-full">Required</span>}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal (Ant Design) */}
        {showScheduleModal && scheduleTemplate && (
          <Modal
            open={showScheduleModal}
            onCancel={() => setShowScheduleModal(false)}
            title={<span className="font-semibold">Schedule: {scheduleTemplate.title || scheduleTemplate.name}</span>}
            footer={null}
            destroyOnClose
          >
            <form onSubmit={handleScheduleSubmit} className="flex flex-col gap-4 pt-2">
              {scheduleError && <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{scheduleError}</div>}
              {scheduleSuccess && <div className="text-emerald-600 text-sm bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">{scheduleSuccess}</div>}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Schedule Type</label>
                <Select value={scheduleType} onChange={setScheduleType}
                  options={[{ value: 'one-time', label: 'One-Time' }, { value: 'recurring', label: 'Recurring' }]}
                  style={{ width: '100%' }} disabled={scheduleLoading} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Date & Time</label>
                <DatePicker showTime value={scheduleDate as any} onChange={setScheduleDate as any}
                  style={{ width: '100%' }} disabled={scheduleLoading} format="YYYY-MM-DD HH:mm" placeholder="Select date and time" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Departments</label>
                <Select mode="multiple" value={selectedDepartments} onChange={setSelectedDepartments}
                  options={departments.map(d => ({ value: d.id, label: d.name }))}
                  style={{ width: '100%' }} placeholder="All departments (optional)" disabled={scheduleLoading} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Programs</label>
                <Select mode="multiple" value={selectedPrograms} onChange={setSelectedPrograms}
                  options={programs.map(p => ({ value: p.id, label: p.title || p.name || '' }))}
                  style={{ width: '100%' }} placeholder="All programs (optional)" disabled={scheduleLoading} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Specific Employees</label>
                <Select mode="multiple" value={selectedEmployees} onChange={setSelectedEmployees}
                  options={Array.isArray(employees) ? employees.filter(e => e.role === 'employee').map(e => ({ value: e.id, label: `${e.name}${e.email ? ` (${e.email})` : ''}` })) : []}
                  style={{ width: '100%' }} placeholder="Select employees (optional)" disabled={scheduleLoading} />
              </div>
              <button type="submit" disabled={scheduleLoading || !scheduleDate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                {scheduleLoading ? 'Scheduling…' : 'Schedule Survey'}
              </button>
            </form>
          </Modal>
        )}
      </div>
      {ConfirmDialogEl}
    </Layout>
  );
};

export default SurveyTemplates;