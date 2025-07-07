import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Reply } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [viewFeedback, setViewFeedback] = useState<Feedback | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    loadTeamFeedback();
  }, []);

  const loadTeamFeedback = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getTeamFeedback();
      setFeedbacks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (feedbackId: string) => {
    setSelectedFeedbackId(feedbackId);
    setShowResponseModal(true);
  };

  const handleResponseSuccess = () => {
    // Reload feedback to show the new response
    loadTeamFeedback();
  };

  const handleCloseResponseModal = () => {
    setShowResponseModal(false);
    setSelectedFeedbackId(null);
  };

  const handleViewFeedback = (feedbackId: string) => {
    const feedback = feedbacks.find(f => f.id === feedbackId) || null;
    setViewFeedback(feedback);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewFeedback(null);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Feedback</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review and respond to feedback from your team members
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              {feedbacks.length} feedback items
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Feedback</p>
                <p className="text-2xl font-semibold text-gray-900">{feedbacks.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Reply className="h-8 w-8 text-yellow-600" />
              </div>
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
              <div className="flex-shrink-0">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Addressed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {feedbacks.filter(f => f.status === 'addressed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 bg-blue-600 text-white">
            <h2 className="text-lg font-medium flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Feedback
            </h2>
          </div>
          <div className="p-6">
            <FeedbackList
              feedbacks={feedbacks}
              userRole={user?.role || 'supervisor'}
              onRespond={handleRespond}
              onView={handleViewFeedback}
            />
          </div>
        </div>

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
            onClose={handleCloseViewModal}
          />
        )}
      </div>
    </Layout>
  );
};

export default SupervisorFeedback; 