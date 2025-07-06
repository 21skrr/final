import React, { useState, useEffect } from 'react';
import surveyService from '../../services/surveyService';
import Modal from 'antd/es/modal';
import DatePicker from 'antd/es/date-picker';
import Select from 'antd/es/select';
import Layout from '../../components/layout/Layout';

interface SurveyTemplate {
  id: string;
  name?: string;
  title?: string;
  description: string;
  status?: 'draft' | 'active' | 'completed';
  type?: string;
  // Add more fields as needed (e.g., questions, status, etc.)
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

const SurveyTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Question management modal state
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<SurveyTemplate | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'text' | 'multiple_choice' | 'rating'>('text');
  const [questionRequired, setQuestionRequired] = useState(false);
  const [questionOptions, setQuestionOptions] = useState('');
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [type, setType] = useState<'general' | '3-month' | '6-month' | '12-month' | 'training'>('general');

  // Add state for scheduling modal and form
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

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await surveyService.getSurveyTemplates();
      if (Array.isArray(res)) {
        setTemplates(res);
      } else if (res && Array.isArray((res as { data?: unknown }).data)) {
        setTemplates((res as { data: SurveyTemplate[] }).data);
      } else {
        setTemplates([]);
      }
    } catch {
      setError('Failed to load survey templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        title: name,
        description,
        type,
        questions: [
          {
            question: 'Sample question?',
            type: 'text',
            required: true
          }
        ]
      };
      const newTemplate = await surveyService.createSurveyTemplate(payload);
      if (newTemplate && (newTemplate as { data?: unknown }).data) {
        setTemplates(prev => [...prev, (newTemplate as { data: SurveyTemplate }).data]);
      } else {
        setTemplates(prev => [...prev, newTemplate as SurveyTemplate]);
      }
      setName('');
      setDescription('');
      setType('general');
      setSuccess('Template created successfully.');
    } catch {
      setError('Failed to create template.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await surveyService.deleteSurveyTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      setSuccess('Template deleted successfully.');
    } catch {
      setError('Failed to delete template.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: SurveyTemplate) => {
    setEditingId(template.id);
    setEditName(template.name || '');
    setEditDescription(template.description);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await surveyService.updateSurveyTemplate(editingId, { name: editName, description: editDescription });
      if (updated && (updated as { data?: unknown }).data) {
        setTemplates(prev => prev.map(t => t.id === editingId ? (updated as { data: SurveyTemplate }).data : t));
      } else {
        setTemplates(prev => prev.map(t => t.id === editingId ? (updated as SurveyTemplate) : t));
      }
      setEditingId(null);
      setEditName('');
      setEditDescription('');
      setSuccess('Template updated successfully.');
    } catch {
      setError('Failed to update template.');
    } finally {
      setLoading(false);
    }
  };

  // Question management handlers (API connected)
  const openQuestionsModal = async (template: SurveyTemplate) => {
    setActiveTemplate(template);
    setShowQuestionsModal(true);
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const res = await surveyService.getSurveyTemplateQuestions(template.id);
      if (Array.isArray(res)) {
        setQuestions(res);
      } else if (res && Array.isArray((res as { data?: unknown }).data)) {
        setQuestions((res as { data: SurveyQuestion[] }).data);
      } else {
        setQuestions([]);
      }
    } catch {
      setQuestionsError('Failed to load questions.');
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };
  const closeQuestionsModal = () => {
    setShowQuestionsModal(false);
    setActiveTemplate(null);
    setQuestions([]);
    setQuestionText('');
    setQuestionType('text');
    setQuestionRequired(false);
    setQuestionOptions('');
    setQuestionsError(null);
  };
  const handleAddQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!questionText.trim() || !activeTemplate) return;
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const newQ = await surveyService.createSurveyTemplateQuestion(activeTemplate.id, {
        question: questionText,
        type: questionType,
        required: questionRequired,
        options: questionType === 'multiple_choice' ? questionOptions.split(',').map(opt => opt.trim()).filter(Boolean) : undefined,
      });
      if (newQ && (newQ as { data?: unknown }).data) {
        setQuestions(prev => [...prev, (newQ as { data: SurveyQuestion }).data]);
      } else {
        setQuestions(prev => [...prev, newQ as SurveyQuestion]);
      }
      setQuestionText('');
      setQuestionType('text');
      setQuestionRequired(false);
      setQuestionOptions('');
    } catch {
      setQuestionsError('Failed to add question.');
    } finally {
      setQuestionsLoading(false);
    }
  };
  const handleDeleteQuestion = async (id: string) => {
    if (!activeTemplate) return;
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      await surveyService.deleteSurveyTemplateQuestion(activeTemplate.id, id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch {
      setQuestionsError('Failed to delete question.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Fetch departments and programs when modal opens
  useEffect(() => {
    if (showScheduleModal) {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      fetch('http://localhost:5000/api/users/departments/all', {
        credentials: 'include',
        headers
      })
        .then(res => res.json())
        .then(setDepartments)
        .catch(() => setDepartments([]));
      fetch('http://localhost:5000/api/programs', {
        credentials: 'include',
        headers
      })
        .then(res => res.json())
        .then(setPrograms)
        .catch(() => setPrograms([]));
      fetch('http://localhost:5000/api/users', {
        credentials: 'include',
        headers
      })
        .then(res => res.json())
        .then(setEmployees)
        .catch(() => setEmployees([]));
    }
  }, [showScheduleModal]);

  // Add handler to open schedule modal
  const openScheduleModal = (template: SurveyTemplate) => {
    setScheduleTemplate(template);
    setShowScheduleModal(true);
    setScheduleType('one-time');
    setScheduleDate(null);
    setSelectedDepartments([]);
    setSelectedPrograms([]);
    setSelectedEmployees([]);
    setScheduleError('');
    setScheduleSuccess('');
  };
  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setScheduleTemplate(null);
  };

  // Add handler to submit schedule
  const handleScheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setScheduleLoading(true);
    setScheduleError('');
    setScheduleSuccess('');
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch('http://localhost:5000/api/surveys/schedule', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          surveyId: scheduleTemplate ? scheduleTemplate.id : '',
          scheduleType,
          targetDate: scheduleDate ? scheduleDate.toISOString() : null,
          targetDepartments: selectedDepartments,
          targetPrograms: selectedPrograms,
          targetEmployeeIds: selectedEmployees,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to schedule survey');
      setScheduleSuccess('Survey scheduled successfully!');
      setTimeout(() => {
        setShowScheduleModal(false);
      }, 1200);
    } catch {
      setScheduleError('An unknown error occurred.');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'draft' | 'active') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const questionsRes = await surveyService.getSurveyTemplateQuestions(id);
      const questions = Array.isArray(questionsRes)
        ? questionsRes
        : (questionsRes && Array.isArray((questionsRes as { data?: unknown }).data) ? (questionsRes as { data: SurveyQuestion[] }).data : []);
      // Fetch the template itself to get title, description, type, etc.
      const template = templates.find(t => t.id === id);
      if (!template) throw new Error('Template not found');
      // Compose full payload
      const payload = {
        title: template.title || template.name,
        description: template.description,
        type: template.type || 'general',
        questions,
        status: newStatus
      };
      await surveyService.updateSurveyTemplate(id, payload);
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      setSuccess('Status updated successfully.');
    } catch {
      setError('Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-6">Survey Templates</h1>
          {error && <div className="mb-4 text-red-600">{error}</div>}
          {success && <div className="mb-4 text-green-600">{success}</div>}
          <form onSubmit={editingId ? handleUpdate : handleAddTemplate} className="flex flex-col md:flex-row gap-4 mb-8">
            <input
              type="text"
              placeholder="Template Name"
              value={editingId ? editName : name}
              onChange={e => editingId ? setEditName(e.target.value) : setName(e.target.value)}
              required
              className="border rounded px-3 py-2 flex-1"
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Description"
              value={editingId ? editDescription : description}
              onChange={e => editingId ? setEditDescription(e.target.value) : setDescription(e.target.value)}
              required
              className="border rounded px-3 py-2 flex-1"
              disabled={loading}
            />
            <select
              value={type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as typeof type)}
              className="border rounded px-3 py-2 flex-1"
              disabled={loading}
            >
              <option value="general">General</option>
              <option value="3-month">3-Month</option>
              <option value="6-month">6-Month</option>
              <option value="12-month">12-Month</option>
              <option value="training">Training</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {editingId ? 'Update' : 'Add Template'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </form>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded shadow">
              <thead>
                <tr>
                  <th className="py-3 px-4 border-b text-left font-semibold bg-gray-50">Name</th>
                  <th className="py-3 px-4 border-b text-left font-semibold bg-gray-50">Description</th>
                  <th className="py-3 px-4 border-b text-left font-semibold bg-gray-50">Status</th>
                  <th className="py-3 px-4 border-b text-center font-semibold bg-gray-50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">Loading...</td></tr>
                ) : templates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">No survey templates found. Add a new template above.</td>
                  </tr>
                ) : (
                  templates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50 transition">
                      <td className="py-2 px-4 font-medium text-gray-900">{template.title || template.name}</td>
                      <td className="py-2 px-4 text-gray-700">{template.description}</td>
                      <td className="py-2 px-4 text-center">
                        <select
                          value={template.status || 'draft'}
                          onChange={e => handleStatusChange(template.id, e.target.value as 'draft' | 'active')}
                          className="border rounded px-2 py-1"
                          disabled={loading}
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                        </select>
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          className="text-blue-600 hover:underline mr-4"
                          onClick={() => handleEdit(template)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:underline mr-4"
                          onClick={() => handleDelete(template.id)}
                        >
                          Delete
                        </button>
                        <button
                          className="text-green-600 hover:underline"
                          onClick={() => openQuestionsModal(template)}
                        >
                          Manage Questions
                        </button>
                        <button
                          className="text-purple-600 hover:underline mr-4"
                          onClick={() => openScheduleModal(template)}
                        >
                          Schedule
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Questions Modal */}
        {showQuestionsModal && activeTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={closeQuestionsModal}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4">Manage Questions for: {activeTemplate.name}</h2>
              {questionsLoading ? (
                <div className="text-center text-gray-400">Loading questions...</div>
              ) : questionsError ? (
                <div className="text-center text-red-600">{questionsError}</div>
              ) : (
                <form onSubmit={handleAddQuestion} className="flex flex-col md:flex-row gap-4 mb-6 w-full">
                  <input
                    type="text"
                    placeholder="Question text"
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                    className="border rounded px-3 py-2 flex-1 min-w-0"
                    required
                  />
                  <select
                    value={questionType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setQuestionType(e.target.value as typeof questionType)}
                    className="border rounded px-3 py-2 min-w-[120px]"
                  >
                    <option value="text">Text</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="rating">Rating</option>
                  </select>
                  {questionType === 'multiple_choice' && (
                    <input
                      type="text"
                      placeholder="Options (comma separated)"
                      value={questionOptions}
                      onChange={e => setQuestionOptions(e.target.value)}
                      className="border rounded px-3 py-2 flex-1 min-w-0"
                    />
                  )}
                  <label className="flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={questionRequired}
                      onChange={e => setQuestionRequired(e.target.checked)}
                    />
                    Required
                  </label>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition whitespace-nowrap"
                  >
                    Add
                  </button>
                </form>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b text-left font-semibold">Question</th>
                      <th className="py-2 px-4 border-b text-left font-semibold">Type</th>
                      <th className="py-2 px-4 border-b text-center font-semibold">Required</th>
                      <th className="py-2 px-4 border-b text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-400">No questions yet.</td>
                      </tr>
                    ) : (
                      questions.map(q => (
                        <tr key={q.id}>
                          <td className="py-2 px-4">{q.question}</td>
                          <td className="py-2 px-4">{q.type}</td>
                          <td className="py-2 px-4 text-center">{q.required ? 'Yes' : 'No'}</td>
                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Schedule Modal */}
        {showScheduleModal && scheduleTemplate && (
          <Modal
            open={showScheduleModal}
            onCancel={closeScheduleModal}
            title={`Schedule Survey: ${scheduleTemplate.title || scheduleTemplate.name}`}
            footer={null}
            destroyOnClose
          >
            <form onSubmit={handleScheduleSubmit} className="flex flex-col gap-4">
              {scheduleError && <div className="text-red-600">{scheduleError}</div>}
              {scheduleSuccess && <div className="text-green-600">{scheduleSuccess}</div>}
              <label className="font-medium">Schedule Type</label>
              <Select
                value={scheduleType}
                onChange={setScheduleType}
                options={[{ value: 'one-time', label: 'One-Time' }, { value: 'recurring', label: 'Recurring' }]}
                style={{ width: '100%' }}
                disabled={scheduleLoading}
              />
              <label className="font-medium">Date</label>
              <DatePicker
                showTime
                value={scheduleDate}
                onChange={setScheduleDate}
                style={{ width: '100%' }}
                disabled={scheduleLoading}
                format="YYYY-MM-DD HH:mm"
                placeholder="Select date and time"
              />
              <label className="font-medium">Departments</label>
              <Select
                mode="multiple"
                value={selectedDepartments}
                onChange={setSelectedDepartments}
                options={departments.map(d => ({ value: d.id, label: d.name }))}
                style={{ width: '100%' }}
                placeholder="Select departments (optional)"
                disabled={scheduleLoading}
              />
              <label className="font-medium">Programs</label>
              <Select
                mode="multiple"
                value={selectedPrograms}
                onChange={setSelectedPrograms}
                options={programs.map(p => ({ value: p.id, label: p.title || p.name || '' }))}
                style={{ width: '100%' }}
                placeholder="Select programs (optional)"
                disabled={scheduleLoading}
              />
              <label className="font-medium">Employees</label>
              <Select
                mode="multiple"
                value={selectedEmployees}
                onChange={setSelectedEmployees}
                options={Array.isArray(employees) ? employees.filter(e => e.role === 'employee').map(e => ({ value: e.id, label: e.name + (e.email ? ` (${e.email})` : '') })) : []}
                style={{ width: '100%' }}
                placeholder="Select employees (optional)"
                disabled={scheduleLoading}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mt-2"
                disabled={scheduleLoading || !scheduleDate}
              >
                {scheduleLoading ? 'Scheduling...' : 'Schedule Survey'}
              </button>
            </form>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default SurveyTemplates; 