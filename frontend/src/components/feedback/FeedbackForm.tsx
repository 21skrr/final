import React, { useState } from 'react';
import { Send, Calendar, FileText } from 'lucide-react';
import { FeedbackType, CreateFeedbackRequest, SPECIAL_REQUEST_TYPES } from '../../types/feedback';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { DateRange } from 'react-day-picker';

interface FeedbackFormProps {
  onSubmit?: (feedback: CreateFeedbackRequest) => Promise<void> | void;
  onCancel?: () => void;
}

const requestTypes: { value: FeedbackType; label: string; icon?: React.ReactNode; description: string }[] = [
  { value: 'general', label: 'General Feedback', description: 'Share general thoughts or suggestions', icon: <FileText className="w-4 h-4" /> },
  { value: 'onboarding', label: 'Onboarding Process', description: 'Feedback about your onboarding experience', icon: <FileText className="w-4 h-4" /> },
  { value: 'training', label: 'Training & Development', description: 'Feedback related to training programs', icon: <FileText className="w-4 h-4" /> },
  { value: 'support', label: 'Support & Resources', description: 'Issues with resources or support received', icon: <FileText className="w-4 h-4" /> },
  { value: 'holiday_request', label: 'Holiday Request', description: 'Submit a request for time off — sent to your supervisor then HR', icon: <Calendar className="w-4 h-4 text-orange-500" /> },
  { value: 'administrative_paper', label: 'Administrative Paper Request', description: 'Request administrative documents — sent directly to HR', icon: <FileText className="w-4 h-4 text-blue-500" /> },
];

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateFeedbackRequest>({
    content: '',
    type: 'general',
    isAnonymous: false,
    shareWithSupervisor: false,
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const isSpecialRequest = SPECIAL_REQUEST_TYPES.includes(formData.type);

  const handleTypeChange = (type: FeedbackType) => {
    setFormData(prev => ({
      ...prev,
      type,
      isAnonymous: SPECIAL_REQUEST_TYPES.includes(type) ? false : prev.isAnonymous,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let finalContent = formData.content;
      if (formData.type === 'holiday_request' && dateRange?.from) {
        const fromStr = dateRange.from.toLocaleDateString('en-GB');
        const toStr = dateRange.to ? dateRange.to.toLocaleDateString('en-GB') : fromStr;
        finalContent = `Requested Dates: ${fromStr} – ${toStr}\n\n${finalContent}`;
      }
      await onSubmit?.({ ...formData, content: finalContent });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className={`p-4 text-white flex items-center gap-2 ${
        formData.type === 'holiday_request' ? 'bg-orange-500' : 'bg-blue-600'
      }`}>
        <Send className="h-5 w-5" />
        <h2 className="text-lg font-medium !text-white">New Request</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Request Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Request Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {requestTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeChange(type.value)}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all duration-150 ${
                  formData.type === type.value
                    ? type.value === 'holiday_request'
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="mt-0.5 flex-shrink-0">{type.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${formData.type === type.value ? 'text-gray-900' : 'text-gray-700'}`}>
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Workflow indicator */}
        {formData.type === 'holiday_request' && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>
              This request will be sent to your <strong>Supervisor</strong> first. If approved, it is forwarded to <strong>HR</strong> for final decision.
            </span>
          </div>
        )}
        {formData.type === 'administrative_paper' && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>This request will be sent <strong>directly to HR</strong> for processing.</span>
          </div>
        )}

        {/* Priority (hidden for special request types) */}
        {!isSpecialRequest && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
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
        )}

        {/* Calendar for Holiday Request */}
        {formData.type === 'holiday_request' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Dates</label>
            <div className="flex justify-center bg-white p-2 border rounded-lg shadow-sm overflow-x-auto">
              <CalendarComponent
                mode="range"
                defaultMonth={dateRange?.from || new Date()}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="rounded-lg"
                disabled={{ before: new Date() }}
              />
            </div>
            {dateRange?.from && (
              <p className="mt-2 text-xs text-orange-700 font-medium text-center">
                Selected: {dateRange.from.toLocaleDateString('en-GB')}
                {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime()
                  ? ` – ${dateRange.to.toLocaleDateString('en-GB')}`
                  : ''}
              </p>
            )}
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.type === 'holiday_request'
              ? 'Additional Notes (optional)'
              : formData.type === 'administrative_paper'
              ? 'Describe the document(s) you need'
              : 'Message'}
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={3}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder={
              formData.type === 'holiday_request'
                ? 'Add a reason, coverage plan, or any notes for your supervisor...'
                : formData.type === 'administrative_paper'
                ? 'Specify the document(s) you need and any relevant details...'
                : 'Share your feedback, suggestions, or concerns...'
            }
            required={formData.type !== 'holiday_request'}
          />
        </div>

        {/* Anonymous — only shown for standard feedback types */}
        {!isSpecialRequest && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700">
              Submit anonymously
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-2">
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
            disabled={loading || (formData.type !== 'holiday_request' && !formData.content.trim())}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              formData.type === 'holiday_request' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;