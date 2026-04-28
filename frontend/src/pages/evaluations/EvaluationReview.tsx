import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import {
  Star,
  Save,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Tag,
  MessageSquare,
  ArrowLeft,
  ClipboardList,
  TrendingUp,
  Award,
  ChevronRight,
} from 'lucide-react';
import { getEvaluationById, addEmployeeCommentToEvaluation } from '../../services/evaluationService';
import { Evaluation } from '../../types/evaluation';
import feedbackService from '../../services/feedbackService';
import checklistAssignmentService from '../../services/checklistAssignmentService';
import { useAuth } from '../../context/AuthContext';

/* ─── helpers ─────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    icon: <Clock className="h-5 w-5 text-yellow-500" />,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: <ClipboardList className="h-5 w-5 text-blue-500" />,
  },
  completed: {
    label: 'Completed – Awaiting Manager Validation',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    icon: <CheckCircle className="h-5 w-5 text-purple-500" />,
  },
  validated: {
    label: 'Validated',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: <Award className="h-5 w-5 text-emerald-500" />,
  },
};

function StarDisplay({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444';
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>
          {pct}%
        </text>
      </svg>
      <span className="text-xs text-gray-500 mt-1">Overall Score</span>
    </div>
  );
}

/* ─── main component ──────────────────────────────────── */

