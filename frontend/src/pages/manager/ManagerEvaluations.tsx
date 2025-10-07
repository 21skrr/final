import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { getManagerEvaluations, validateEvaluation, getEvaluationReports } from '../../services/evaluationService';
import { Evaluation } from '../../types/evaluation';
import { 
  ClipboardCheck, 
  Star, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Filter, 
  Search, 
  AlertCircle, 
  Clock, 
  Eye, 
  Download,
  FileText,
  Target,
  Award,
  Calendar,
  User,
  Building,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ManagerEvaluations: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);
  const [requestingChange, setRequestingChange] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [evaluationsResponse, analyticsResponse] = await Promise.all([
          getManagerEvaluations(),
          getEvaluationReports().catch(() => null) // Don't fail if analytics not available
        ]);
        setEvaluations(evaluationsResponse.data || []);
        setAnalytics(analyticsResponse?.data || null);
      } catch (err) {
        setError('Failed to load evaluations');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getOverdueEvaluations = () => {
    return evaluations.filter(evaluation => {
      const daysUntil = getDaysUntilDue(evaluation.dueDate);
      return daysUntil < 0 && evaluation.status !== 'completed' && evaluation.status !== 'validated';
    });
  };

  const getPendingValidations = () => {
    return evaluations.filter(evaluation => evaluation.status === 'completed' && !evaluation.reviewedBy);
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = evaluation.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evaluation.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evaluation.supervisor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || evaluation.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || evaluation.employee?.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getDepartmentStats = () => {
    const departments = [...new Set(evaluations.map(evaluation => evaluation.employee?.department).filter(Boolean))];
    return departments.map(dept => ({
      name: dept,
      total: evaluations.filter(evaluation => evaluation.employee?.department === dept).length,
      completed: evaluations.filter(evaluation => evaluation.employee?.department === dept && evaluation.status === 'completed').length,
      pending: evaluations.filter(evaluation => evaluation.employee?.department === dept && evaluation.status === 'pending').length
    }));
  };

  const handleValidate = async (id: string) => {
    setValidating(id);
    try {
      await validateEvaluation(id, { reviewNotes: 'Approved by manager', status: 'completed' });
      const response = await getManagerEvaluations();
      setEvaluations(response.data || []);
      toast.success('Evaluation validated successfully');
    } catch (err) {
      toast.error('Failed to validate evaluation');
    } finally {
      setValidating(null);
    }
  };

  const handleRequestChanges = async (id: string) => {
    const comment = window.prompt('Enter your requested changes or feedback:');
    if (!comment) return;
    setRequestingChange(id);
    try {
      await validateEvaluation(id, { status: 'pending', reviewComments: comment });
      const response = await getManagerEvaluations();
      setEvaluations(response.data || []);
      toast.success('Requested changes successfully');
    } catch (err) {
      toast.error('Failed to request changes');
    } finally {
      setRequestingChange(null);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team evaluations...</p>
        </div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <h2 className="text-lg font-medium text-red-800">Error Loading Evaluations</h2>
        </div>
        <p className="mt-2 text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Building className="h-8 w-8 mr-3 text-blue-600" />
                Team Evaluations
              </h1>
              <p className="mt-2 text-gray-600">Manage and review evaluations for your team members</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Evaluations</p>
                <p className="text-2xl font-bold text-gray-900">{evaluations.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {evaluations.filter(e => e.status === 'validated').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {evaluations.filter(e => e.status === 'completed' && !e.reviewedBy).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {evaluations.length > 0 
                    ? Math.round(evaluations.reduce((acc, e) => acc + (e.score || 0), 0) / evaluations.length)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search evaluations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="validated">Validated</option>
                <option value="draft">Draft</option>
              </select>
              
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Departments</option>
                {[...new Set(evaluations.map(e => e.employee?.department).filter(Boolean))].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredEvaluations.length} of {evaluations.length} evaluations
            </div>
          </div>
        </div>

        {/* Evaluations List */}
        <div className="space-y-4">
          {filteredEvaluations.map((evaluation) => (
            <div key={evaluation.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {evaluation.type} Evaluation
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(evaluation.status)}`}>
                        {getStatusIcon(evaluation.status)}
                        <span className="ml-1 capitalize">{evaluation.status}</span>
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
                      {evaluation.employee?.department && (
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{evaluation.employee.department}</span>
                        </div>
                      )}
                      {evaluation.score && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-2 text-yellow-400" />
                          <span className="font-medium">{evaluation.score}%</span>
                        </div>
                      )}
                    </div>
                    
                    {evaluation.completedAt && (
                      <div className="mt-2 text-sm text-gray-500">
                        Completed: {new Date(evaluation.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/manager/evaluations/${evaluation.id}`}
                      className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                    
                    {evaluation.status === 'completed' && !evaluation.reviewedBy && (
                      <>
                        <button
                          className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          onClick={() => handleValidate(evaluation.id)}
                          disabled={validating === evaluation.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {validating === evaluation.id ? 'Validating...' : 'Validate'}
                        </button>
                        <button
                          className="inline-flex items-center px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                          onClick={() => handleRequestChanges(evaluation.id)}
                          disabled={requestingChange === evaluation.id}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          {requestingChange === evaluation.id ? 'Requesting...' : 'Request Changes'}
                        </button>
                      </>
                    )}
                    
                    {evaluation.status === 'validated' && (
                      <span className="inline-flex items-center px-3 py-2 bg-emerald-100 text-emerald-800 rounded-lg">
                        <Award className="h-4 w-4 mr-1" />
                        Validated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEvaluations.length === 0 && (
          <div className="text-center py-12 bg-white shadow rounded-lg">
            <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No evaluations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {evaluations.length === 0 
                ? "No evaluations are available for your teams at this time."
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManagerEvaluations; 