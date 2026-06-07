import React, { useState, useEffect, useCallback } from 'react';
import surveyService from '../../services/surveyService';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import {
  BarChart2, Search, Filter, Download, Eye, X, RefreshCw,
  FileText, Users, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, ChevronDown
} from 'lucide-react';

interface SurveyRow {
  id: string;
  templateName: string;
  type: string;
  status: string;
  responseRate: number;
  totalResponses: number;
  uniqueRespondents: number;
  completionRate: number;
  avgCompletionTime: string;
  lastResponse: string;
  raw: any;
}

const TYPE_COLOR: Record<string, string> = {
  '3-month':  'bg-violet-100 text-violet-700 border-violet-200',
  '6-month':  'bg-blue-100 text-blue-700 border-blue-200',
  '12-month': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  training:   'bg-amber-100 text-amber-700 border-amber-200',
  general:    'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const STATUS_COLOR: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  draft:     'bg-gray-100 text-gray-600 border-gray-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
};

const SurveyMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [department, setDepartment] = useState('');
  const [surveyType, setSurveyType] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailSurvey, setDetailSurvey] = useState<any>(null);
  const [exportModal, setExportModal] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (department) params.department = department;
      if (surveyType) params.surveyType = surveyType;
      const res = await surveyService.monitorSurveyParticipation(params);
      const surveys = res.data?.surveys || res.surveys || [];
      const mapped: SurveyRow[] = surveys.map((a: any) => ({
        id: a.surveyId || a.id,
        templateName: a.title || a.templateName || 'N/A',
        type: a.type || 'general',
        status: a.status || 'active',
        responseRate: typeof a.metrics?.completionRate === 'number' ? a.metrics.completionRate : 0,
        totalResponses: a.metrics?.totalResponses ?? 0,
        uniqueRespondents: a.metrics?.uniqueRespondents ?? 0,
        completionRate: typeof a.metrics?.completionRate === 'number' ? a.metrics.completionRate : 0,
        avgCompletionTime: a.metrics?.averageResponseTime ? (a.metrics.averageResponseTime / 60).toFixed(1) + ' min' : '—',
        lastResponse: a.lastResponse ? new Date(a.lastResponse).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
        raw: a,
      }));
      setRows(mapped);
    } catch {
      setError('Failed to load survey data.');
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [department, surveyType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const triggerExport = async (format: string) => {
    if (!exportModal) return;
    setExportLoading(true);
    setExportError(null);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const url = `http://localhost:5000/api/surveys/export?surveyId=${exportModal}&format=${format}`;
      const response = await fetch(url, { method: 'GET', credentials: 'include', headers });
      if (!response.ok) { setExportError('Export failed. Try again.'); return; }
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `survey_export.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExportModal(null);
    } catch { setExportError('Export failed.'); }
    finally { setExportLoading(false); }
  };

  const filtered = rows.filter(r =>
    r.templateName.toLowerCase().includes(search.toLowerCase())
  );

  const totalResponses = rows.reduce((s, r) => s + r.totalResponses, 0);
  const avgCompletion = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.completionRate, 0) / rows.length) : 0;
  const activeSurveys = rows.filter(r => r.status === 'active').length;

  if (user?.role !== 'hr') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-16 px-4 text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-2xl">
            <AlertTriangle size={24} className="mx-auto mb-2" />
            Access denied. HR role required.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #002e6d 0%, #224f7d 60%, #2b6298 100%)' }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 40%, white 0%, transparent 60%)' }} />
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 size={16} className="text-blue-300" />
                <span className="text-blue-300 text-sm font-medium">HR Admin</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Survey Monitoring</h1>
              <p className="text-blue-200 text-sm mt-1">Track participation, completion and response activity across all surveys</p>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium backdrop-blur transition-all"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Surveys', value: rows.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Surveys', value: activeSurveys, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Responses', value: totalResponses, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Avg. Completion', value: `${avgCompletion}%`, icon: CheckCircle2, color: avgCompletion >= 70 ? 'text-emerald-600' : avgCompletion >= 40 ? 'text-amber-500' : 'text-red-500', bg: avgCompletion >= 70 ? 'bg-emerald-50' : avgCompletion >= 40 ? 'bg-amber-50' : 'bg-red-50' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
                <k.icon size={20} className={k.color} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{k.value}</div>
                <div className="text-xs text-gray-500 font-medium">{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters + Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Filter bar */}
          <div className="p-5 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search surveys..."
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div className="relative">
              <select
                value={surveyType}
                onChange={e => setSurveyType(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="3-month">3-Month</option>
                <option value="6-month">6-Month</option>
                <option value="12-month">12-Month</option>
                <option value="training">Training</option>
                <option value="general">General</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <input
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="Department..."
              className="pl-3 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
            />
          </div>

          {error && (
            <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Survey', 'Type', 'Status', 'Responses', 'Completion', 'Last Response', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                    Loading surveys...
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <FileText size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-400 text-sm">{search ? `No results for "${search}"` : 'No survey data available.'}</p>
                  </td></tr>
                ) : filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-900 max-w-xs truncate">{row.templateName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLOR[row.type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOR[row.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-900">{row.totalResponses}</td>
                    <td className="px-4 py-3.5 w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${row.completionRate >= 70 ? 'bg-emerald-500' : row.completionRate >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.min(row.completionRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-8">{row.completionRate.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{row.lastResponse}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetailSurvey(row.raw)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          onClick={() => { setExportModal(row.id); setExportError(null); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Download size={12} /> Export
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {detailSurvey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
              <button onClick={() => setDetailSurvey(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold text-gray-900 mb-5 pr-8">Survey Details</h2>
              <div className="space-y-3">
                {[
                  { label: 'Title', value: detailSurvey.title || detailSurvey.templateName },
                  { label: 'Type', value: detailSurvey.type },
                  { label: 'Status', value: detailSurvey.status },
                  { label: 'Total Questions', value: detailSurvey.metrics?.totalQuestions ?? '—' },
                  { label: 'Total Responses', value: detailSurvey.metrics?.totalResponses ?? '—' },
                  { label: 'Unique Respondents', value: detailSurvey.metrics?.uniqueRespondents ?? '—' },
                  { label: 'Completion Rate', value: typeof detailSurvey.metrics?.completionRate === 'number' ? `${detailSurvey.metrics.completionRate.toFixed(1)}%` : '—' },
                  { label: 'Avg. Response Time', value: detailSurvey.metrics?.averageResponseTime ? `${(detailSurvey.metrics.averageResponseTime / 60).toFixed(1)} min` : '—' },
                  { label: 'Last Response', value: detailSurvey.lastResponse ? new Date(detailSurvey.lastResponse).toLocaleString() : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setDetailSurvey(null)} className="w-full mt-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">Close</button>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {exportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
              <button onClick={() => setExportModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Export Survey Results</h2>
              <p className="text-sm text-gray-500 mb-5">Choose a format to download the data</p>
              {exportError && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{exportError}</div>}
              {exportLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
                  <span className="ml-3 text-sm text-gray-600">Exporting...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { fmt: 'csv', label: 'CSV', color: 'bg-emerald-600 hover:bg-emerald-700' },
                    { fmt: 'xlsx', label: 'Excel', color: 'bg-blue-600 hover:bg-blue-700' },
                    { fmt: 'pdf', label: 'PDF', color: 'bg-amber-600 hover:bg-amber-700' },
                    { fmt: 'json', label: 'JSON', color: 'bg-slate-600 hover:bg-slate-700' },
                  ].map(({ fmt, label, color }) => (
                    <button key={fmt} onClick={() => triggerExport(fmt)}
                      className={`${color} text-white py-2.5 rounded-xl text-sm font-semibold transition-colors`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SurveyMonitoring;