import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvaluationById, submitEvaluation, updateEvaluationComments } from '../../services/evaluationService';
import { Evaluation, EvaluationCriteria } from '../../types/evaluation';
import { 
  Star, 
  User, 
  Calendar, 
  Target, 
  MessageSquare, 
  Save, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  Award,
  FileText,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const SupervisorEvaluationForm: React.FC = () => {
  const { evaluationId } = useParams();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [generalComments, setGeneralComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        if (evaluationId) {
          const response = await getEvaluationById(evaluationId);
          setEvaluation(response.data);
          setCriteria(response.data.criteria || []);
          setGeneralComments(response.data.comments || '');
        }
      } catch (err) {
        setError('Failed to load evaluation');
        toast.error('Failed to load evaluation');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();
  }, [evaluationId]);

  const handleRatingChange = (idx: number, rating: number) => {
    setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, rating } : c));
    // Clear validation error for this criterion
    if (validationErrors[`criterion_${idx}`]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`criterion_${idx}`];
        return newErrors;
      });
    }
  };

  const handleCommentChange = (idx: number, comments: string) => {
    setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, comments } : c));
    // Clear validation error for this criterion
    if (validationErrors[`criterion_${idx}`]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`criterion_${idx}`];
        return newErrors;
      });
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      if (evaluationId) {
        await updateEvaluationComments(evaluationId, generalComments);
        toast.success('Draft saved successfully!');
      }
    } catch (err) {
      toast.error('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    criteria.forEach((criterion, idx) => {
      if (!criterion.rating || criterion.rating < 1 || criterion.rating > 5) {
        errors[`criterion_${idx}`] = 'Rating is required (1-5)';
      }
      if (!criterion.comments || criterion.comments.trim() === '') {
        errors[`criterion_${idx}`] = 'Comments are required';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getCompletionPercentage = () => {
    if (criteria.length === 0) return 0;
    const completed = criteria.filter(c => c.rating && c.comments?.trim()).length;
    return Math.round((completed / criteria.length) * 100);
  };

  const getAverageRating = () => {
    const ratedCriteria = criteria.filter(c => c.rating);
    if (ratedCriteria.length === 0) return 0;
    const sum = ratedCriteria.reduce((acc, c) => acc + (c.rating || 0), 0);
    return (sum / ratedCriteria.length).toFixed(1);
  };

  const renderStarRating = (rating: number, onRatingChange: (rating: number) => void, interactive: boolean = true) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={interactive ? () => onRatingChange(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            disabled={!interactive}
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Validate form
    if (!validateForm()) {
      setSaving(false);
      toast.error('Please complete all required fields');
      return;
    }

    try {
      if (evaluationId) {
        await submitEvaluation(evaluationId, {
          scores: criteria.map(c => ({ criteriaId: c.id, score: c.rating, comments: c.comments }))
        });
        setSuccess(true);
        toast.success('Evaluation submitted successfully!');
        setTimeout(() => navigate('/supervisor/evaluations'), 1500);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.errors?.[0]?.msg || 'Failed to submit evaluation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evaluation...</p>
        </div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <h2 className="text-lg font-medium text-red-800">Error Loading Evaluation</h2>
        </div>
        <p className="mt-2 text-red-700">{error}</p>
        <button
          onClick={() => navigate('/supervisor/evaluations')}
          className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Evaluations
        </button>
      </div>
    </Layout>
  );

  if (!evaluation) return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-8 bg-white shadow rounded-lg p-6 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Evaluation Not Found</h2>
        <p className="text-gray-600 mb-4">The requested evaluation could not be found.</p>
        <button
          onClick={() => navigate('/supervisor/evaluations')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Evaluations
        </button>
      </div>
    </Layout>
  );

  // If no criteria, show message and redirect option
  if (criteria.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-8 bg-white shadow rounded-lg p-6 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Evaluation Criteria</h2>
          <p className="text-gray-600 mb-4">This evaluation has no criteria defined. Please add criteria before completing the evaluation.</p>
          <button
            onClick={() => navigate(`/supervisor/evaluations/${evaluationId}/criteria`)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Target className="h-4 w-4 mr-2" />
            Add Evaluation Criteria
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/supervisor/evaluations')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Evaluations
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingDraft ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                Complete Evaluation
              </h1>
              <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>Employee: {evaluation.employee?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  <span>Type: {evaluation.type}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Due: {evaluation.dueDate ? new Date(evaluation.dueDate).toLocaleDateString() : 'Not set'}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="text-2xl font-bold text-blue-600">{getCompletionPercentage()}%</div>
              <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${getCompletionPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {criteria.filter(c => c.rating && c.comments?.trim()).length}/{criteria.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{getAverageRating()}/5</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-bold text-gray-900 capitalize">{evaluation.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Criteria */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-600" />
            Evaluation Criteria
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {criteria.map((criterion, idx) => (
              <div key={criterion.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {criterion.category}
                      </span>
                      <h3 className="text-lg font-medium text-gray-900">{criterion.name || criterion.criteria}</h3>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      {renderStarRating(criterion.rating || 0, (rating) => handleRatingChange(idx, rating))}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                      <textarea
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          validationErrors[`criterion_${idx}`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        rows={3}
                        placeholder="Provide detailed feedback for this criterion..."
                        value={criterion.comments || ''}
                        onChange={e => handleCommentChange(idx, e.target.value)}
                      />
                      {validationErrors[`criterion_${idx}`] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors[`criterion_${idx}`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* General Comments */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                Overall Performance Summary
              </h3>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Provide overall feedback about the employee's performance, strengths, areas for improvement, and recommendations..."
                value={generalComments}
                onChange={e => setGeneralComments(e.target.value)}
              />
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <p className="text-green-800">Evaluation submitted successfully!</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/supervisor/evaluations')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || getCompletionPercentage() < 100}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                {saving ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default SupervisorEvaluationForm; 