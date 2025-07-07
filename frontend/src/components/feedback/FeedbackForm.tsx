import React, { useState } from 'react';
import { MessageSquare, Send, Eye, EyeOff } from 'lucide-react';
import { FeedbackType, CreateFeedbackRequest } from '../../types/feedback';
import feedbackService from '../../services/feedbackService';

interface FeedbackFormProps {
  onSubmit?: (feedback: CreateFeedbackRequest) => void;
  onCancel?: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateFeedbackRequest>({
    content: '',
    type: 'general',
    isAnonymous: false,
    shareWithSupervisor: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedbackTypes: { value: FeedbackType; label: string }[] = [
    { value: 'onboarding', label: 'Onboarding Process' },
    { value: 'training', label: 'Training & Development' },
    { value: 'support', label: 'Support & Resources' },
    { value: 'general', label: 'General Feedback' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await feedbackService.submitFeedback(formData);
      onSubmit?.(formData);
      // Reset form
      setFormData({
        content: '',
        type: 'general',
        isAnonymous: false,
        shareWithSupervisor: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateFeedbackRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 bg-blue-600 text-white">
        <h2 className="text-lg font-medium flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Submit Feedback
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value as FeedbackType)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            {feedbackTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Share your feedback, suggestions, or concerns..."
            required
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={formData.isAnonymous}
              onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700">
              Submit anonymously
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="shareWithSupervisor"
              checked={formData.shareWithSupervisor}
              onChange={(e) => handleInputChange('shareWithSupervisor', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="shareWithSupervisor" className="ml-2 block text-sm text-gray-700">
              Share with my supervisor
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !formData.content.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm; 