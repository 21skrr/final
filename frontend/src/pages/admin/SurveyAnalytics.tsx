import React, { useState, useEffect } from 'react';
import surveyService from '../../services/surveyService';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Layout from '../../components/layout/Layout';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SurveyAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');

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
    setExportSuccess('');
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`http://localhost:5000/api/surveys/export?format=${format}`, {
        method: 'GET',
        credentials: 'include',
        headers
      });
      if (!res.ok) throw new Error('Failed to export analytics.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `survey-analytics-export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      setExportSuccess('Export completed! Check your downloads.');
      setTimeout(() => setExportSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to export analytics.');
    } finally {
      setExporting(false);
    }
  };

  // Add chart data preparation (mock if needed)
  const trendLabels = analytics?.trendLabels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const responseRateData = analytics?.responseRateTrend || [0.7, 0.8, 0.85, 0.9];
  const completionRateData = analytics?.completionRateTrend || [0.6, 0.7, 0.8, 0.85];
  const satisfactionData = analytics?.satisfactionTrend || [4.1, 4.3, 4.2, 4.4];

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
  };

  return (
    <Layout>
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
                <h2 className="text-lg font-semibold mb-4">Trends Over Time</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Line
                      data={{
                        labels: trendLabels,
                        datasets: [
                          {
                            label: 'Response Rate',
                            data: responseRateData.map(x => x * 100),
                            borderColor: 'rgb(37, 99, 235)',
                            backgroundColor: 'rgba(37, 99, 235, 0.2)',
                            tension: 0.3,
                          },
                        ],
                      }}
                      options={{ ...chartOptions, scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } } } }}
                    />
                    <div className="mt-2 text-gray-600">Response Rate</div>
                  </div>
                  <div>
                    <Line
                      data={{
                        labels: trendLabels,
                        datasets: [
                          {
                            label: 'Completion Rate',
                            data: completionRateData.map(x => x * 100),
                            borderColor: 'rgb(16, 185, 129)',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            tension: 0.3,
                          },
                        ],
                      }}
                      options={{ ...chartOptions, scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } } } }}
                    />
                    <div className="mt-2 text-gray-600">Completion Rate</div>
                  </div>
                  <div>
                    <Line
                      data={{
                        labels: trendLabels,
                        datasets: [
                          {
                            label: 'Satisfaction',
                            data: satisfactionData,
                            borderColor: 'rgb(234, 179, 8)',
                            backgroundColor: 'rgba(234, 179, 8, 0.2)',
                            tension: 0.3,
                          },
                        ],
                      }}
                      options={{ ...chartOptions, scales: { y: { min: 0, max: 5, stepSize: 1 } } }}
                    />
                    <div className="mt-2 text-gray-600">Satisfaction</div>
                  </div>
                </div>
            </div>
              {exportSuccess && <div className="mb-4 text-green-600">{exportSuccess}</div>}
              {error && <div className="mb-4 text-red-600">{error}</div>}
            <div className="flex gap-4">
              <button
                onClick={() => handleExport('csv')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                disabled={exporting}
              >
                  {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                disabled={exporting}
              >
                  {exporting ? 'Exporting...' : 'Export XLSX'}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
    </Layout>
  );
};

export default SurveyAnalytics; 