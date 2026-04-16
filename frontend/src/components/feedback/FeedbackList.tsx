import React from 'react';
import { MessageSquare, Clock, User, Eye, EyeOff, Reply, Flag } from 'lucide-react';
import { Feedback, FeedbackStatus, FeedbackType } from '../../types/feedback';

interface FeedbackListProps {
  feedbacks: Feedback[];
  userRole: string;
  onRespond?: (feedbackId: string) => void;
  onView?: (feedbackId: string) => void;
  onCategorize?: (feedbackId: string) => void;
  onEscalate?: (feedbackId: string) => void;
}

const FeedbackList: React.FC<FeedbackListProps> = ({
  feedbacks,
  userRole,
  onRespond,
  onView,
  onCategorize,
  onEscalate,
}) => {
  const getStatusColor = (status: FeedbackStatus | string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'pending_supervisor': return 'bg-amber-100 text-amber-800';
      case 'pending_hr': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'addressed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'supervisor_rejected': return 'bg-red-100 text-red-800';
      case 'hr_rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: FeedbackStatus | string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'pending_supervisor': return 'Awaiting Supervisor';
      case 'pending_hr': return 'Awaiting HR';
      case 'in-progress': return 'In Progress';
      case 'addressed': return 'Addressed';
      case 'approved': return 'Approved ✓';
      case 'supervisor_rejected': return 'Rejected by Supervisor';
      case 'hr_rejected': return 'Rejected by HR';
      default: return status;
    }
  };

  const getTypeColor = (type: FeedbackType) => {
    switch (type) {
      case 'onboarding': return 'bg-purple-100 text-purple-800';
      case 'training': return 'bg-indigo-100 text-indigo-800';
      case 'support': return 'bg-orange-100 text-orange-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      case 'holiday_request': return 'bg-orange-100 text-orange-700';
      case 'administrative_paper': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: FeedbackType) => {
    switch (type) {
      case 'holiday_request': return 'Holiday Request';
      case 'administrative_paper': return 'Admin Paper Request';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canRespond = (feedback: Feedback) => {
    return userRole === 'supervisor' && feedback.status !== 'addressed';
  };

  const canCategorize = () => userRole === 'hr';
  const canEscalate = () => userRole === 'hr';

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {userRole === 'employee' ? 'Start by submitting feedback.' : 'No feedback available.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <div key={feedback.id} id={`feedback-${feedback.id}`} className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex-shrink-0">
                    {feedback.isAnonymous ? (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <EyeOff className="h-4 w-4 text-gray-600" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {feedback.isAnonymous && userRole !== 'hr' ? 'Anonymous' : feedback.sender?.name || 'Unknown'}
                      </h3>
                      {feedback.isAnonymous && userRole === 'hr' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Anonymous to others
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                        {getStatusLabel(feedback.status)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(feedback.type)}`}>
                        {getTypeLabel(feedback.type)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(feedback.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="ml-11">
                  <p className="text-sm text-gray-700 mb-3">{feedback.message}</p>

                  {/* Show rejection reason when applicable */}
                  {feedback.status === 'supervisor_rejected' && feedback.supervisorRejectionReason && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-medium text-red-700 mb-0.5">Rejected by Supervisor:</p>
                      <p className="text-sm text-red-600">{feedback.supervisorRejectionReason}</p>
                    </div>
                  )}
                  {feedback.status === 'hr_rejected' && feedback.hrRejectionReason && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-medium text-red-700 mb-0.5">Rejected by HR:</p>
                      <p className="text-sm text-red-600">{feedback.hrRejectionReason}</p>
                    </div>
                  )}
                  {Array.isArray(feedback.categories) && feedback.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {feedback.categories.map((category) => (
                        <span
                          key={category}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}

                  {feedback.priority && (
                    <div className="mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        feedback.priority === 'high' ? 'bg-red-100 text-red-800' :
                        feedback.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        Priority: {feedback.priority}
                      </span>
                    </div>
                  )}

                  {feedback.notes && feedback.notes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Responses</h4>
                      {feedback.notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 rounded-md p-3 mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              {note.supervisor?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                {canRespond(feedback) && (
                  <button
                    onClick={() => onRespond?.(feedback.id)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Respond
                  </button>
                )}

                {canCategorize() && (
                  <button
                    onClick={() => onCategorize?.(feedback.id)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
                  >
                    <Flag className="h-3 w-3 mr-1" />
                    Categorize
                  </button>
                )}

                {canEscalate() && (
                  <button
                    onClick={() => onEscalate?.(feedback.id)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    <Flag className="h-3 w-3 mr-1" />
                    Escalate
                  </button>
                )}

                {onView && (
                  <button
                    onClick={() => onView?.(feedback.id)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeedbackList; 