import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart2, Users, TrendingUp, FileText, CheckCircle2,
  Clock, AlertTriangle, RefreshCw, XCircle, Layers,
  Activity, ChevronRight, Award, Target, Zap, Search,
} from 'lucide-react';

interface Survey {
  id: string; title: string; type: string; status: string;
  dueDate: string | null; targetRole: string; targetProgram: string;
  isTemplate: boolean; createdAt: string; responseCount?: number;
}
interface SurveyResponse {
  id: string; surveyId: string; userId: string; status: string; submittedAt: string | null;
}
interface SupervisorStat {
  id: string; name: string; teamSize: number;
  responseCount: number; completionRate: number;
}

const TYPE_COLOR: Record<string, string> = {
  '3-month':    'bg-violet-100 text-violet-700 border-violet-200',
  '6-month':    'bg-blue-100  text-blue-700  border-blue-200',
  '12-month':   'bg-indigo-100 text-indigo-700 border-indigo-200',
  'training':   'bg-amber-100  text-amber-700  border-amber-200',
  'general':    'bg-emerald-100 text-emerald-700 border-emerald-200',
  'onboarding': 'bg-pink-100   text-pink-700   border-pink-200',
};
const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  active:    { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Active' },
  draft:     { cls: 'bg-gray-100  text-gray-600  border-gray-200',  label: 'Draft' },
  closed:    { cls: 'bg-red-100   text-red-700   border-red-200',   label: 'Closed' },
  completed: { cls: 'bg-blue-100  text-blue-700  border-blue-200',  label: 'Completed' },
};

const healthLabel = (pct: number) => pct >= 70 ? 'Healthy' : pct >= 40 ? 'Needs attention' : 'Critical';
const healthColor = (pct: number) => pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-500' : 'text-red-500';
const healthBg    = (pct: number) => pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
const healthRing  = (pct: number) => pct >= 70 ? 'ring-emerald-200 bg-emerald-50' : pct >= 40 ? 'ring-amber-200 bg-amber-50' : 'ring-red-200 bg-red-50';
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const isOverdue = (s: Survey) => !!s.dueDate && new Date(s.dueDate) < new Date() && s.status === 'active';

