import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, History } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import FeedbackForm from '../../components/feedback/FeedbackForm';
import FeedbackList from '../../components/feedback/FeedbackList';
import { Feedback, CreateFeedbackRequest } from '../../types/feedback';
import feedbackService from '../../services/feedbackService';
import { useAuth } from '../../context/AuthContext';

const EmployeeFeedback: React.FC = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showForm, setShowForm] = useState(false);
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
      setError(err instanceof Error ? err.message : 'Failed to load feedback history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (feedbackData: CreateFeedbackRequest) => {
    try {
      await feedbackService.submitFeedback(feedbackData);
      setShowForm(false);
      // Reload feedback history
      await loadFeedbackHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    }
  };

  const handleViewFeedback = (feedbackId: string) => {
    // For employees, we can show a detailed view or just scroll to the feedback
    const element = document.getElementById(`feedback-${feedbackId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
            <p className="mt-1 text-sm text-gray-500">
              Share your feedback and track your submissions
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {showForm ? (
              <>
                <History className="h-5 w-5 mr-2" />
                View History
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Give Feedback
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {showForm ? (
          <FeedbackForm
            onSubmit={handleSubmitFeedback}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-800 text-white">
                <h2 className="text-lg font-medium flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  My Feedback History
                </h2>
              </div>
              <div className="p-6">
                <FeedbackList
                  feedbacks={feedbacks}
                  userRole={user?.role || 'employee'}
                  onView={handleViewFeedback}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeFeedback; 