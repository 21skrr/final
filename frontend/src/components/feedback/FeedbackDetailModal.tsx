import React from 'react';
import { Feedback } from '../../types/feedback';
import { X } from 'lucide-react';

interface FeedbackDetailModalProps {
  feedback: Feedback | null;
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackDetailModal: React.FC<FeedbackDetailModalProps> = ({ feedback, isOpen, onClose }) => {
  if (!isOpen || !feedback) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Feedback Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <span className="font-semibold">From:</span> {feedback.isAnonymous ? 'Anonymous' : feedback.sender?.name || 'Unknown'}
          </div>
          <div>
            <span className="font-semibold">To:</span> {feedback.receiver?.name || 'N/A'}
          </div>
          <div>
            <span className="font-semibold">Type:</span> <span className="capitalize">{feedback.type}</span>
          </div>
          <div>
            <span className="font-semibold">Status:</span> <span className="capitalize">{feedback.status}</span>
          </div>
          {Array.isArray(feedback.categories) && feedback.categories.length > 0 && (
            <div>
              <span className="font-semibold">Categories:</span> {feedback.categories.map((cat) => (
                <span key={cat} className="inline-block ml-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">{cat}</span>
              ))}
            </div>
          )}
          {feedback.priority && (
            <div>
              <span className="font-semibold">Priority:</span> <span className={`inline-block ml-1 px-2 py-0.5 rounded text-xs ${
                feedback.priority === 'high' ? 'bg-red-100 text-red-800' :
                feedback.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>{feedback.priority}</span>
            </div>
          )}
          <div>
            <span className="font-semibold">Message:</span>
            <div className="mt-1 p-2 bg-gray-50 rounded text-gray-800">{feedback.message}</div>
          </div>
          {feedback.notes && feedback.notes.length > 0 && (
            <div>
              <span className="font-semibold">Responses:</span>
              <div className="mt-1 space-y-2">
                {feedback.notes.map((note) => (
                  <div key={note.id} className="bg-gray-100 rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{note.supervisor?.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-gray-700">{note.note}</div>
                    <div className="text-xs text-gray-500 mt-1">Status: {note.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDetailModal; 