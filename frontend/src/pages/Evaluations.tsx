import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { ClipboardCheck, Star, Clock, AlertCircle, CheckCircle, Calendar, Eye } from 'lucide-react';
import { getUserEvaluations } from '../services/evaluationService';
import { Evaluation } from '../types/evaluation';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Evaluations: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const response = await getUserEvaluations();
        setEvaluations(response.data || []);
      } catch (err) {
        setError('Failed to load evaluations');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'validated':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <ClipboardCheck className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'validated':
        return <Star className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getProgressPercentage = (evaluation: Evaluation) => {
    if (evaluation.status === 'completed' || evaluation.status === 'validated') return 100;
    if (evaluation.status === 'in_progress') return 50;
    return 0;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUpcomingEvaluations = () => {
    return evaluations.filter(evaluation => {
      const daysUntil = getDaysUntilDue(evaluation.dueDate);
      return daysUntil <= 30 && daysUntil >= 0 && evaluation.status !== 'completed' && evaluation.status !== 'validated';
    });
  };

  const getOverdueEvaluations = () => {
    return evaluations.filter(evaluation => {
      const daysUntil = getDaysUntilDue(evaluation.dueDate);
      return daysUntil < 0 && evaluation.status !== 'completed' && evaluation.status !== 'validated';
    });
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;

  const upcomingEvaluations = getUpcomingEvaluations();
  const overdueEvaluations = getOverdueEvaluations();
  const completedEvaluations = evaluations.filter(evaluation => evaluation.status === 'completed' || evaluation.status === 'validated');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Evaluations</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your performance evaluations and development progress
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Evaluations</p>
                <p className="text-2xl font-semibold text-gray-900">{evaluations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming</p>
                <p className="text-2xl font-semibold text-gray-900">{upcomingEvaluations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-2xl font-semibold text-gray-900">{overdueEvaluations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{completedEvaluations.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {overdueEvaluations.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {overdueEvaluations.length} Overdue Evaluation{overdueEvaluations.length > 1 ? 's' : ''}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>You have evaluations that are past their due date. Please contact your supervisor to discuss.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {upcomingEvaluations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <Clock className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  {upcomingEvaluations.length} Upcoming Evaluation{upcomingEvaluations.length > 1 ? 's' : ''}
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>You have evaluations due within the next 30 days. Prepare by reviewing your goals and achievements.</p>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Evaluations List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">All Evaluations</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {evaluations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No evaluations</h3>
                <p className="mt-1 text-sm text-gray-500">You don't have any evaluations yet.</p>
              </div>
            ) : (
              evaluations.map((evaluation) => {
                const daysUntil = getDaysUntilDue(evaluation.dueDate);
                const progress = getProgressPercentage(evaluation);
                const isOverdue = daysUntil < 0;
                const isUpcoming = daysUntil <= 30 && daysUntil >= 0;

                return (
                  <div key={evaluation.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getStatusIcon(evaluation.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {evaluation.title || `${evaluation.type} Evaluation`}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(evaluation.status)}`}>
                              {evaluation.status.replace('_', ' ').charAt(0).toUpperCase() + evaluation.status.slice(1)}
                            </span>
                            {isOverdue && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Overdue
                              </span>
                            )}
                            {isUpcoming && !isOverdue && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Due in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Evaluator: {evaluation.supervisor?.name || evaluation.supervisorId || 'N/A'}</span>
                            <span>•</span>
                            <span>Due: {evaluation.dueDate ? new Date(evaluation.dueDate).toLocaleDateString() : 'N/A'}</span>
                            {evaluation.score && (
                              <>
                                <span>•</span>
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                  <span>{evaluation.score}/5</span>
                                </div>
                              </>
                            )}
                          </div>
                          {progress > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-xs text-gray-500">{progress}%</span>
                              </div>
                            </div>
                          )}
                          {evaluation.criteria && evaluation.criteria.length > 0 && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {evaluation.criteria.slice(0, 3).map((criterion) => (
                                  <span
                                    key={criterion.id}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {criterion.criteria || criterion.name}
                                  </span>
                                ))}
                                {evaluation.criteria.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    +{evaluation.criteria.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/evaluations/${evaluation.id}`}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Evaluations;