const EvaluationReview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // acknowledge flow
  const [acknowledged, setAcknowledged] = useState(false);
  const [employeeComment, setEmployeeComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  // prep panel
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [checklistHistory, setChecklistHistory] = useState<any[]>([]);

  const isEmployee = user?.role === 'employee';
  const isSupervisor = user?.role === 'supervisor';
  const isManager = user?.role === 'manager';

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        if (id) {
          const response = await getEvaluationById(id);
          setEvaluation(response.data);
          if (response.data?.employeeComment) setHasAcknowledged(true);
        }
      } catch {
        setError('Failed to load evaluation');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();

    const fetchPrep = async () => {
      try {
        const fb = await feedbackService.getMyFeedbackHistory();
        setFeedbackHistory(fb || []);
      } catch {}
      try {
        const cl = await checklistAssignmentService.getMyAssignments();
        setChecklistHistory(cl || []);
      } catch {}
    };
    fetchPrep();
  }, [id]);

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) {
      setSaveError('Please check the acknowledgment box to confirm you have read this evaluation.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (id) {
        await addEmployeeCommentToEvaluation(id, employeeComment, []);
        setHasAcknowledged(true);
        setSaveSuccess(true);
        setTimeout(() => navigate('/evaluations'), 1400);
      }
    } catch {
      setSaveError('Failed to save acknowledgment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── loading / error states ── */
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading evaluation…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !evaluation) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto mt-16 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{error || 'Evaluation not found'}</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </button>
        </div>
      </Layout>
    );
  }

  const status = STATUS_CONFIG[evaluation.status] ?? STATUS_CONFIG['pending'];
  const avgRating =
    evaluation.criteria && evaluation.criteria.length > 0
      ? evaluation.criteria.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) / evaluation.criteria.length
      : 0;

  const canAcknowledge =
    isEmployee && (evaluation.status === 'completed' || evaluation.status === 'validated') && !hasAcknowledged;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">

        {/* ── Back button ── */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Evaluations
          </button>
        </div>

        {/* ── Hero Header ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                    Evaluation
                  </span>
                  <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 capitalize">
                    {evaluation.type || evaluation.evaluationType || 'Standard'}
                  </span>
                </div>
                <h1 className="text-2xl font-bold">{evaluation.title || `${evaluation.type || ''} Evaluation`}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-blue-100">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {evaluation.employeeName || evaluation.employee?.name || 'Employee'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    Evaluator: {evaluation.supervisor?.name || 'N/A'}
                  </span>
                  {evaluation.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {new Date(evaluation.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Score gauge */}
              {evaluation.score != null && (
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm flex-shrink-0">
                  <ScoreGauge score={evaluation.score} />
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className={`flex items-center gap-2 px-6 py-3 border-t ${status.bg}`}>
            {status.icon}
            <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
            {evaluation.completedAt && (
              <span className="ml-auto text-xs text-gray-400">
                Completed {new Date(evaluation.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* ── Performance Summary (avg star) ── */}
        {evaluation.criteria && evaluation.criteria.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Performance Summary
              </h2>
              <div className="flex items-center gap-2">
                <StarDisplay rating={avgRating} />
                <span className="text-sm text-gray-500">({avgRating.toFixed(1)}/5 avg)</span>
              </div>
            </div>

            {/* Progress bars per criterion */}
            <div className="grid gap-3">
              {evaluation.criteria.map((c: any, idx: number) => {
                const pct = ((c.rating || 0) / 5) * 100;
                const barColor =
                  pct >= 80
                    ? 'bg-emerald-500'
                    : pct >= 60
                    ? 'bg-blue-500'
                    : pct >= 40
                    ? 'bg-amber-500'
                    : 'bg-red-500';
                return (
                  <div key={c.id ?? idx} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-32 truncate flex-shrink-0">
                      {c.name || c.criteria || `Criterion ${idx + 1}`}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-8 text-right">{c.rating || 0}/5</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Criteria Detail Cards ── */}
        {evaluation.criteria && evaluation.criteria.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-purple-500" />
              Evaluation Criteria
            </h2>
            {evaluation.criteria.map((c: any, idx: number) => (
              <div
                key={c.id ?? idx}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-100 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {c.category && (
                        <span className="text-xs font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {c.category}
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-gray-900">
                        {c.name || c.criteria || `Criterion ${idx + 1}`}
                      </h3>
                    </div>
                    {c.description && (
                      <p className="text-xs text-gray-500 mb-3">{c.description}</p>
                    )}
                    {c.comments && (
                      <div className="mt-3 pl-3 border-l-2 border-blue-200">
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Supervisor's comment</p>
                        <p className="text-sm text-gray-700 italic">"{c.comments}"</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StarDisplay rating={c.rating || 0} />
                    <span className="text-xs text-gray-400">{c.rating || 0} / 5</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Supervisor Overall Comment ── */}
        {evaluation.comments && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-green-500" />
              Supervisor's Overall Feedback
            </h2>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-sm text-gray-700 leading-relaxed">{evaluation.comments}</p>
            </div>
          </div>
        )}

        {/* ── Employee's Existing Comment (if already acknowledged) ── */}
        {evaluation.employeeComment && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-blue-500" />
              Your Acknowledgment Comment
            </h2>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-gray-700 leading-relaxed">{evaluation.employeeComment}</p>
            </div>
          </div>
        )}

        {/* ── Employee Acknowledge & Comment Form ── */}
        {canAcknowledge && (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Acknowledge This Evaluation
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Please review the evaluation above, then acknowledge and optionally leave a comment.
            </p>
            <form onSubmit={handleAcknowledge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Comment <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={4}
                  value={employeeComment}
                  onChange={e => setEmployeeComment(e.target.value)}
                  placeholder="Share your thoughts on this evaluation, any context, or questions you have for your supervisor…"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                />
              </div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={e => {
                    setAcknowledged(e.target.checked);
                    setSaveError(null);
                  }}
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  I confirm that I have read and understood this evaluation.
                </span>
              </label>
              {saveError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  Acknowledged successfully! Redirecting…
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving || saveSuccess}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Submit Acknowledgment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Preparation Panel (for all users) ── */}
        {(feedbackHistory.length > 0 || checklistHistory.length > 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Supporting Context</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Feedback */}
              {feedbackHistory.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                    Recent Feedback
                  </h3>
                  <div className="space-y-2">
                    {feedbackHistory.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="bg-blue-50 rounded-lg p-3 text-sm">
                        <span className="font-medium text-gray-800">
                          {item.type === 'received' ? `From: ${item.from?.name || item.from}` : `To: ${item.to?.name || item.to}`}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          {item.date || item.createdAt}
                        </span>
                        {item.message && <p className="mt-1 text-gray-600">{item.message}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist Progress */}
              {checklistHistory.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Checklist Progress
                  </h3>
                  <div className="space-y-2">
                    {checklistHistory.slice(0, 3).map((a: any) => {
                      const pct = a.completionPercentage || 0;
                      return (
                        <div key={a.id} className="bg-emerald-50 rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-800 truncate">
                              {a.checklist?.title || 'Checklist'}
                            </span>
                            <span className="text-xs font-bold text-emerald-700">{pct}%</span>
                          </div>
                          <div className="w-full bg-emerald-100 rounded-full h-1.5">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Manager Coaching Actions ── */}
        {isManager && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
            <h2 className="text-base font-semibold text-amber-900 mb-1 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              Coaching & Status Actions
            </h2>
            <p className="text-sm text-amber-700 mb-4">
              Use this evaluation to support coaching decisions or status changes for the employee.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/coaching?employeeId=${evaluation.employeeId}`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Coaching History <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate(`/admin/employees/${evaluation.employeeId}/status`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Change Employee Status <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Supervisor View Link ── */}
        {isSupervisor && evaluation.id && (
          <div className="flex justify-end">
            <Link
              to={`/supervisor/evaluations/${evaluation.id}/view`}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Open Full Supervisor View <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EvaluationReview;