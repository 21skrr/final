import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import surveyService from '../services/surveyService';
import { Survey as SurveyType, SurveyQuestion, SurveyQuestionResponse } from '../types/survey';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, Info } from 'lucide-react';

const SurveyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<SurveyType | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!id) {
        setError("Survey ID is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await surveyService.getSurveyDetails(id);
        const surveyData = response.data;
        setSurvey(surveyData);

        // Check for existing responses to determine if this is a history view
        if (surveyData.responses && surveyData.responses.length > 0) {
          setIsHistoryView(true);
          const answers = surveyData.responses[0].questionResponses.reduce((acc: Record<string, any>, resp: SurveyQuestionResponse) => {
            acc[resp.questionId] = resp.answer || resp.ratingValue || resp.selectedOption;
            return acc;
          }, {});
          setUserAnswers(answers);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to fetch survey details", err);
        setError("Failed to load the survey. It might not exist or you may not have permission to view it.");
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [id]);

  const renderQuestion = (question: SurveyQuestion) => {
    const answer = userAnswers[question.id];
    const isDisabled = isHistoryView;

    switch (question.type) {
      case 'text':
        return (
          <textarea
            value={answer || ''}
            disabled={isDisabled}
            className="w-full mt-2 p-2 border rounded-md bg-gray-100"
            rows={4}
          />
        );
      case 'rating':
        return (
          <div className="flex space-x-2 mt-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                type="button"
                disabled={isDisabled}
                className={`w-10 h-10 rounded-full ${
                  answer === rating ? 'bg-blue-500 text-white' : 'bg-gray-200'
                } ${!isDisabled && 'hover:bg-blue-300'}`}
              >
                {rating}
              </button>
            ))}
          </div>
        );
      case 'multiple_choice':
        return (
          <div className="space-y-2 mt-2">
            {question.options?.map((option: string) => (
              <div key={option} className="flex items-center">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answer === option}
                  disabled={isDisabled}
                  className="mr-2"
                />
                <label>{option}</label>
              </div>
            ))}
          </div>
        );
      default:
        return <p>Unsupported question type</p>;
    }
  };

  if (loading) return <Layout><div className="text-center p-8">Loading survey...</div></Layout>;
  
  if (error) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md max-w-lg mx-auto">
            <p>{error}</p>
          </div>
          <p className="mt-4 text-gray-600">Survey not found.</p>
        </div>
      </Layout>
    );
  }

  if (!survey) return <Layout><div className="text-center p-8">Survey not found.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <Link to="/surveys/history" className="text-blue-600 hover:underline flex items-center">
            <ArrowLeft size={16} className="mr-1" />
            Back to Survey History
          </Link>
        </div>
        
        {isHistoryView && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <div className="py-1"><Info className="h-5 w-5 text-blue-500 mr-3" /></div>
              <div>
                <p className="font-bold">This is a completed survey from your history.</p>
                <p className="text-sm">Your answers are displayed below in read-only mode.</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800">{survey.title}</h1>
          <p className="text-gray-600 mt-2">{survey.description}</p>
          <hr className="my-6" />
          
          <form>
            {survey.SurveyQuestions?.sort((a, b) => a.questionOrder - b.questionOrder).map(question => (
              <div key={question.id} className="mb-6">
                <label className="block text-lg font-semibold text-gray-800">
                  {question.question}
                  {question.required && !isHistoryView && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="mt-2">
                  {renderQuestion(question)}
                </div>
              </div>
            ))}
            
            {isHistoryView && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center bg-green-100 text-green-800 text-lg font-semibold px-6 py-3 rounded-lg">
                  <CheckCircle className="mr-3" />
                  Survey Completed
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default SurveyDetail; 