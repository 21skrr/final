import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { getSupervisorEvaluations } from '../../services/evaluationService';
import { Evaluation } from '../../types/evaluation';
import {
  ClipboardCheck,
  Star,
  PlusCircle,
  Send,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Eye,
  Target,
  FileText,
  User,
  Award,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/* ─── status config ──────────────────────────────────── */
const STATUS_CONFIG: Record<string, {
  label: string;
  badge: string;
  icon: React.ReactNode;
}> = {
  draft: {
    label: 'Draft',
    badge: 'bg-gray-100 text-gray-700',
    icon: <Clock className="h-3 w-3" />,
  },
  pending: {
    label: 'Pending',
    badge: 'bg-yellow-100 text-yellow-800',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-blue-100 text-blue-700',
    icon: <ClipboardCheck className="h-3 w-3" />,
  },
  completed: {
    label: 'Awaiting Review',
    badge: 'bg-amber-100 text-amber-800',
    icon: <Clock className="h-3 w-3" />,
  },
  validated: {
    label: 'Approved',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: <ShieldCheck className="h-3 w-3" />,
  },
};

const SupervisorEvaluations: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const evaluationsResponse = await getSupervisorEvaluations();
        setEvaluations(evaluationsResponse.data || []);
      } catch {
        setError('Failed to load evaluations');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading evaluations…</p>
        </div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-lg mx-auto mt-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </button>
      </div>
    </Layout>
  );

  const awaiting = evaluations.filter(e => e.status === 'completed' && !e.reviewedBy).length;
  const approved = evaluations.filter(e => e.status === 'validated' || (e.status === 'completed' && !!e.reviewedBy)).length;
  const active = evaluations.filter(e => e.status === 'in_progress' || e.status === 'pending' || e.status === 'draft').length;
  const avgScore = evaluations.filter(e => e.overallScore).length > 0
    ? Math.round(evaluations.reduce((s, e) => s + (e.overallScore || 0), 0) / evaluations.filter(e => e.overallScore).length)
    : null;

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto pb-10">

        {/* ── Header ── */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Team's Evaluations</h1>
            <p className="text-gray-500 mt-1 text-sm">Manage and track your team's performance evaluations</p>
          </div>
          <Link
            to="/supervisor/evaluations/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle className="h-5 w-5 mr-2" /> New Evaluation
          </Link>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: evaluations.length, icon: <ClipboardCheck className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'Awaiting Review', value: awaiting, icon: <Clock className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-50' },
            { label: 'Approved', value: approved, icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50' },
            { label: 'Avg Score', value: avgScore !== null ? `${avgScore}%` : '—', icon: <TrendingUp className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
              <div className={`w-10 h-10 ${stat.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Evaluation Cards ── */}
        <div className="space-y-3">
          {evaluations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-sm font-semibold text-gray-700">No evaluations yet</h3>
              <p className="mt-1 text-sm text-gray-400">Create your first evaluation to get started.</p>
            </div>
          ) : (
            evaluations.map((evaluation) => {
              const sc = STATUS_CONFIG[evaluation.status] ?? STATUS_CONFIG['draft'];
              // Treat as approved if: status is 'validated' OR old records where manager approved
              // but status was incorrectly left as 'completed' (legacy — before the fix)
              const isValidated = evaluation.status === 'validated' || (evaluation.status === 'completed' && !!evaluation.reviewedBy);
              const isCompleted = evaluation.status === 'completed' && !evaluation.reviewedBy;
              const isEditable = !isCompleted && !isValidated;
              // Manager's comment after requesting changes — stored in 'comments' when sent back to pending
              const hasManagerFeedback = evaluation.comments && (evaluation.status === 'pending' || evaluation.status === 'in_progress');

              return (
                <div
                  key={evaluation.id}
                  className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md ${
                    isValidated
                      ? 'border-emerald-200'
                      : isCompleted
                      ? 'border-amber-200'
                      : hasManagerFeedback
                      ? 'border-red-200'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                    {/* Left info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h2 className="text-base font-semibold text-gray-900 capitalize">
                          {evaluation.type} Evaluation
                        </h2>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${sc.badge}`}>
                          {sc.icon}
                          {sc.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500 mb-2">
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-gray-400" />
                          {evaluation.employee?.name || evaluation.employeeId}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {evaluation.dueDate ? new Date(evaluation.dueDate).toLocaleDateString() : 'No due date'}
                        </span>
                      </div>

                      {/* Completed / reviewed dates */}
                      {evaluation.completedAt && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                          Submitted {new Date(evaluation.completedAt).toLocaleDateString()}
                        </div>
                      )}
                      {isValidated && evaluation.reviewedAt && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Approved by manager on {new Date(evaluation.reviewedAt).toLocaleDateString()}
                        </div>
                      )}

                      {/* ── Manager feedback banner (when changes requested) ── */}
                      {hasManagerFeedback && (
                        <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                          <MessageSquare className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-red-700 mb-0.5">Manager requested changes</p>
                            <p className="text-sm text-red-700 leading-snug">{evaluation.comments}</p>
                          </div>
                        </div>
                      )}

                      {/* Score */}
                      {evaluation.overallScore != null && (
                        <div className="mt-2 flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-semibold text-gray-800">{evaluation.overallScore}%</span>
                          <span className="text-xs text-gray-400">Overall Score</span>
                        </div>
                      )}
                    </div>

                    {/* Right actions */}
                    <div className="flex gap-2 flex-wrap md:flex-nowrap md:flex-col md:items-end justify-end">
                      {isValidated ? (
                        // ── APPROVED: manager validated ──
                        <>
                          <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-200">
                            <Award className="h-4 w-4" /> Manager Approved
                          </div>
                          <Link
                            to={`/supervisor/evaluations/${evaluation.id}/view`}
                            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" /> View Results
                          </Link>
                          <Link
                            to={`/supervisor/evaluations/${evaluation.id}/report`}
                            className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm transition-colors"
                          >
                            <FileText className="h-4 w-4 mr-1" /> Report
                          </Link>
                        </>
                      ) : isCompleted ? (
                        // ── COMPLETED: waiting for manager ──
                        <>
                          <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-800 rounded-xl text-sm font-semibold border border-amber-200">
                            <Clock className="h-4 w-4" /> Awaiting Manager Review
                          </div>
                          <Link
                            to={`/supervisor/evaluations/${evaluation.id}/view`}
                            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" /> View Results
                          </Link>
                        </>
                      ) : (
                        // ── EDITABLE: draft / pending / in_progress ──
                        <>
                          <Link
                            to={`/supervisor/evaluations/${evaluation.id}/form`}
                            className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Link>
                          <Link
                            to={`/supervisor/evaluations/${evaluation.id}/criteria`}
                            className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 text-sm transition-colors"
                          >
                            <Target className="h-4 w-4 mr-1" /> Add Criteria
                          </Link>
                          {evaluation.status !== 'draft' && (
                            <Link
                              to={`/supervisor/evaluations/${evaluation.id}/form`}
                              className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm transition-colors"
                            >
                              <Send className="h-4 w-4 mr-1" /> Submit
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SupervisorEvaluations;