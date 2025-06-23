import React, { useState, useEffect } from 'react';
import surveyService from '../../services/surveyService';

interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  // Add more fields as needed (e.g., questions, status, etc.)
}

interface SurveyQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'rating';
  required: boolean;
  options?: string[];
}

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

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await surveyService.getSurveyTemplates();
      // If API returns { data: [...] }, use res.data
      setTemplates(res.data || res);
    } catch (err: any) {
      setError('Failed to load survey templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const newTemplate = await surveyService.createSurveyTemplate({ name, description });
      setTemplates(prev => [...prev, newTemplate.data || newTemplate]);
      setName('');
      setDescription('');
      setSuccess('Template created successfully.');
    } catch (err: any) {
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
    } catch (err: any) {
      setError('Failed to delete template.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: SurveyTemplate) => {
    setEditingId(template.id);
    setEditName(template.name);
    setEditDescription(template.description);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await surveyService.updateSurveyTemplate(editingId, { name: editName, description: editDescription });
      setTemplates(prev => prev.map(t => t.id === editingId ? (updated.data || updated) : t));
      setEditingId(null);
      setEditName('');
      setEditDescription('');
      setSuccess('Template updated successfully.');
    } catch (err: any) {
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
      setQuestions(res.data || res);
    } catch (err: any) {
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
  const handleAddQuestion = async (e: React.FormEvent) => {
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
      setQuestions(prev => [...prev, newQ.data || newQ]);
      setQuestionText('');
      setQuestionType('text');
      setQuestionRequired(false);
      setQuestionOptions('');
    } catch (err: any) {
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
    } catch (err: any) {
      setQuestionsError('Failed to delete question.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  return (
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
            className="border rounded px-3 py-2 flex-1"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {editingId ? 'Save' : 'Add Template'}
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
          <table className="min-w-full bg-white border rounded">
            <thead>
              <tr>
                <th className="py-3 px-4 border-b text-left font-semibold">Name</th>
                <th className="py-3 px-4 border-b text-left font-semibold">Description</th>
                <th className="py-3 px-4 border-b text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-400">No survey templates found. Add a new template above.</td>
                </tr>
              ) : (
                templates.map(template => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4">{template.name}</td>
                    <td className="py-2 px-4">{template.description}</td>
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => handleEdit(template)}
                        className="text-blue-600 hover:underline mr-4"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:underline mr-4"
                        disabled={loading}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => openQuestionsModal(template)}
                        className="text-green-600 hover:underline"
                        disabled={loading}
                      >
                        Manage Questions
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
                  onChange={e => setQuestionType(e.target.value as any)}
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
    </div>
  );
};

export default SurveyTemplates; 