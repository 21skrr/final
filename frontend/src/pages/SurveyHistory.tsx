import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import surveyService from '../services/surveyService';
import { Survey } from '../types/survey';
import { Link } from 'react-router-dom';
import { History, FileText } from 'lucide-react';

interface SurveyHistoryItem {
  id: string; // This is the surveyResponseId
  submittedAt: string;
  survey: Survey; // The nested survey object with the correct surveyId
}

const SurveyHistory: React.FC = () => {
  const [completedSurveys, setCompletedSurveys] = useState<SurveyHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await surveyService.getSurveyHistory();
        setCompletedSurveys(response.data);
      } catch (error) {
        console.error("Failed to fetch survey history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Survey History</h1>
          <p className="mt-2 text-gray-600">A record of all the surveys and forms you have completed.</p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {loading ? (
              <li className="p-6 text-center">Loading history...</li>
            ) : completedSurveys.length === 0 ? (
              <li className="p-6 text-center text-gray-500">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No History Found</h3>
                <p className="mt-1 text-sm text-gray-500">You have not completed any surveys yet.</p>
              </li>
            ) : (
              completedSurveys.map(historyItem => (
                <li key={historyItem.id}>
                  <Link to={`/surveys/${historyItem.survey.id}`} className="block hover:bg-gray-50 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-6 w-6 text-gray-400 mr-4"/>
                        <div>
                          <p className="text-md font-semibold text-blue-600">{historyItem.survey.title}</p>
                          <p className="text-sm text-gray-500">Completed on: {new Date(historyItem.submittedAt || '').toLocaleDateString()}</p>
                        </div>
                      </div>
                       <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                         Completed
                       </span>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default SurveyHistory;