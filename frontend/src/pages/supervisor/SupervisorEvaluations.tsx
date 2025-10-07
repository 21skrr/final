import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { getSupervisorEvaluations } from '../../services/evaluationService';
import { Evaluation } from '../../types/evaluation';
import { ClipboardCheck, Star, PlusCircle, Send, Clock, AlertCircle, CheckCircle, TrendingUp, Calendar, Eye, Target, FileText, User } from 'lucide-react';
import { Link } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import userService from '../../services/userService';
// import { User } from '../../types/user';

const SupervisorEvaluations: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [teamMembers, setTeamMembers] = useState<any[]>([]);
  // const [showCreateModal, setShowCreateModal] = useState(false);
  // const [searchTerm, setSearchTerm] = useState('');
  // const [statusFilter, setStatusFilter] = useState('all');
  // const [typeFilter, setTypeFilter] = useState('all');
  // const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const evaluationsResponse = await getSupervisorEvaluations();
        setEvaluations(evaluationsResponse.data || []);
      } catch {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // const getStatusBadge = (status: string) => {
  //   switch (status) {
  //     case 'pending':
  //       return 'bg-yellow-100 text-yellow-800';
  //     case 'in_progress':
  //       return 'bg-blue-100 text-blue-800';
  //     case 'completed':
  //       return 'bg-green-100 text-green-800';
  //     case 'validated':
  //       return 'bg-emerald-100 text-emerald-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'pending':
  //       return <Clock className="h-4 w-4" />;
  //     case 'in_progress':
  //       return <ClipboardCheck className="h-4 w-4" />;
  //     case 'completed':
  //       return <CheckCircle className="h-4 w-4" />;
  //     case 'validated':
  //       return <Star className="h-4 w-4" />;
  //     default:
  //       return <AlertCircle className="h-4 w-4" />;
  //   }
  // };

  // const getDaysUntilDue = (dueDate: string) => {
  //   const today = new Date();
  //   const due = new Date(dueDate);
  //   const diffTime = due.getTime() - today.getTime();
  //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  //   return diffDays;
  // };

  // const getOverdueEvaluations = () => {
  //   return evaluations.filter(evaluation => {
  //     const daysUntil = getDaysUntilDue(evaluation.dueDate);
  //     return daysUntil < 0 && evaluation.status !== 'completed' && evaluation.status !== 'validated';
  //   });
  // };

  // const getUpcomingEvaluations = () => {
  //   return evaluations.filter(evaluation => {
  //     const daysUntil = getDaysUntilDue(evaluation.dueDate);
  //     return daysUntil <= 7 && daysUntil >= 0 && evaluation.status !== 'completed' && evaluation.status !== 'validated';
  //   });
  // };

  // const filteredEvaluations = evaluations.filter(evaluation => {
  //   const matchesSearch = evaluation.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //                        evaluation.type.toLowerCase().includes(searchTerm.toLowerCase());
  //   const matchesStatus = statusFilter === 'all' || evaluation.status === statusFilter;
  //   const matchesType = typeFilter === 'all' || evaluation.type === typeFilter;
  //   return matchesSearch && matchesStatus && matchesType;
  // });

  // const handleSubmit = async (id: string) => {
  //   try {
  //     await submitEvaluation(id, {});
  //     // Refresh evaluations
  //     const response = await getSupervisorEvaluations();
  //     setEvaluations(response.data || []);
  //   } catch (err) {
  //     alert('Failed to submit evaluation');
  //   }
  // };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Team's Evaluations</h1>
            <p className="text-gray-600 mt-1">Manage and track your team's performance evaluations</p>
          </div>
          <Link to="/supervisor/evaluations/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <PlusCircle className="h-5 w-5 mr-2" /> New Evaluation
          </Link>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
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

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {evaluations.filter(evaluation => evaluation.status === 'validated').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {evaluations.filter(evaluation => evaluation.status === 'in_progress' || evaluation.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {evaluations.filter(evaluation => evaluation.score).length > 0
                    ? Math.round(evaluations.reduce((sum, evaluation) => sum + (evaluation.score || 0), 0) / evaluations.filter(evaluation => evaluation.score).length)
                    : 0
                  }%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Awaiting Review</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {evaluations.filter(evaluation => evaluation.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {evaluations.map((evaluation) => (
            <div key={evaluation.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-lg font-medium text-gray-900">{evaluation.type} Evaluation</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      evaluation.status === 'completed' || evaluation.status === 'validated' 
                        ? 'bg-green-100 text-green-800' 
                        : evaluation.status === 'in_progress' 
                        ? 'bg-blue-100 text-blue-800'
                        : evaluation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {evaluation.status === 'completed' || evaluation.status === 'validated' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : evaluation.status === 'in_progress' ? (
                        <Clock className="h-3 w-3 mr-1" />
                      ) : evaluation.status === 'pending' ? (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {evaluation.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{evaluation.employee?.name || evaluation.employeeId}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{evaluation.dueDate ? new Date(evaluation.dueDate).toLocaleDateString() : 'No due date'}</span>
                    </div>
                  </div>
                  
                  {evaluation.score && (
                    <div className="mt-3 flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="ml-2 text-lg font-medium text-gray-900">{evaluation.score}%</span>
                      <span className="ml-2 text-sm text-gray-500">Overall Score</span>
                    </div>
                  )}
                  
                  {evaluation.completedAt && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      <span>Completed: {new Date(evaluation.completedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 md:mt-0 flex gap-2 flex-wrap">
                  {/* Conditional button display based on status */}
                  {evaluation.status === 'validated' ? (
                    // Read-only view for validated evaluations (manager approved)
                    <>
                      <Link 
                        to={`/supervisor/evaluations/${evaluation.id}/view`} 
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Results
                      </Link>
                      <Link 
                        to={`/supervisor/evaluations/${evaluation.id}/report`} 
                        className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Report
                      </Link>
                    </>
                  ) : evaluation.status === 'completed' ? (
                    // Awaiting manager review for completed evaluations
                    <>
                      <Link 
                        to={`/supervisor/evaluations/${evaluation.id}/view`} 
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Results
                      </Link>
                      <span className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                        <Clock className="h-4 w-4 mr-1" />
                        Awaiting Manager Review
                      </span>
                    </>
                  ) : (
                    // Action buttons for in-progress evaluations
                    <>
                      <Link 
                        to={`/supervisor/evaluations/${evaluation.id}/form`} 
                        className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      <Link 
                        to={`/supervisor/evaluations/${evaluation.id}/criteria`} 
                        className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Target className="h-4 w-4 mr-1" />
                        Add Criteria
                      </Link>
                      {evaluation.status !== 'draft' && (
                        <Link 
                          to={`/supervisor/evaluations/${evaluation.id}/form`} 
                          className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Submit
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {evaluations.length === 0 && (
          <div className="text-center py-12">
            <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No evaluations found</h3>
            <p className="mt-1 text-sm text-gray-500">You have not created any evaluations for your team yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupervisorEvaluations; 