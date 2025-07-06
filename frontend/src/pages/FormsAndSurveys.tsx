import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { FileText, Edit, AlertCircle, History, Calendar, BarChart2, MessageSquare, Settings } from 'lucide-react';
import surveyService from '../services/surveyService';
import { Survey, SurveyStatus } from '../types/survey';
import { useAuth } from '../context/AuthContext';

const getStatusStyles = (status: SurveyStatus) => {
  switch (status) {
    case 'Pending':
      return {
        badge: 'bg-yellow-100 text-yellow-800',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonText: 'Start',
      };
    case 'In progress':
      return {
        badge: 'bg-blue-100 text-blue-800',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonText: 'Continue',
      };
    case 'Completed':
      return {
        badge: 'bg-green-100 text-green-800',
        button: 'bg-green-600 text-white cursor-not-allowed',
        buttonText: 'Completed',
      };
    default:
      // Fallback for any unknown status
      return {
        badge: 'bg-gray-100 text-gray-800',
        button: 'bg-gray-500 hover:bg-gray-600 text-white',
        buttonText: 'View',
      };
  }
};

const SurveyCard: React.FC<{ survey: Survey }> = ({ survey }) => {
  const navigate = useNavigate();
  const styles = getStatusStyles(survey.status);

  const handleAction = () => {
    if (survey.status !== 'Completed') {
      navigate(`/surveys/${survey.id}`);
    }
  };

  const icon = survey.type === 'form' 
    ? <Edit size={24} className="text-blue-500" />
    : <FileText size={24} className="text-purple-500" />;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-gray-100 rounded-lg">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{survey.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
              <p className="text-sm text-gray-500 mt-3">
                <span className="font-medium">Due:</span> {new Date(survey.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles.badge}`}>
              {survey.status}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-600">{survey.progress || 0}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${survey.progress || 0}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-6 text-right">
          <button onClick={handleAction} className={`px-5 py-2 text-sm font-semibold rounded-md transition-colors ${styles.button}`} disabled={survey.status === 'Completed'}>
            {styles.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

const HRSurveyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const features = [
    { name: 'Survey Templates', path: '/admin/survey-templates', icon: Edit, description: 'Create and manage reusable survey templates.' },
    { name: 'Schedule Surveys', path: '/admin/surveys/schedule', icon: Calendar, description: 'Schedule surveys for specific roles or programs.' },
    { name: 'Monitor Surveys', path: '/admin/survey-monitoring', icon: BarChart2, description: 'Track survey progress and view participation.' },
    { name: 'Survey Settings', path: '/admin/survey-settings', icon: Settings, description: 'Configure global settings for all surveys.' }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Survey Management</h1>
          <p className="mt-2 text-gray-600">
            Administer all survey-related activities from one place.
          </p>
        </div>
        <Link to="/surveys/history" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">
          <History size={16} className="mr-2" />
          View My History
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <div
            key={feature.name}
            onClick={() => navigate(feature.path)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer flex items-start space-x-4"
          >
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
              <feature.icon size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{feature.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FormsAndSurveys: React.FC = () => {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        const response = await surveyService.getAvailableSurveys();
        
        // The response is the full Axios response object, the actual data is in `response.data`
        const surveysData = (response as any).data;

        if (Array.isArray(surveysData)) {
          setSurveys(surveysData);
        } else if (surveysData && Array.isArray(surveysData.surveys)) {
          // Handle cases where the data is nested under a 'surveys' key
          setSurveys(surveysData.surveys);
        } else {
          console.error("Unexpected response data format:", surveysData);
          setError('Failed to fetch surveys due to unexpected data format.');
          setSurveys([]); // Set to empty array to prevent filter error
        }
      } catch (err) {
        setError('Failed to fetch surveys. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);
  
  const pendingForms = surveys.filter(s => s.status === 'Pending' || s.status === 'In progress');

  if (user?.role !== 'employee') {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user?.role === 'hr' ? (
          <HRSurveyDashboard />
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Forms & Surveys</h1>
                <p className="mt-2 text-gray-600">
                  Complete required forms and provide valuable feedback
                </p>
              </div>
              <Link to="/surveys/history" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">
                <History size={16} className="mr-2" />
                View History
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {surveys.map((survey) => (
                <SurveyCard key={survey.id} survey={survey} />
              ))}
            </div>

            {pendingForms.length > 0 && (
              <div className="mt-10 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <span className="font-semibold">Pending Forms</span> &mdash; You have forms or surveys that need to be completed. Please review and submit them before their due dates.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default FormsAndSurveys;