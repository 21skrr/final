import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../components/layout/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvaluationById } from '../../services/evaluationService';
import { Evaluation, EvaluationCriteria } from '../../types/evaluation';
import { 
  Star, 
  User, 
  Calendar, 
  Target, 
  MessageSquare, 
  ArrowLeft, 
  CheckCircle, 
  Award,
  FileText,
  TrendingUp,
  Clock,
  Download,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SupervisorEvaluationReport: React.FC = () => {
  const { evaluationId } = useParams();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        if (evaluationId) {
          const response = await getEvaluationById(evaluationId);
          setEvaluation(response.data);
          setCriteria(response.data.criteria || []);
        }
      } catch (err) {
        setError('Failed to load evaluation report');
        toast.error('Failed to load evaluation report');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();
  }, [evaluationId]);

  const getAverageRating = () => {
    const ratedCriteria = criteria.filter(c => c.rating);
    if (ratedCriteria.length === 0) return 0;
    const sum = ratedCriteria.reduce((acc, c) => acc + (c.rating || 0), 0);
    return (sum / ratedCriteria.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    criteria.forEach(c => {
      if (c.rating && c.rating >= 1 && c.rating <= 5) {
        distribution[c.rating as keyof typeof distribution]++;
      }
    });
    return distribution;
  };

  const getCategoryBreakdown = () => {
    const categories: { [key: string]: { count: number; totalRating: number; avgRating: number } } = {};
    criteria.forEach(c => {
      const category = c.category || 'General';
      if (!categories[category]) {
        categories[category] = { count: 0, totalRating: 0, avgRating: 0 };
      }
      categories[category].count++;
      if (c.rating) {
        categories[category].totalRating += c.rating;
      }
    });
    
    Object.keys(categories).forEach(category => {
      categories[category].avgRating = categories[category].count > 0 
        ? categories[category].totalRating / categories[category].count 
        : 0;
    });
    
    return categories;
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  const handleDownloadReport = async () => {
    if (!reportRef.current || !evaluation) {
      toast.error('Unable to generate report');
      return;
    }

    setDownloading(true);
    try {
      // Create a temporary container for PDF generation
      const reportElement = reportRef.current;
      
      // Configure html2canvas options
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: reportElement.scrollWidth,
        height: reportElement.scrollHeight,
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Add header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Evaluation Report', pdfWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Employee: ${evaluation.employee?.name || 'Unknown'}`, 20, 30);
      pdf.text(`Type: ${evaluation.type}`, 20, 35);
      pdf.text(`Completed: ${evaluation.completedAt ? new Date(evaluation.completedAt).toLocaleDateString() : 'Not completed'}`, 20, 40);
      pdf.text(`Overall Rating: ${getAverageRating()}/5`, 20, 45);

      // Add the report content as image
      pdf.addImage(imgData, 'PNG', imgX, imgY + 40, imgWidth * ratio, imgHeight * ratio);

      // Generate filename
      const employeeName = evaluation.employee?.name?.replace(/\s+/g, '_') || 'Unknown';
      const evaluationType = evaluation.type.replace(/\s+/g, '_');
      const date = evaluation.completedAt ? new Date(evaluation.completedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const filename = `Evaluation_Report_${employeeName}_${evaluationType}_${date}.pdf`;

      // Save the PDF
      pdf.save(filename);
      
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evaluation report...</p>
        </div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-red-400 mr-2" />
          <h2 className="text-lg font-medium text-red-800">Error Loading Report</h2>
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
        <h2 className="text-xl font-bold text-gray-900 mb-2">Evaluation Report Not Found</h2>
        <p className="text-gray-600 mb-4">The requested evaluation report could not be found.</p>
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

  const ratingDistribution = getRatingDistribution();
  const categoryBreakdown = getCategoryBreakdown();

  return (
    <Layout>
      <div ref={reportRef} className="max-w-6xl mx-auto p-6 space-y-6">
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
            <button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Generating PDF...' : 'Download Report'}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                Evaluation Report
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
                  <span>Completed: {evaluation.completedAt ? new Date(evaluation.completedAt).toLocaleDateString() : 'Not completed'}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">Overall Rating</div>
              <div className="text-3xl font-bold text-blue-600">{getAverageRating()}/5</div>
              <div className="flex items-center justify-center mt-1">
                {renderStarRating(parseFloat(getAverageRating()))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Criteria</p>
                <p className="text-2xl font-bold text-gray-900">{criteria.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{getAverageRating()}/5</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Highest Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.max(...criteria.map(c => c.rating || 0), 0)}/5
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-bold text-gray-900 capitalize">{evaluation.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
            Rating Distribution
          </h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center">
                <div className="w-8 text-sm font-medium text-gray-600">{rating}★</div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${criteria.length > 0 ? (ratingDistribution[rating as keyof typeof ratingDistribution] / criteria.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 text-sm text-gray-600 text-right">
                  {ratingDistribution[rating as keyof typeof ratingDistribution]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-green-600" />
            Category Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryBreakdown).map(([category, data]) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{category}</h3>
                  <span className="text-sm text-gray-600">{data.count} criteria</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Rating:</span>
                  <div className="flex items-center">
                    {renderStarRating(data.avgRating)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Criteria */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-orange-600" />
            Detailed Criteria Assessment
          </h2>
          <div className="space-y-4">
            {criteria.map((criterion, idx) => (
              <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
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
                      {renderStarRating(criterion.rating || 0)}
                    </div>
                    
                    {criterion.comments && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                          {criterion.comments}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Comments */}
        {evaluation.comments && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
              Overall Performance Summary
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{evaluation.comments}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupervisorEvaluationReport;
