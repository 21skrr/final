import React, { useState, useEffect } from 'react';
import { BarChart3, Filter, Download, TrendingUp } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import FeedbackList from '../../components/feedback/FeedbackList';
import { Feedback, FeedbackAnalytics, FeedbackFilters } from '../../types/feedback';
import feedbackService from '../../services/feedbackService';
import { useAuth } from '../../context/AuthContext';

const ManagerFeedback: React.FC = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FeedbackFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadDepartmentFeedback();
    loadAnalytics();
  }, [filters]);

  const loadDepartmentFeedback = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getDepartmentFeedback(filters);
      setFeedbacks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load department feedback');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await feedbackService.getDepartmentAnalytics(filters);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const handleFilterChange = (key: keyof FeedbackFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleViewFeedback = (feedbackId: string) => {
    // For managers, we can show a detailed view
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
      a.download = `department-feedback-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export feedback data');
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
            <h1 className="text-2xl font-bold text-gray-900">Department Feedback</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor feedback trends and department insights
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  Category
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="training">Training</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="process">Process</option>
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

        {/* Analytics Summary */}
        {analytics && analytics.overview && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Feedback</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.overview?.totalFeedback ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">This Month</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.trend?.filter(t => {
                      const date = new Date(t.date);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).reduce((sum, t) => sum + t.count, 0) ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Top Type</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.byType && analytics.byType.length > 0 ? analytics.byType[0].type : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Date Range</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {analytics.overview?.dateRange ? `${new Date(analytics.overview.dateRange.start).toLocaleDateString()} - ${new Date(analytics.overview.dateRange.end).toLocaleDateString()}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 bg-blue-600 text-white">
            <h2 className="text-lg font-medium flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Department Feedback
            </h2>
          </div>
          <div className="p-6">
            <FeedbackList
              feedbacks={feedbacks}
              userRole={user?.role || 'manager'}
              onView={handleViewFeedback}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ManagerFeedback; 