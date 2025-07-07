import React, { useState, useEffect } from 'react';
import surveyService from '../../services/surveyService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';

interface SurveyAnalytics {
  id: string;
  templateName: string;
  responseRate: number;
  averageCompletionTime: number;
  lastCalculatedAt: string;
}

const SurveyMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<SurveyAnalytics[]>([]);
  const [department, setDepartment] = useState('');
  const [surveyType, setSurveyType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportSurveyId, setExportSurveyId] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line
  }, [department, surveyType, dateFrom, dateTo]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (department) params.department = department;
      if (surveyType) params.surveyType = surveyType;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await surveyService.monitorSurveyParticipation(params);
      setAnalytics((res.data?.surveys || res.surveys || []));
    } catch (err: any) {
      setError('Failed to load survey analytics.');
      setAnalytics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (survey: any) => {
    setSelectedSurvey(survey);
    setDetailsModalOpen(true);
  };

  const handleExport = (surveyId: string) => {
    setExportSurveyId(surveyId);
    setExportModalOpen(true);
    setExportError(null);
  };

  const triggerExport = async (format: string) => {
    if (!exportSurveyId) return;
    setExportLoading(true);
    setExportError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const url = `http://localhost:5000/api/surveys/export?surveyId=${exportSurveyId}&format=${format}`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers
      });
      if (!response.ok) {
        setExportError('Failed to export survey. Not authorized or server error.');
        setExportLoading(false);
        return;
      }
      const blob = await response.blob();
      // Determine file extension
      let ext = format;
      if (format === 'excel' || format === 'xlsx') ext = 'xlsx';
      if (format === 'csv') ext = 'csv';
      if (format === 'pdf') ext = 'pdf';
      if (format === 'json') ext = 'json';
      // Create a download link
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `survey_export.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExportModalOpen(false);
    } catch (err) {
      setExportError('Failed to export survey.');
    } finally {
      setExportLoading(false);
    }
  };

  // Map backend analytics to expected frontend structure
  const mappedAnalytics = analytics.map((a) => ({
    templateName: a.title || a.templateName || 'N/A',
    responseRate: typeof a.metrics?.completionRate === 'number' ? a.metrics.completionRate / 100 : 0,
    averageCompletionTime: a.metrics?.averageResponseTime
      ? (a.metrics.averageResponseTime / 60).toFixed(1)
      : 'N/A',
    lastCalculatedAt: a.lastResponse
      ? new Date(a.lastResponse).toLocaleString()
      : 'N/A',
    id: a.surveyId || a.id,
    raw: a,
  }));

  if (user?.role !== 'hr') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          Access denied. You do not have permission to view this page.
        </div>
      </div>
    );
  }

  return (
    <Layout>
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Survey Monitoring</h1>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
          <input
            type="text"
            placeholder="Survey Type"
            value={surveyType}
            onChange={e => setSurveyType(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
        </div>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded">
            <thead>
              <tr>
                <th className="py-3 px-4 border-b text-left font-semibold">Template</th>
                <th className="py-3 px-4 border-b text-left font-semibold">Response Rate</th>
                <th className="py-3 px-4 border-b text-left font-semibold">Avg. Completion (min)</th>
                <th className="py-3 px-4 border-b text-left font-semibold">Last Calculated</th>
                <th className="py-3 px-4 border-b text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : analytics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No survey analytics found.</td>
                </tr>
              ) : (
                mappedAnalytics.map((a, idx) => (
                  <tr key={a.id || idx}>
                    <td className="py-2 px-4">{a.templateName}</td>
                    <td className="py-2 px-4">{(a.responseRate * 100).toFixed(1)}%</td>
                    <td className="py-2 px-4">{a.averageCompletionTime}</td>
                    <td className="py-2 px-4">{a.lastCalculatedAt}</td>
                    <td className="py-2 px-4 text-center">
                      <button
                        className="text-blue-600 hover:underline mr-4"
                        onClick={() => handleViewDetails(a.raw)}
                      >
                        View Details
                      </button>
                      <button
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition mr-2"
                        onClick={() => handleExport(a.id)}
                      >
                        Export
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {detailsModalOpen && selectedSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setDetailsModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Survey Details</h2>
            <div className="space-y-2">
              <div><strong>Title:</strong> {selectedSurvey.title || selectedSurvey.templateName}</div>
              <div><strong>Type:</strong> {selectedSurvey.type}</div>
              <div><strong>Status:</strong> {selectedSurvey.status}</div>
              <div><strong>Created By:</strong> {selectedSurvey.createdBy?.name || 'N/A'} ({selectedSurvey.createdBy?.role || 'N/A'})</div>
              <div><strong>Total Questions:</strong> {selectedSurvey.metrics?.totalQuestions ?? 'N/A'}</div>
              <div><strong>Total Responses:</strong> {selectedSurvey.metrics?.totalResponses ?? 'N/A'}</div>
              <div><strong>Unique Respondents:</strong> {selectedSurvey.metrics?.uniqueRespondents ?? 'N/A'}</div>
              <div><strong>Completion Rate:</strong> {typeof selectedSurvey.metrics?.completionRate === 'number' ? selectedSurvey.metrics.completionRate.toFixed(1) + '%' : 'N/A'}</div>
              <div><strong>Average Response Time:</strong> {selectedSurvey.metrics?.averageResponseTime ? (selectedSurvey.metrics.averageResponseTime / 60).toFixed(1) + ' min' : 'N/A'}</div>
              <div><strong>Last Response:</strong> {selectedSurvey.lastResponse ? new Date(selectedSurvey.lastResponse).toLocaleString() : 'N/A'}</div>
              {/* Add more fields as needed */}
            </div>
            <div className="mt-6 text-right">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => setDetailsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setExportModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-4">Export Survey Results</h2>
              {exportError && <div className="mb-2 text-red-600">{exportError}</div>}
              {exportLoading && <div className="mb-2 text-blue-600">Exporting...</div>}
              {!exportLoading && !exportError && (
                <div className="flex flex-col gap-3">
              <button
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                    onClick={() => triggerExport('csv')}
                disabled={exportLoading}
              >
                    Export as CSV
              </button>
              <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    onClick={() => triggerExport('xlsx')}
                disabled={exportLoading}
              >
                    Export as XLSX
              </button>
              <button
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
                onClick={() => triggerExport('pdf')}
                disabled={exportLoading}
              >
                    Export as PDF
              </button>
              <button
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                onClick={() => triggerExport('json')}
                disabled={exportLoading}
              >
                    Export as JSON
              </button>
            </div>
              )}
              {exportLoading === false && exportError === null && (
                <div className="mt-2 text-green-600">Export completed! Check your downloads.</div>
              )}
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default SurveyMonitoring; 