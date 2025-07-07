import React, { useState, useEffect } from 'react';
import { Users, Filter, Download, Flag, Tag, BarChart3 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import FeedbackList from '../../components/feedback/FeedbackList';
import { Feedback, FeedbackFilters, FeedbackCategorization, FeedbackEscalation } from '../../types/feedback';
import feedbackService from '../../services/feedbackService';
import { useAuth } from '../../context/AuthContext';

const HRFeedback: React.FC = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FeedbackFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [showCategorizeModal, setShowCategorizeModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  useEffect(() => {
    loadAllFeedback();
  }, [filters]);

  const loadAllFeedback = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getAllFeedback(filters);
      setFeedbacks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FeedbackFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCategorize = (feedbackId: string) => {
    setSelectedFeedbackId(feedbackId);
    setShowCategorizeModal(true);
  };

  const handleEscalate = (feedbackId: string) => {
    setSelectedFeedbackId(feedbackId);
    setShowEscalateModal(true);
  };

  const handleViewFeedback = (feedbackId: string) => {
    // For HR, we can show a detailed view
    const feedback = feedbacks.find(f => f.id === feedbackId);
    if (feedback) {
      console.log('View feedback:', feedback);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await feedbackService.exportFeedback({
        format: 'csv',
        dateRange: 'monthly',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-feedback-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export feedback data');
    }
  };

  const handleCategorizeSubmit = async (categorization: FeedbackCategorization) => {
    if (!selectedFeedbackId) return;
    
    try {
      await feedbackService.categorizeFeedback(selectedFeedbackId, categorization);
      setShowCategorizeModal(false);
      setSelectedFeedbackId(null);
      // Reload feedback
      await loadAllFeedback();
    } catch (err) {
      setError('Failed to categorize feedback');
    }
  };

  const handleEscalateSubmit = async (escalation: FeedbackEscalation) => {
    if (!selectedFeedbackId) return;
    
    try {
      await feedbackService.escalateFeedback(selectedFeedbackId, escalation);
      setShowEscalateModal(false);
      setSelectedFeedbackId(null);
      // Reload feedback
      await loadAllFeedback();
    } catch (err) {
      setError('Failed to escalate feedback');
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
            <h1 className="text-2xl font-bold text-gray-900">All Feedback</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and analyze all feedback across the organization
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="training">Training</option>
                  <option value="support">Support</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="addressed">Addressed</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
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
                <BarChart3 className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {feedbacks.filter(f => f.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Tag className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Categorized</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {feedbacks.filter(f => f.categories && f.categories.length > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Flag className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">High Priority</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {feedbacks.filter(f => f.priority === 'high').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 bg-blue-600 text-white">
            <h2 className="text-lg font-medium flex items-center">
              <Users className="h-5 w-5 mr-2" />
              All Feedback
            </h2>
          </div>
          <div className="p-6">
            <FeedbackList
              feedbacks={feedbacks}
              userRole={user?.role || 'hr'}
              onView={handleViewFeedback}
              onCategorize={handleCategorize}
              onEscalate={handleEscalate}
            />
          </div>
        </div>

        {/* Categorize Modal */}
        {showCategorizeModal && selectedFeedbackId && (
          <CategorizeModal
            feedbackId={selectedFeedbackId}
            isOpen={showCategorizeModal}
            onClose={() => {
              setShowCategorizeModal(false);
              setSelectedFeedbackId(null);
            }}
            onSubmit={handleCategorizeSubmit}
          />
        )}

        {/* Escalate Modal */}
        {showEscalateModal && selectedFeedbackId && (
          <EscalateModal
            feedbackId={selectedFeedbackId}
            isOpen={showEscalateModal}
            onClose={() => {
              setShowEscalateModal(false);
              setSelectedFeedbackId(null);
            }}
            onSubmit={handleEscalateSubmit}
          />
        )}
      </div>
    </Layout>
  );
};

// Categorize Modal Component
interface CategorizeModalProps {
  feedbackId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (categorization: FeedbackCategorization) => void;
}

const CategorizeModal: React.FC<CategorizeModalProps> = ({
  feedbackId,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FeedbackCategorization>({
    categories: [],
    priority: 'medium',
    status: 'pending',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Categorize Feedback</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <div className="space-y-2">
              {['training', 'supervisor', 'process'].map((category) => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category as any)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          categories: [...prev.categories, category as any],
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          categories: prev.categories.filter(c => c !== category),
                        }));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{category}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="addressed">Addressed</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Categorize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Escalate Modal Component
interface EscalateModalProps {
  feedbackId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (escalation: FeedbackEscalation) => void;
}

const EscalateModal: React.FC<EscalateModalProps> = ({
  feedbackId,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FeedbackEscalation>({
    escalateTo: 'manager',
    reason: '',
    notifyParties: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Escalate Feedback</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escalate To
            </label>
            <select
              value={formData.escalateTo}
              onChange={(e) => setFormData(prev => ({ ...prev, escalateTo: e.target.value as any }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Explain why this feedback needs to be escalated..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notify Parties
            </label>
            <div className="space-y-2">
              {['supervisor', 'hr'].map((party) => (
                <label key={party} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifyParties.includes(party as any)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          notifyParties: [...prev.notifyParties, party as any],
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          notifyParties: prev.notifyParties.filter(p => p !== party),
                        }));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{party}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Escalate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRFeedback; 