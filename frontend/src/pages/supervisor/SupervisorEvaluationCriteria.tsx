import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useParams } from 'react-router-dom';
import { getEvaluationById, getEvaluationCriteria, addEvaluationCriteria, updateEvaluationCriteria, updateEvaluationComments, deleteEvaluationCriteria } from '../../services/evaluationService';
import { EvaluationCriteria } from '../../types/evaluation';
import { 
  Plus, 
  Star, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  MessageSquare, 
  Target, 
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const SupervisorEvaluationCriteria: React.FC = () => {
  const { evaluationId } = useParams();
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [newCriterion, setNewCriterion] = useState({ 
    category: '', 
    name: '', 
    rating: 3, 
    comments: '' 
  });
  const [generalComments, setGeneralComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [predefinedCategories] = useState([
    'Technical Skills',
    'Communication',
    'Problem Solving',
    'Teamwork',
    'Leadership',
    'Initiative',
    'Quality of Work',
    'Time Management',
    'Adaptability',
    'Customer Focus'
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (evaluationId) {
          const [criteriaResponse, evaluationResponse] = await Promise.all([
            getEvaluationCriteria(evaluationId),
            getEvaluationById(evaluationId)
          ]);
          setCriteria(criteriaResponse.data || []);
          setEvaluation(evaluationResponse.data);
          setGeneralComments(evaluationResponse.data?.comments || '');
        }
      } catch (err) {
        setError('Failed to load evaluation data');
        toast.error('Failed to load evaluation data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [evaluationId]);

  const handleAddCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (evaluationId) {
        await addEvaluationCriteria(evaluationId, newCriterion);
        const response = await getEvaluationCriteria(evaluationId);
        setCriteria(response.data || []);
        setNewCriterion({ category: '', name: '', rating: 3, comments: '' });
        setShowAddForm(false);
        toast.success('Criterion added successfully!');
      }
    } catch (err) {
      setError('Failed to add criterion');
      toast.error('Failed to add criterion');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCriterion = async (id: string, updated: Partial<EvaluationCriteria>) => {
    setSaving(true);
    try {
      // Find the full criterion object
      const fullCriterion = criteria.find(c => c.id === id);
      if (!fullCriterion) throw new Error('Criterion not found');

      // Merge the update with the full object, and map 'name' to 'criteria'
      const payload = {
        category: updated.category ?? fullCriterion.category,
        criteria: updated.criteria ?? updated.name ?? fullCriterion.criteria ?? fullCriterion.name,
        rating: updated.rating ?? fullCriterion.rating,
        comments: updated.comments ?? fullCriterion.comments,
      };

      await updateEvaluationCriteria(id, payload);
      if (evaluationId) {
        const response = await getEvaluationCriteria(evaluationId);
        setCriteria(response.data || []);
      }
    } catch (err) {
      setError('Failed to update criterion');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCriterion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this criterion?')) return;
    
    setSaving(true);
    try {
      await deleteEvaluationCriteria(id);
      setCriteria(prev => prev.filter(c => c.id !== id));
      toast.success('Criterion deleted successfully!');
    } catch (err) {
      setError('Failed to delete criterion');
      toast.error('Failed to delete criterion');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneralComments = async () => {
    setSaving(true);
    try {
      if (evaluationId) {
        await updateEvaluationComments(evaluationId, generalComments);
        toast.success('General comments saved successfully!');
      }
    } catch (err) {
      toast.error('Failed to save general comments');
    } finally {
      setSaving(false);
    }
  };

  const renderStarRating = (rating: number, onRatingChange?: (rating: number) => void, interactive: boolean = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            disabled={!interactive}
          >
            <Star
              className={`h-5 w-5 ${
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

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Target className="h-6 w-6 mr-2 text-blue-600" />
                Manage Evaluation Criteria
              </h1>
              <p className="text-gray-600 mt-1">
                {evaluation?.employee?.name ? `Evaluating: ${evaluation.employee.name}` : 'Evaluation Criteria Management'}
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Aspect
            </button>
          </div>
        </div>

        {/* Add New Criterion Form */}
        {showAddForm && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-green-600" />
              Create New Evaluation Aspect
            </h2>
            <form onSubmit={handleAddCriterion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newCriterion.category}
                    onChange={e => setNewCriterion({ ...newCriterion, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {predefinedCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    <option value="custom">Custom Category</option>
                  </select>
                  {newCriterion.category === 'custom' && (
            <input
              type="text"
                      placeholder="Enter custom category"
                      className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={e => setNewCriterion({ ...newCriterion, category: e.target.value })}
            />
                  )}
          </div>
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Name</label>
            <input
              type="text"
              value={newCriterion.name}
              onChange={e => setNewCriterion({ ...newCriterion, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Problem Solving Ability"
              required
            />
          </div>
              </div>
              
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Rating</label>
                <div className="flex items-center space-x-4">
                  {renderStarRating(newCriterion.rating, (rating) => setNewCriterion({ ...newCriterion, rating }), true)}
                </div>
          </div>
              
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                <textarea
              value={newCriterion.comments}
              onChange={e => setNewCriterion({ ...newCriterion, comments: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add your initial comments about this aspect..."
            />
          </div>
              
              <div className="flex justify-end space-x-3">
          <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
          </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Aspect'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Current Criteria */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
            Evaluation Aspects ({criteria.length})
          </h2>
          
          {criteria.length === 0 ? (
            <div className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No evaluation aspects yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first evaluation aspect.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {criteria.map((criterion, index) => (
                <div key={criterion.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {criterion.category}
                        </span>
                        <h3 className="text-lg font-medium text-gray-900">{criterion.name || criterion.criteria}</h3>
                      </div>
                      
                      <div className="flex items-center space-x-6 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Rating:</span>
                          {editingCriterion === criterion.id ? (
                            renderStarRating(criterion.rating || 0, (rating) => handleUpdateCriterion(criterion.id, { rating }), true)
                          ) : (
                            renderStarRating(criterion.rating || 0)
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Comments</span>
                        </div>
                      </div>
                      
                      {criterion.comments && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700">{criterion.comments}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setEditingCriterion(editingCriterion === criterion.id ? null : criterion.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit rating"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCriterion(criterion.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete aspect"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* General Comments Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
            General Evaluation Comments
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Performance Summary
              </label>
              <textarea
                value={generalComments}
                onChange={e => setGeneralComments(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Provide overall feedback about the employee's performance, strengths, areas for improvement, and recommendations..."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveGeneralComments}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Comments'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {criteria.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Evaluation Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Total Aspects</p>
                    <p className="text-2xl font-bold text-blue-900">{criteria.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Average Rating</p>
                    <p className="text-2xl font-bold text-green-900">
                      {criteria.length > 0 
                        ? (criteria.reduce((sum, c) => sum + (c.rating || 0), 0) / criteria.length).toFixed(1)
                        : '0.0'
                      }/5
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Categories</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {new Set(criteria.map(c => c.category)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupervisorEvaluationCriteria; 