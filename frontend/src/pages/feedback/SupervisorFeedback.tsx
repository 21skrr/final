import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Reply, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import FeedbackList from '../../components/feedback/FeedbackList';
import FeedbackResponseModal from '../../components/feedback/FeedbackResponseModal';
import FeedbackDetailModal from '../../components/feedback/FeedbackDetailModal';
import { Feedback } from '../../types/feedback';
import feedbackService from '../../services/feedbackService';
import { useAuth } from '../../context/AuthContext';

const SupervisorFeedback: React.FC = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [holidayRequests, setHolidayRequests] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [viewFeedback, setViewFeedback] = useState<Feedback | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [feedbackData, holidayData] = await Promise.all([
        feedbackService.getTeamFeedback(),
        feedbackService.getHolidayRequests(),
      ]);
      setFeedbacks(feedbackData);
      setHolidayRequests(holidayData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (feedbackId: string) => {
    setSelectedFeedbackId(feedbackId);
    setShowResponseModal(true);
  };

  const handleResponseSuccess = () => loadAll();
  const handleCloseResponseModal = () => { setShowResponseModal(false); setSelectedFeedbackId(null); };

  const handleViewFeedback = (feedbackId: string) => {
    const feedback = feedbacks.find(f => f.id === feedbackId) || null;
    setViewFeedback(feedback);
    setShowViewModal(true);
  };

  const handleApproveHoliday = async (feedbackId: string) => {
    setActionLoading(true);
    try {
      await feedbackService.supervisorApproveRequest(feedbackId);
      setActionSuccess('Holiday request approved and forwarded to HR.');
      await loadAll();
    } catch {
      setError('Failed to approve holiday request.');
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const openRejectModal = (feedbackId: string) => {
    setRejectTargetId(feedbackId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectTargetId || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await feedbackService.supervisorRejectRequest(rejectTargetId, rejectReason);
      setShowRejectModal(false);
      setRejectTargetId(null);
      setActionSuccess('Holiday request rejected.');
      await loadAll();
    } catch {
      setError('Failed to reject holiday request.');
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold !text-gray-900">Team Requests</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review feedback and approve or reject holiday requests from your team
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">{feedbacks.length} items</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {actionSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700">{actionSuccess}</p>
          </div>
        )}

        {/* ── HOLIDAY REQUESTS SECTION ── */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-orange-100">
          <div className="p-4 bg-orange-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <h2 className="text-lg font-medium !text-white">Holiday Requests Pending Your Approval</h2>
            </div>
            {holidayRequests.length > 0 && (
              <span className="bg-white text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {holidayRequests.length}
              </span>
            )}
          </div>

          <div className="p-4">
            {holidayRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No pending holiday requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {holidayRequests.map((req) => (
                  <div
                    key={req.id}
                    className="border border-orange-100 rounded-lg p-4 bg-orange-50 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {req.sender?.name || 'Employee'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {req.sender?.department && `· ${req.sender.department}`}
                        </span>
                        <span className="text-xs text-gray-400">
                          · {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{req.message}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApproveHoliday(req.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(req.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── SUMMARY STATS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{feedbacks.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <Reply className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Response</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {feedbacks.filter(f => f.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Addressed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {feedbacks.filter(f => f.status === 'addressed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ALL TEAM FEEDBACK ── */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 bg-blue-600 text-white">
            <h2 className="text-lg font-medium flex items-center !text-white">
              <Users className="h-5 w-5 mr-2" />
              Team Feedback
            </h2>
          </div>
          <div className="p-6">
            <FeedbackList
              feedbacks={feedbacks.filter(f => f.type !== 'holiday_request')}
              userRole={user?.role || 'supervisor'}
              onRespond={handleRespond}
              onView={handleViewFeedback}
            />
          </div>
        </div>

        {/* Modals */}
        {selectedFeedbackId && (
          <FeedbackResponseModal
            feedbackId={selectedFeedbackId}
            isOpen={showResponseModal}
            onClose={handleCloseResponseModal}
            onSuccess={handleResponseSuccess}
          />
        )}
        {showViewModal && viewFeedback && (
          <FeedbackDetailModal
            feedback={viewFeedback}
            isOpen={showViewModal}
            onClose={() => { setShowViewModal(false); setViewFeedback(null); }}
            userRole={user?.role || 'supervisor'}
          />
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Reject Holiday Request</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Please provide a reason for rejection. This will be visible to the employee.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Enter rejection reason..."
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-400 focus:ring-red-400 text-sm"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupervisorFeedback;