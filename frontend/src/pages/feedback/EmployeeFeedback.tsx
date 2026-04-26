import React, { useState, useEffect } from 'react';
import {
  Plus, History, CheckCircle, Clock, XCircle, ChevronRight,
  CalendarDays, FileText, AlertCircle, ArrowLeft, Send
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import FeedbackForm from '../../components/feedback/FeedbackForm';
import { Feedback, CreateFeedbackRequest, FeedbackStatus } from '../../types/feedback';
import feedbackService from '../../services/feedbackService';
import { useAuth } from '../../context/AuthContext';

type View = 'list' | 'form' | 'success';
type Tab = 'all' | 'holiday';

const EmployeeFeedback: React.FC = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [view, setView] = useState<View>('list');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeedbackHistory();
  }, []);

  const loadFeedbackHistory = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getMyFeedbackHistory();
      setFeedbacks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load request history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (feedbackData: CreateFeedbackRequest) => {
    try {
      await feedbackService.submitFeedback(feedbackData);
      await loadFeedbackHistory();
      setView('success');
    } catch (err) {
      throw err; // re-throw so FeedbackForm can catch and show inline error
    }
  };

  // ── helpers ──────────────────────────────────────────────────────────────────
  const getStatusIcon = (status: FeedbackStatus | string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'supervisor_rejected':
      case 'hr_rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending_supervisor':
      case 'pending_hr':
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: FeedbackStatus | string) => {
    const base = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'approved':
        return <span className={`${base} bg-green-100 text-green-800`}>✓ Approved</span>;
      case 'supervisor_rejected':
        return <span className={`${base} bg-red-100 text-red-800`}>✗ Rejected by Supervisor</span>;
      case 'hr_rejected':
        return <span className={`${base} bg-red-100 text-red-800`}>✗ Rejected by HR</span>;
      case 'pending_supervisor':
        return <span className={`${base} bg-amber-100 text-amber-800`}>⏳ Awaiting Supervisor</span>;
      case 'pending_hr':
        return <span className={`${base} bg-blue-100 text-blue-800`}>⏳ Awaiting HR</span>;
      case 'pending':
        return <span className={`${base} bg-yellow-100 text-yellow-800`}>⏳ Pending</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  const holidayRequests = feedbacks.filter(f => f.type === 'holiday_request');
  const displayedFeedbacks = activeTab === 'holiday' ? holidayRequests : feedbacks;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  // ── SUCCESS view ──────────────────────────────────────────────────────────
  if (view === 'success') {
    return (
      <Layout>
        <div className="max-w-lg mx-auto mt-12">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-10 text-center">
            {/* Animated checkmark */}
            <div className="mx-auto w-20 h-20 bg-green-50 border-4 border-green-200 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h2>
            <p className="text-gray-500 mb-2">
              Your holiday request has been submitted successfully.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              It has been forwarded to your <strong className="text-gray-600">Supervisor</strong> for review.
              If approved, it will then go to <strong className="text-gray-600">HR</strong> for final decision.
              You can track the status below.
            </p>

            {/* Workflow steps */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
                <span className="text-xs text-green-600 font-medium mt-1">Submitted</span>
              </div>
              <div className="w-12 h-0.5 bg-amber-300 mb-4" />
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">2</div>
                <span className="text-xs text-amber-600 font-medium mt-1">Supervisor</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-200 mb-4" />
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">3</div>
                <span className="text-xs text-gray-400 font-medium mt-1">HR</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setView('list'); setActiveTab('holiday'); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <CalendarDays className="w-4 h-4" />
                View My Holiday Requests
              </button>
              <button
                onClick={() => setView('form')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Request
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── FORM view ─────────────────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <Layout>
        <div className="space-y-4">
          <button
            onClick={() => setView('list')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Requests
          </button>
          <FeedbackForm
            onSubmit={handleSubmitFeedback}
            onCancel={() => setView('list')}
          />
        </div>
      </Layout>
    );
  }

  // ── LIST view ─────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
            <p className="mt-1 text-sm text-gray-500">Submit requests and track your submissions</p>
          </div>
          <button
            onClick={() => setView('form')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            New Request
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Requests
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {feedbacks.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('holiday')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'holiday'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Holiday Requests
              <span className="ml-1 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                {holidayRequests.length}
              </span>
            </button>
          </nav>
        </div>

        {/* List */}
        {displayedFeedbacks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            {activeTab === 'holiday' ? (
              <>
                <CalendarDays className="mx-auto w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No holiday requests yet</h3>
                <p className="text-sm text-gray-500 mb-4">Submit a holiday request and track its approval status here.</p>
                <button
                  onClick={() => setView('form')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Request Holiday
                </button>
              </>
            ) : (
              <>
                <FileText className="mx-auto w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-sm font-medium text-gray-900">No requests yet</h3>
                <p className="text-sm text-gray-500">Start by submitting a new request.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex-shrink-0">
                    {getStatusIcon(feedback.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {getStatusBadge(feedback.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        feedback.type === 'holiday_request'
                          ? 'bg-orange-100 text-orange-700'
                          : feedback.type === 'administrative_paper'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {feedback.type === 'holiday_request' ? 'Holiday Request'
                          : feedback.type === 'administrative_paper' ? 'Admin Paper'
                          : feedback.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(feedback.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{feedback.message}</p>

                    {/* Rejection reason */}
                    {(feedback.status === 'supervisor_rejected' && feedback.supervisorRejectionReason) && (
                      <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 mb-0.5">Reason from Supervisor:</p>
                        <p className="text-xs text-red-600">{feedback.supervisorRejectionReason}</p>
                      </div>
                    )}
                    {(feedback.status === 'hr_rejected' && feedback.hrRejectionReason) && (
                      <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 mb-0.5">Reason from HR:</p>
                        <p className="text-xs text-red-600">{feedback.hrRejectionReason}</p>
                      </div>
                    )}
                    {feedback.status === 'approved' && (
                      <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700">🎉 Your request was approved by HR.</p>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeFeedback;