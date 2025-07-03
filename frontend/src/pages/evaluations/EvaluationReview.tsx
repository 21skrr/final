import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Star, Save, MessageSquare } from 'lucide-react';
import { getEvaluationById, addEmployeeCommentToEvaluation } from '../../services/evaluationService';
import { Evaluation } from '../../types/evaluation';
import feedbackService from '../../services/feedbackService';
import checklistAssignmentService from '../../services/checklistAssignmentService';
import { useAuth } from '../../context/AuthContext';

const EvaluationReview: React.FC = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [employeeComment, setEmployeeComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [checklistHistory, setChecklistHistory] = useState<any[]>([]);
  const { user } = useAuth();
  const [editableCriteria, setEditableCriteria] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        if (id) {
          const response = await getEvaluationById(id);
          setEvaluation(response.data);
          if (user?.role === 'employee' && response.data?.criteria) {
            setEditableCriteria(response.data.criteria.map((c: any) => ({ ...c })));
          }
        }
      } catch (err) {
        setError('Failed to load evaluation');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();

    // Fetch feedback and checklist history for preparation
    const fetchFeedbackAndChecklist = async () => {
      try {
        const feedback = await feedbackService.getMyFeedbackHistory();
        setFeedbackHistory(feedback || []);
      } catch {}
      try {
        const checklists = await checklistAssignmentService.getMyAssignments();
        setChecklistHistory(checklists || []);
      } catch {}
    };
    fetchFeedbackAndChecklist();
  }, [id]);

  const handleCriteriaChange = (idx: number, value: number) => {
    const updated = [...editableCriteria];
    updated[idx].rating = value;
    setEditableCriteria(updated);
  };

  const handleAcknowledgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      if (id) {
        if (user?.role === 'employee') {
          await addEmployeeCommentToEvaluation(id, employeeComment, editableCriteria);
        } else if (employeeComment) {
          await addEmployeeCommentToEvaluation(id, employeeComment);
        } else {
          setSaveSuccess(true);
        }
        setSaveSuccess(true);
      }
    } catch (err) {
      setSaveError('Failed to save acknowledgment or comment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;
  if (!evaluation) return <Layout><div>No evaluation found.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-blue-600">
            <h3 className="text-lg leading-6 font-medium text-white">
              Evaluation Review
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-blue-100">
              {evaluation.evaluationType} for {evaluation.employeeName}
            </p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <form onSubmit={handleAcknowledgeSubmit} className="grid grid-cols-1 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Performance Categories</h3>
                  <div className="mt-4 space-y-4">
                    {(user?.role === 'employee' ? editableCriteria : evaluation.criteria).map((category, idx) => (
                      <div key={category.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-medium text-gray-700">
                            {category.name}
                          </label>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-5 w-5 ${star <= (category.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={category.rating || 1}
                          onChange={e => user?.role === 'employee' && handleCriteriaChange(idx, Number(e.target.value))}
                          className="w-full"
                          disabled={user?.role !== 'employee'}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Comments
                  </label>
                  <div className="mt-1">
                    <textarea
                      rows={4}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Add your feedback here..."
                      value={employeeComment}
                      onChange={e => setEmployeeComment(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Development Goals
                  </label>
                  <div className="mt-1">
                    <textarea
                      rows={3}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Set development goals..."
                    />
                  </div>
                </div>

                <div className="flex items-center mt-4">
                  <input
                    id="acknowledge"
                    type="checkbox"
                    checked={acknowledged}
                    onChange={e => setAcknowledged(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="acknowledge" className="ml-2 block text-sm text-gray-700">
                    I have read and understood this evaluation
                  </label>
                </div>
                {saveError && <div className="text-red-500">{saveError}</div>}
                {saveSuccess && <div className="text-green-600">Acknowledgment and comment saved!</div>}
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Acknowledge & Comment'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Preparation Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gray-100 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Prepare for Your Evaluation</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Recent Feedback</h4>
              {feedbackHistory.length === 0 ? (
                <div className="text-gray-500 text-sm">No feedback found.</div>
              ) : (
                <ul className="space-y-2">
                  {feedbackHistory.slice(0, 3).map((item: any) => (
                    <li key={item.id} className="bg-blue-50 rounded p-2 text-sm">
                      <span className="font-semibold">{item.type === 'received' ? `From: ${item.from?.name || item.from}` : `To: ${item.to?.name || item.to}`}</span>
                      <span className="ml-2 text-xs text-gray-500">{item.date || item.createdAt}</span>
                      <div>{item.message}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Checklist Progress</h4>
              {checklistHistory.length === 0 ? (
                <div className="text-gray-500 text-sm">No checklists found.</div>
              ) : (
                <ul className="space-y-2">
                  {checklistHistory.slice(0, 3).map((assignment: any) => (
                    <li key={assignment.id} className="bg-green-50 rounded p-2 text-sm">
                      <span className="font-semibold">{assignment.checklist?.title || 'Checklist'}</span>
                      <span className="ml-2 text-xs text-gray-500">Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}</span>
                      <div>Completion: {assignment.completionPercentage}%</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Coaching/Status Integration for Manager */}
        {user?.role === 'manager' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Coaching & Status Actions</h3>
            <p className="text-sm text-yellow-700 mb-2">Use this evaluation to support coaching or status changes for the employee.</p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => window.location.href = `/coaching?employeeId=${evaluation.employeeId}`}
              >
                View Coaching History
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => window.location.href = `/admin/employees/${evaluation.employeeId}/status`}
              >
                Change Employee Status
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EvaluationReview;