import React, { useState, useEffect } from 'react';
import surveyService from '../../services/surveyService';

const SurveyAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await surveyService.monitorSurveyParticipation();
      setAnalytics(res.data || res);
    } catch (err: any) {
      setError('Failed to load analytics.');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(true);
    setError(null);
    try {
      const res = await surveyService.exportSurveyResults({ format });
      // Assume backend returns a Blob or file URL
      const blob = new Blob([res.data], { type: format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `survey-analytics-export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      setError('Failed to export analytics.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Survey Analytics</h1>
        {loading ? (
          <div className="mb-4 text-gray-400">Loading...</div>
        ) : error ? (
          <div className="mb-4 text-red-600">{error}</div>
        ) : analytics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded p-4 text-center">
                <div className="text-3xl font-bold">{(analytics.responseRate * 100).toFixed(1)}%</div>
                <div className="text-gray-600 mt-2">Response Rate</div>
              </div>
              <div className="bg-green-50 rounded p-4 text-center">
                <div className="text-3xl font-bold">{(analytics.completionRate * 100).toFixed(1)}%</div>
                <div className="text-gray-600 mt-2">Completion Rate</div>
              </div>
              <div className="bg-yellow-50 rounded p-4 text-center">
                <div className="text-3xl font-bold">{analytics.satisfaction?.toFixed(1) || '-'} / 5</div>
                <div className="text-gray-600 mt-2">Avg. Satisfaction</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border rounded p-4 text-center">
                <div className="text-2xl font-bold">{analytics.totalSurveys || '-'}</div>
                <div className="text-gray-600 mt-2">Total Surveys</div>
              </div>
              <div className="bg-white border rounded p-4 text-center">
                <div className="text-2xl font-bold">{analytics.totalResponses || '-'}</div>
                <div className="text-gray-600 mt-2">Total Responses</div>
              </div>
            </div>
            {/* Placeholder for charts */}
            <div className="bg-gray-50 rounded p-8 text-center mb-8">
              <div className="text-gray-400">[Charts/Graphs Placeholder]</div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleExport('csv')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                disabled={exporting}
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                disabled={exporting}
              >
                Export XLSX
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default SurveyAnalytics; 