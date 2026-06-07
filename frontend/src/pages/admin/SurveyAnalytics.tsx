import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import {
  BarChart2, FileText, Users, TrendingUp, CheckCircle2,
  AlertTriangle, RefreshCw, Download, XCircle, Clock,
  Layers, Activity, Award, Target, Search, Zap,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Survey {
  id: string; title: string; type: string; status: string;
  dueDate: string | null; targetRole: string; targetProgram: string;
  isTemplate: boolean; createdAt: string;
}
interface SurveyResponse {
  id: string; surveyId: string; userId: string; status: string; submittedAt: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  '3-month':    'bg-violet-100 text-violet-700 border-violet-200',
  '6-month':    'bg-blue-100  text-blue-700  border-blue-200',
  '12-month':   'bg-indigo-100 text-indigo-700 border-indigo-200',
  training:     'bg-amber-100  text-amber-700  border-amber-200',
  general:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  onboarding:   'bg-pink-100   text-pink-700   border-pink-200',
};
const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  active:    { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Active' },
  draft:     { cls: 'bg-gray-100  text-gray-500  border-gray-200',  label: 'Draft' },
  closed:    { cls: 'bg-red-100   text-red-700   border-red-200',   label: 'Closed' },
  completed: { cls: 'bg-blue-100  text-blue-700  border-blue-200',  label: 'Completed' },
};
const hColor = (p: number) => p >= 70 ? 'text-emerald-600' : p >= 40 ? 'text-amber-500' : 'text-red-500';
const hBg    = (p: number) => p >= 70 ? 'bg-emerald-500'  : p >= 40 ? 'bg-amber-400'   : 'bg-red-400';
const hLabel = (p: number) => p >= 70 ? 'Healthy'         : p >= 40 ? 'Needs attention': 'Critical';
const fmt    = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const isOverdue = (s: Survey) =>
  !!s.dueDate && new Date(s.dueDate) < new Date() && s.status === 'active';

// ─── Component ─────────────────────────────────────────────────────────────────
const SurveyAnalytics: React.FC = () => {
  const [surveys, setSurveys]       = useState<Survey[]>([]);
  const [responses, setResponses]   = useState<SurveyResponse[]>([]);
  const [empCount, setEmpCount]     = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exporting, setExporting]   = useState(false);
  const [exportMsg, setExportMsg]   = useState('');
  const [tab, setTab]               = useState<'overview' | 'surveys' | 'bytype'>('overview');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      // Fetch surveys + all users in parallel
      const [survRes, usersRes] = await Promise.allSettled([
        api.get('/surveys'),
        api.get('/users'),
      ]);

      const rawSurveys: Survey[] = survRes.status === 'fulfilled'
        ? (Array.isArray(survRes.value.data) ? survRes.value.data : []) : [];
      const allUsers: any[] = usersRes.status === 'fulfilled'
        ? (Array.isArray(usersRes.value.data) ? usersRes.value.data : []) : [];

      setEmpCount(allUsers.filter(u => u.role === 'employee').length);

      // Fetch responses for every survey
      const allResponses: SurveyResponse[] = [];
      await Promise.allSettled(
        rawSurveys.map(async s => {
          try {
            const { data } = await api.get(`/surveys/${s.id}/responses`);
            const list: SurveyResponse[] = Array.isArray(data) ? data
              : Array.isArray(data?.responses) ? data.responses : [];
            list.forEach(r => allResponses.push({ ...r, surveyId: s.id }));
          } catch { /* skip */ }
        })
      );

      setSurveys(rawSurveys);
      setResponses(allResponses);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(true); setExportMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/surveys/export?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `survey-analytics.${format}`;
      document.body.appendChild(link); link.click(); link.remove();
      setExportMsg('Export complete!');
      setTimeout(() => setExportMsg(''), 3000);
    } catch { setExportMsg('Export failed.'); }
    finally { setExporting(false); }
  };

  // ─── Derived stats ───────────────────────────────────────────────────────────
  const completedResponses = responses.filter(r => r.status === 'completed');
  const activeSurveys      = surveys.filter(s => s.status === 'active');
  const overdueSurveys     = activeSurveys.filter(isOverdue);
  const totalPossible      = activeSurveys.length * empCount;
  const participationPct   = totalPossible > 0
    ? Math.round((completedResponses.length / totalPossible) * 100) : 0;

  // Response map per survey
  const respMap = new Map<string, number>();
  completedResponses.forEach(r => { respMap.set(r.surveyId, (respMap.get(r.surveyId) || 0) + 1); });

  // Enrich surveys with count + pct
  const enriched = surveys.map(s => ({
    ...s,
    responseCount: respMap.get(s.id) || 0,
    pct: empCount > 0 ? Math.min(Math.round(((respMap.get(s.id) || 0) / empCount) * 100), 100) : 0,
  }));

  // By type aggregation
  const byType = enriched.reduce<Record<string, { count: number; responses: number; pct: number }>>((acc, s) => {
    if (!acc[s.type]) acc[s.type] = { count: 0, responses: 0, pct: 0 };
    acc[s.type].count++;
    acc[s.type].responses += s.responseCount;
    return acc;
  }, {});
  Object.keys(byType).forEach(t => {
    const possible = byType[t].count * empCount;
    byType[t].pct = possible > 0 ? Math.round((byType[t].responses / possible) * 100) : 0;
  });

  // Top 3 best and worst
  const ranked = [...enriched].filter(s => s.status === 'active').sort((a, b) => b.pct - a.pct);
  const top3     = ranked.slice(0, 3);
  const lagging  = ranked.filter(s => s.pct < 40).slice(0, 3);

  // Filtered list
  const filteredSurveys = enriched.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === 'all' || s.type === typeFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #002e6d 0%, #1d4ed8 55%, #2563eb 100%)' }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 75% 45%, white 0%, transparent 55%)' }} />
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 size={15} className="text-blue-300" />
                <span className="text-blue-200 text-xs font-medium uppercase tracking-wider">HR Admin</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Survey Analytics</h1>
              <p className="text-blue-200 text-sm mt-1">Platform-wide survey participation and completion tracking</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {exportMsg && (
                <span className={`text-sm font-medium ${exportMsg.includes('failed') ? 'text-red-300' : 'text-emerald-300'}`}>
                  {exportMsg}
                </span>
              )}
              <button onClick={() => load(true)} disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium transition-all">
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
              </button>
              <button onClick={() => handleExport('csv')} disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40">
                <Download size={14} /> {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
              <button onClick={() => handleExport('xlsx')} disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40">
                <Download size={14} /> XLSX
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Surveys', value: surveys.length,
              sub: `${activeSurveys.length} active · ${surveys.filter(s => s.status === 'draft').length} draft`,
              icon: Layers, iconColor: 'text-blue-600', iconBg: 'bg-blue-50', accent: 'border-t-blue-500',
            },
            {
              label: 'Total Responses', value: completedResponses.length,
              sub: `out of ${totalPossible} possible`,
              icon: CheckCircle2, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', accent: 'border-t-emerald-500',
            },
            {
              label: 'Participation Rate', value: `${participationPct}%`,
              sub: hLabel(participationPct),
              icon: TrendingUp,
              iconColor: participationPct >= 70 ? 'text-emerald-600' : participationPct >= 40 ? 'text-amber-600' : 'text-red-600',
              iconBg: participationPct >= 70 ? 'bg-emerald-50' : participationPct >= 40 ? 'bg-amber-50' : 'bg-red-50',
              accent: participationPct >= 70 ? 'border-t-emerald-500' : participationPct >= 40 ? 'border-t-amber-500' : 'border-t-red-500',
            },
            {
              label: 'Overdue Surveys', value: overdueSurveys.length,
              sub: overdueSurveys.length > 0 ? 'Action required' : 'All on track',
              icon: AlertTriangle,
              iconColor: overdueSurveys.length > 0 ? 'text-red-600' : 'text-emerald-600',
              iconBg: overdueSurveys.length > 0 ? 'bg-red-50' : 'bg-emerald-50',
              accent: overdueSurveys.length > 0 ? 'border-t-red-500' : 'border-t-emerald-500',
            },
          ].map(c => (
            <div key={c.label} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-t-4 ${c.accent}`}>
              <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <c.icon size={18} className={c.iconColor} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{c.value}</div>
              <div className="text-xs font-semibold text-gray-500 mt-0.5">{c.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Main participation bar ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity size={16} className="text-blue-500" /> Overall Participation Rate
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{completedResponses.length} of {totalPossible} possible</span>
              <span className={`text-xl font-bold ${hColor(participationPct)}`}>{participationPct}%</span>
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-3 rounded-full transition-all duration-700 ${hBg(participationPct)}`}
              style={{ width: `${Math.min(participationPct, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>{completedResponses.length} responses collected</span>
            <span>{empCount} employees × {activeSurveys.length} active surveys = {totalPossible} expected</span>
          </div>

          {/* Type breakdown pills */}
          {Object.keys(byType).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
              {Object.entries(byType).map(([type, d]) => (
                <div key={type} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${TYPE_COLOR[type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{type}</span>
                  <span className="text-xs text-gray-500">{d.count} surveys · {d.responses} resp.</span>
                  <span className={`text-xs font-bold ${hColor(d.pct)}`}>{d.pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Spotlight: Best / Lagging ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Best performing */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Award size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Best Performing Surveys</p>
                <p className="text-xs text-gray-400">Active surveys with highest participation</p>
              </div>
            </div>
            {top3.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No active surveys</p>
            ) : (
              <div className="space-y-3">
                {top3.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${s.pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 w-10 text-right">{s.pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Needs attention */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                <Target size={16} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Needs Attention</p>
                <p className="text-xs text-gray-400">Active surveys below 40% participation</p>
              </div>
            </div>
            {lagging.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2">
                <CheckCircle2 size={24} className="text-emerald-400" />
                <p className="text-sm text-emerald-600 font-medium">All surveys are on track!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lagging.map(s => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={12} className="text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-1.5 bg-red-400 rounded-full" style={{ width: `${s.pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-red-500 w-10 text-right">{s.pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Overdue alert ─────────────────────────────────────────────── */}
        {overdueSurveys.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-3">
              <XCircle size={16} /> {overdueSurveys.length} Overdue Survey{overdueSurveys.length > 1 ? 's' : ''} — past due date
            </p>
            <div className="flex flex-wrap gap-2">
              {overdueSurveys.map(s => (
                <span key={s.id} className="inline-flex items-center gap-1.5 text-xs bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-xl font-medium">
                  <Clock size={11} /> {s.title} · due {fmt(s.dueDate)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Tabs: All Surveys / By Type ──────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {([
              { key: 'overview', label: 'Recent Surveys', icon: <Activity size={14} /> },
              { key: 'surveys',  label: 'All Surveys',    icon: <FileText size={14} /> },
              { key: 'bytype',   label: 'By Type',        icon: <Layers size={14} /> },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Recent Surveys */}
          {tab === 'overview' && (
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-800">Survey Participation Overview</h3>
                <span className="text-xs text-gray-400">{empCount} employees tracked</span>
              </div>
              {enriched.slice(0, 7).map(s => {
                const sc = STATUS_CFG[s.status] || STATUS_CFG.draft;
                const ov = isOverdue(s);
                return (
                  <div key={s.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors hover:bg-gray-50/80 ${ov ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900 truncate">{s.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${TYPE_COLOR[s.type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{s.type}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sc.cls}`}>{sc.label}</span>
                        {ov && <span className="text-[10px] text-red-600 font-semibold flex items-center gap-0.5"><AlertTriangle size={10} /> Overdue</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-2 rounded-full transition-all duration-500 ${s.pct >= 70 ? 'bg-emerald-500' : s.pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${s.pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{s.responseCount}/{empCount} employees</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`text-xl font-bold ${hColor(s.pct)}`}>{s.pct}%</p>
                      <p className="text-xs text-gray-400">{fmt(s.dueDate)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* All Surveys Table */}
          {tab === 'surveys' && (
            <div className="p-6">
              {/* Search + Filters */}
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="relative flex-1 min-w-48">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search surveys..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {['all', ...Object.keys(byType)].map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {t === 'all' ? 'All types' : t}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {['all', 'active', 'draft', 'closed', 'completed'].map(st => (
                    <button key={st} onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${statusFilter === st ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {st === 'all' ? 'All statuses' : st}
                    </button>
                  ))}
                </div>
              </div>

              {filteredSurveys.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No surveys match your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Survey</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Responses</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Participation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredSurveys.map(s => {
                        const sc  = STATUS_CFG[s.status] || STATUS_CFG.draft;
                        const ov  = isOverdue(s);
                        return (
                          <tr key={s.id} className={`hover:bg-gray-50/80 transition-colors ${ov ? 'bg-red-50/20' : ''}`}>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                {ov && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                                <span className="text-sm font-medium text-gray-900 max-w-xs truncate">{s.title}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${TYPE_COLOR[s.type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{s.type}</span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${sc.cls}`}>{sc.label}</span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className="text-sm font-semibold text-gray-800">{s.responseCount}</span>
                              <span className="text-xs text-gray-400">/{empCount}</span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-xs ${ov ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{fmt(s.dueDate)}</span>
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-2 rounded-full ${s.pct >= 70 ? 'bg-emerald-500' : s.pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                                    style={{ width: `${s.pct}%` }} />
                                </div>
                                <span className={`text-xs font-bold w-9 text-right ${hColor(s.pct)}`}>{s.pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* By Type view */}
          {tab === 'bytype' && (
            <div className="p-6">
              {Object.keys(byType).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Layers size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No surveys yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(byType)
                    .sort(([, a], [, b]) => b.pct - a.pct)
                    .map(([type, d]) => (
                      <div key={type} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span className={`text-sm px-3 py-1 rounded-full border font-semibold ${TYPE_COLOR[type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{type}</span>
                            <span className="text-sm text-gray-500">{d.count} survey{d.count !== 1 ? 's' : ''}</span>
                            <span className="text-sm text-gray-500">{d.responses} responses</span>
                          </div>
                          <span className={`text-lg font-bold ${hColor(d.pct)}`}>{d.pct}%</span>
                        </div>
                        <div className="h-2.5 bg-white rounded-full overflow-hidden border border-gray-200">
                          <div className={`h-2.5 rounded-full transition-all duration-700 ${hBg(d.pct)}`}
                            style={{ width: `${Math.min(d.pct, 100)}%` }} />
                        </div>
                        <p className={`text-xs mt-1.5 font-medium ${hColor(d.pct)}`}>{hLabel(d.pct)}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Empty state */}
        {surveys.length === 0 && (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-12 text-center">
            <FileText size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium text-sm">No surveys found</p>
            <p className="text-gray-400 text-xs mt-1">Create surveys to start tracking participation across the organization.</p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default SurveyAnalytics;