const DepartmentSurveys: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'overview' | 'surveys' | 'supervisors'>('overview');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorStat[]>([]);
  const [teamSize, setTeamSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [survRes, usersRes] = await Promise.allSettled([
        api.get('/surveys'),
        api.get('/users'),
      ]);
      const rawSurveys: Survey[] = survRes.status === 'fulfilled'
        ? (Array.isArray(survRes.value.data) ? survRes.value.data : []) : [];
      const allUsers: any[] = usersRes.status === 'fulfilled'
        ? (Array.isArray(usersRes.value.data) ? usersRes.value.data : []) : [];

      const allResponses: SurveyResponse[] = [];
      await Promise.allSettled(
        rawSurveys.map(async s => {
          try {
            const { data } = await api.get(`/surveys/${s.id}/responses`);
            const respList: SurveyResponse[] = Array.isArray(data) ? data
              : Array.isArray(data?.responses) ? data.responses : [];
            respList.forEach(r => allResponses.push({ ...r, surveyId: s.id }));
          } catch { /* skip */ }
        })
      );

      const surveyMap = new Map<string, number>();
      allResponses.forEach(r => { surveyMap.set(r.surveyId, (surveyMap.get(r.surveyId) || 0) + 1); });
      const enriched = rawSurveys.map(s => ({ ...s, responseCount: surveyMap.get(s.id) || 0 }));

      const supUsers = allUsers.filter(u => u.role === 'supervisor');
      const empUsers = allUsers.filter(u => u.role === 'employee');
      setTeamSize(empUsers.length);

      const supStats: SupervisorStat[] = supUsers.map(s => {
        const team = empUsers.filter(e => e.supervisorId === s.id);
        const teamResponses = allResponses.filter(r =>
          team.some(e => e.id === r.userId) && r.status === 'completed'
        );
        const activeSurveyCount = enriched.filter(sv => sv.status === 'active').length;
        const possible = team.length * activeSurveyCount;
        return {
          id: s.id, name: s.name, teamSize: team.length,
          responseCount: teamResponses.length,
          completionRate: possible > 0 ? Math.round((teamResponses.length / possible) * 100) : 0,
        };
      });

      setSurveys(enriched); setResponses(allResponses); setSupervisors(supStats);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeSurveys    = surveys.filter(s => s.status === 'active');
  const totalResponses   = responses.filter(r => r.status === 'completed').length;
  const totalPossible    = activeSurveys.length * teamSize;
  const participationPct = totalPossible > 0 ? Math.round((totalResponses / totalPossible) * 100) : 0;
  const overdueSurveys   = activeSurveys.filter(s => isOverdue(s));

  // Top + bottom performing surveys
  const rankedSurveys = [...activeSurveys]
    .map(s => ({ ...s, pct: teamSize > 0 ? Math.min(Math.round(((s.responseCount || 0) / teamSize) * 100), 100) : 0 }))
    .sort((a, b) => b.pct - a.pct);
  const topSurveys    = rankedSurveys.slice(0, 3);
  const laggingSurveys = rankedSurveys.filter(s => s.pct < 40).slice(0, 3);

  const byType = surveys.reduce<Record<string, { count: number; responses: number }>>((acc, s) => {
    if (!acc[s.type]) acc[s.type] = { count: 0, responses: 0 };
    acc[s.type].count++;
    acc[s.type].responses += s.responseCount || 0;
    return acc;
  }, {});

  const filtered = (typeFilter === 'all' ? surveys : surveys.filter(s => s.type === typeFilter))
    .filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  // Leader board
  const topSupervisors = [...supervisors].sort((a, b) => b.completionRate - a.completionRate);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 60%, #2563eb 100%)' }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 0%, transparent 55%)' }} />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 size={15} className="text-blue-300" />
                <span className="text-blue-200 text-xs font-medium uppercase tracking-wider">Manager Portal</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Department Surveys</h1>
              <p className="text-blue-200 text-sm mt-1">
                {user?.department || 'Your Department'} — monitor survey activity and team participation
              </p>
            </div>
            {/* Health pill */}
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl ring-2 ${healthRing(participationPct)}`}>
              <div className="relative">
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                  <circle cx="22" cy="22" r="18" fill="none"
                    stroke={participationPct >= 70 ? '#10b981' : participationPct >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="4"
                    strokeDasharray={`${(participationPct / 100) * 113} 113`}
                    strokeLinecap="round"
                    transform="rotate(-90 22 22)" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">{participationPct}%</span>
              </div>
              <div>
                <p className={`text-sm font-bold ${healthColor(participationPct)}`}>{healthLabel(participationPct)}</p>
                <p className="text-xs text-gray-500">Participation</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Active Surveys', value: activeSurveys.length,
              sub: `${surveys.filter(s => s.status === 'draft').length} in draft`,
              icon: Layers, iconColor: 'text-blue-600', iconBg: 'bg-blue-50',
              accent: 'border-t-blue-500',
            },
            {
              label: 'Total Responses', value: totalResponses,
              sub: `out of ${totalPossible} expected`,
              icon: FileText, iconColor: 'text-violet-600', iconBg: 'bg-violet-50',
              accent: 'border-t-violet-500',
            },
            {
              label: 'Participation', value: `${participationPct}%`,
              sub: healthLabel(participationPct),
              icon: TrendingUp, iconColor: participationPct >= 70 ? 'text-emerald-600' : participationPct >= 40 ? 'text-amber-600' : 'text-red-600',
              iconBg: participationPct >= 70 ? 'bg-emerald-50' : participationPct >= 40 ? 'bg-amber-50' : 'bg-red-50',
              accent: participationPct >= 70 ? 'border-t-emerald-500' : participationPct >= 40 ? 'border-t-amber-500' : 'border-t-red-500',
            },
            {
              label: 'Overdue Surveys', value: overdueSurveys.length,
              sub: overdueSurveys.length > 0 ? 'Needs follow-up' : 'All on track',
              icon: AlertTriangle, iconColor: overdueSurveys.length > 0 ? 'text-red-600' : 'text-emerald-600',
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

        {/* ── Participation bar + breakdown ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity size={16} className="text-blue-500" /> Overall Participation Rate
            </h2>
            <span className={`text-xl font-bold ${healthColor(participationPct)}`}>{participationPct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${healthBg(participationPct)}`}
              style={{ width: `${Math.min(participationPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>{totalResponses} responses received</span>
            <span>{totalPossible} expected total</span>
          </div>

          {/* By-type pills */}
          {Object.keys(byType).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
              {Object.entries(byType).map(([type, d]) => {
                const typePct = teamSize > 0 ? Math.round((d.responses / (d.count * teamSize)) * 100) : 0;
                return (
                  <div key={type} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${TYPE_COLOR[type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {type}
                    </span>
                    <span className="text-xs text-gray-500">{d.count} surveys · {d.responses} resp.</span>
                    <span className={`text-xs font-bold ml-1 ${healthColor(typePct)}`}>{typePct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Spotlight Row: Top + Lagging ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top performing */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Award size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Best Performing</p>
                <p className="text-xs text-gray-400">Surveys with highest response rates</p>
              </div>
            </div>
            {topSurveys.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No active surveys</p>
            ) : (
              <div className="space-y-3">
                {topSurveys.map((s, i) => (
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
                        <span className="text-xs font-bold text-emerald-600 w-8 text-right">{s.pct}%</span>
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
                <p className="text-xs text-gray-400">Surveys below 40% participation</p>
              </div>
            </div>
            {laggingSurveys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <CheckCircle2 size={24} className="text-emerald-400" />
                <p className="text-sm text-emerald-600 font-medium">All surveys are on track!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {laggingSurveys.map(s => (
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
                        <span className="text-xs font-bold text-red-500 w-8 text-right">{s.pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Overdue alert ── */}
        {overdueSurveys.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-3">
              <XCircle size={16} /> {overdueSurveys.length} Overdue Survey{overdueSurveys.length > 1 ? 's' : ''} — follow up needed
            </div>
            <div className="flex flex-wrap gap-2">
              {overdueSurveys.map(s => (
                <span key={s.id} className="inline-flex items-center gap-1.5 text-xs bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-xl font-medium">
                  <Clock size={11} /> {s.title} · due {fmt(s.dueDate)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Tabs Panel ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {([
              { key: 'overview',    label: 'Overview',      icon: <BarChart2 size={14} /> },
              { key: 'surveys',     label: 'All Surveys',   icon: <FileText size={14} /> },
              { key: 'supervisors', label: 'By Supervisor', icon: <Users size={14} /> },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab === 'overview' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-800">All Surveys — Response Status</h3>
                <span className="text-xs text-gray-400">{activeSurveys.length} active</span>
              </div>
              {surveys.slice(0, 6).length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No surveys found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {surveys.slice(0, 6).map(s => {
                    const sc = STATUS_CFG[s.status] || STATUS_CFG.draft;
                    const ov = isOverdue(s);
                    const progress = teamSize > 0 ? Math.min(Math.round(((s.responseCount || 0) / teamSize) * 100), 100) : 0;
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
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${progress >= 70 ? 'bg-emerald-500' : progress >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0">{s.responseCount || 0}/{teamSize}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className={`text-xl font-bold ${healthColor(progress)}`}>{progress}%</p>
                          <p className="text-xs text-gray-400">{fmt(s.dueDate)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* All Surveys Tab */}
          {tab === 'surveys' && (
            <div className="p-6">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative flex-1 min-w-48">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search surveys..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {['all', ...Object.keys(byType)].map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${typeFilter === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {t === 'all' ? `All (${surveys.length})` : `${t} (${byType[t]?.count || 0})`}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
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
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Completion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map(s => {
                        const sc = STATUS_CFG[s.status] || STATUS_CFG.draft;
                        const ov = isOverdue(s);
                        const progress = teamSize > 0 ? Math.min(Math.round(((s.responseCount || 0) / teamSize) * 100), 100) : 0;
                        return (
                          <tr key={s.id} className={`hover:bg-gray-50/80 transition-colors ${ov ? 'bg-red-50/20' : ''}`}>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                {ov && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                                <p className="text-sm font-medium text-gray-900 max-w-xs truncate">{s.title}</p>
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${TYPE_COLOR[s.type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{s.type}</span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${sc.cls}`}>{sc.label}</span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className="text-sm font-semibold text-gray-800">{s.responseCount || 0}</span>
                              <span className="text-xs text-gray-400">/{teamSize}</span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-xs ${ov ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{fmt(s.dueDate)}</span>
                            </td>
                            <td className="px-3 py-3.5 w-36">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full ${progress >= 70 ? 'bg-emerald-500' : progress >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold w-9 text-right ${healthColor(progress)}`}>{progress}%</span>
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

          {/* Supervisors Tab */}
          {tab === 'supervisors' && (
            <div className="p-6">
              {topSupervisors.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No supervisor data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topSupervisors.map((s, i) => {
                    const rank = i + 1;
                    const rankBg = rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-gray-100 text-gray-600' : rank === 3 ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600';
                    return (
                      <div key={s.id} className="flex items-center gap-4 p-4 bg-gray-50/70 rounded-2xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 transition-colors">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${rankBg}`}>{rank}</span>
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-1 mb-2">
                            <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={11} /> {s.teamSize} members</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1"><CheckCircle2 size={11} /> {s.responseCount} responses</span>
                              <span className={`text-sm font-bold ${healthColor(s.completionRate)}`}>{s.completionRate}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-200">
                            <div
                              className={`h-2 rounded-full transition-all duration-700 ${healthBg(s.completionRate)}`}
                              style={{ width: `${Math.min(s.completionRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default DepartmentSurveys;