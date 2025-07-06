import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import surveyService from '../services/surveyService';
import { Survey, SurveyQuestion } from '../types/user';
import { ArrowLeft, CheckCircle, Info } from 'lucide-react';

const SurveyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!id) {
        setError('Survey ID is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await surveyService.getSurveyDetails(id);
        const data = response.data || response;
        setSurvey(data);
        // If already completed, set answers and read-only mode
        if (data.alreadySubmitted || data.status === 'completed') {
          setIsReadOnly(true);
          if (data.responses && data.responses.length > 0 && data.responses[0].questionResponses) {
            const completedAnswers: Record<string, any> = {};
            data.responses[0].questionResponses.forEach((resp: any) => {
              completedAnswers[resp.questionId] = resp.answer || resp.ratingValue || resp.selectedOption;
            });
            setAnswers(completedAnswers);
          }
        } else {
          setIsReadOnly(false);
          setAnswers({});
        }
        setError(null);
      } catch (err) {
        setError('Failed to load the survey. It might not exist or you may not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [id]);

  const handleInputChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting survey...'); // Debug log
    if (!survey) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Prepare answers for backend
      const responses = questions.map(q => {
        const value = answers[q.id];
        return {
          questionId: q.id,
          answer: q.type === 'text' ? value : undefined,
          rating: q.type === 'rating' ? value : undefined,
          selectedOption: q.type === 'multiple_choice' ? value : undefined,
        };
      });
      await surveyService.submitSurveyResponse(survey.id, { responses });
      setSuccess('Survey submitted successfully!');
      setIsReadOnly(true);
      setTimeout(() => navigate('/forms'), 1200);
    } catch (err) {
      setError('Failed to submit survey. Please try again.');
      console.error('Survey submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const value = answers[question.id] || '';
    switch (question.type) {
      case 'text':
        return (
          <textarea
            value={value}
            disabled={isReadOnly}
            onChange={e => handleInputChange(question.id, e.target.value)}
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
                disabled={isReadOnly}
                className={`w-10 h-10 rounded-full ${value === rating ? 'bg-blue-500 text-white' : 'bg-gray-200'} ${!isReadOnly && 'hover:bg-blue-300'}`}
                onClick={() => !isReadOnly && handleInputChange(question.id, rating)}
              >
                {rating}
              </button>
            ))}
          </div>
        );
      case 'multiple_choice':
        return (
          <div className="space-y-2 mt-2">
            {question.options?.map(option => (
              <div key={option} className="flex items-center">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  disabled={isReadOnly}
                  onChange={() => handleInputChange(question.id, option)}
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

  // Use questions from either survey.questions or survey.SurveyQuestions
  const questions = Array.isArray(survey?.questions) && survey.questions.length > 0
    ? survey.questions
    : (Array.isArray(survey?.SurveyQuestions) && survey.SurveyQuestions.length > 0
      ? survey.SurveyQuestions
      : []);

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
  if (!survey) return <Layout><div className="text-center p-8">Survey not found or failed to load.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <Link to="/forms" className="text-blue-600 hover:underline flex items-center">
            <ArrowLeft size={16} className="mr-1" />
            Back to Forms & Surveys
          </Link>
        </div>
        {isReadOnly && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <div className="py-1"><Info className="h-5 w-5 text-blue-500 mr-3" /></div>
              <div>
                <p className="font-bold">This survey is completed or locked.</p>
                <p className="text-sm">Your answers are displayed below in read-only mode.</p>
              </div>
            </div>
          </div>
        )}
        {success && <div className="mb-4 text-green-700 bg-green-100 border border-green-300 rounded p-3">{success}</div>}
        {error && <div className="mb-4 text-red-700 bg-red-100 border border-red-300 rounded p-3">{error}</div>}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800">{survey.title}</h1>
          <p className="text-gray-600 mt-2">{survey.description}</p>
          <hr className="my-6" />
          {questions.length === 0 ? (
            <div className="text-center text-gray-500">No questions found for this survey.</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {questions.map(question => (
                <div key={question.id} className="mb-6">
                  <label className="block text-lg font-semibold text-gray-800">
                    {question.text || question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="mt-2">
                    {renderQuestion({
                      ...question,
                      text: question.text || question.question
                    })}
                  </div>
                </div>
              ))}
              {!isReadOnly && (
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mt-4"
                  disabled={loading}
                  onClick={e => { e.preventDefault(); handleSubmit(e as any); }}
                >
                  Submit
                </button>
              )}
              {isReadOnly && (
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center bg-green-100 text-green-800 text-lg font-semibold px-6 py-3 rounded-lg">
                    <CheckCircle className="mr-3" />
                    Survey Completed
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SurveyDetail; 