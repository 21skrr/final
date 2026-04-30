import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart2, Users, TrendingUp, FileText, CheckCircle2,
  Clock, AlertTriangle, RefreshCw, Eye, ChevronRight,
  Activity, XCircle, Star, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Survey {
  id: string;
  title: string;
  type: string;
  status: string;
  dueDate: string | null;
  targetRole: string;
  targetProgram: string;
  isTemplate: boolean;
  createdAt: string;
  responseCount?: number;
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string;
  status: string;
  submittedAt: string | null;
}

interface SupervisorStat {
  id: string;
  name: string;
  teamSize: number;
  responseCount: number;
  completionRate: number;
}

const TYPE_COLOR: Record<string, string> = {
  '3-month':    'bg-violet-100 text-violet-700 border-violet-200',
  '6-month':    'bg-blue-100 text-blue-700 border-blue-200',
  '12-month':   'bg-indigo-100 text-indigo-700 border-indigo-200',
  'training':   'bg-amber-100 text-amber-700 border-amber-200',
  'general':    'bg-emerald-100 text-emerald-700 border-emerald-200',
  'onboarding': 'bg-pink-100 text-pink-700 border-pink-200',
};

const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  active:    { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Active' },
  draft:     { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Draft' },
  closed:    { cls: 'bg-red-100 text-red-700 border-red-200', label: 'Closed' },
  completed: { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Completed' },
};

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

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      // Load surveys and users in parallel
      const [survRes, usersRes] = await Promise.allSettled([
        api.get('/surveys'),
        api.get('/users'),
      ]);

      const rawSurveys: Survey[] = survRes.status === 'fulfilled'
        ? (Array.isArray(survRes.value.data) ? survRes.value.data : [])
        : [];

      const allUsers: any[] = usersRes.status === 'fulfilled'
        ? (Array.isArray(usersRes.value.data) ? usersRes.value.data : [])
        : [];

      // Fetch response counts for ALL surveys (templates + non-templates)
      // Responses exist on both — employees fill template surveys too
      const allResponses: SurveyResponse[] = [];
      await Promise.allSettled(
        rawSurveys.map(async s => {
          try {
            const { data } = await api.get(`/surveys/${s.id}/responses`);
            const respList: SurveyResponse[] = Array.isArray(data)
              ? data
              : Array.isArray(data?.responses) ? data.responses : [];
            respList.forEach(r => allResponses.push({ ...r, surveyId: s.id }));
          } catch { /* skip if unauthorised */ }
        })
      );

      // Enrich surveys with response counts
      const surveyMap = new Map<string, number>();
      allResponses.forEach(r => {
        surveyMap.set(r.surveyId, (surveyMap.get(r.surveyId) || 0) + 1);
      });
      const enriched = rawSurveys.map(s => ({ ...s, responseCount: surveyMap.get(s.id) || 0 }));

      // Employee + supervisor stats
      const supUsers = allUsers.filter(u => u.role === 'supervisor');
      const empUsers = allUsers.filter(u => u.role === 'employee');
      setTeamSize(empUsers.length);

      const supStats: SupervisorStat[] = supUsers.map(s => {
        const team = empUsers.filter(e => e.supervisorId === s.id);
        const teamResponses = allResponses.filter(r =>
          team.some(e => e.id === r.userId) && r.status === 'completed'
        );
        // Count active surveys (both template and non-template) as possible responses
        const activeSurveyCount = enriched.filter(sv => sv.status === 'active').length;
        const possible = team.length * activeSurveyCount;
        return {
          id: s.id, name: s.name, teamSize: team.length,
          responseCount: teamResponses.length,
          completionRate: possible > 0 ? Math.round((teamResponses.length / possible) * 100) : 0,
        };
      });

      setSurveys(enriched);
      setResponses(allResponses);
      setSupervisors(supStats);
    } catch (e) {
      console.error('Failed to load survey data', e);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const activeSurveys   = surveys.filter(s => s.status === 'active');  // includes templates
  const totalResponses  = responses.filter(r => r.status === 'completed').length;
  const totalPossible   = activeSurveys.length * teamSize;
  const participationPct = totalPossible > 0 ? Math.round((totalResponses / totalPossible) * 100) : 0;
  const overdueSurveys  = activeSurveys.filter(s => s.dueDate && new Date(s.dueDate) < new Date());

  // Breakdown by type (all surveys)
  const byType = surveys.reduce<Record<string, { count: number; responses: number }>>((acc, s) => {
    if (!acc[s.type]) acc[s.type] = { count: 0, responses: 0 };
    acc[s.type].count++;
    acc[s.type].responses += s.responseCount || 0;
    return acc;
  }, {});

  const filtered = typeFilter === 'all' ? surveys : surveys.filter(s => s.type === typeFilter);

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const isOverdue = (s: Survey) => !!s.dueDate && new Date(s.dueDate) < new Date() && s.status === 'active';

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"/>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="text-blue-600" size={24}/>
              Department Surveys
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {user?.department} — monitor survey activity and team participation
            </p>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''}/>
            Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Surveys',   value: activeSurveys.length,   icon: <Layers size={18}/>,         color: 'bg-blue-600',    sub: `${surveys.filter(s=>s.status==='draft'&&!s.isTemplate).length} drafts` },
            { label: 'Total Responses',  value: totalResponses,          icon: <FileText size={18}/>,       color: 'bg-violet-600',  sub: `out of ${totalPossible} expected` },
            { label: 'Participation',    value: `${participationPct}%`,  icon: <TrendingUp size={18}/>,     color: participationPct >= 70 ? 'bg-emerald-600' : participationPct >= 40 ? 'bg-amber-500' : 'bg-red-500', sub: participationPct >= 70 ? 'Healthy' : 'Needs attention' },
            { label: 'Overdue Surveys',  value: overdueSurveys.length,   icon: <AlertTriangle size={18}/>,  color: overdueSurveys.length > 0 ? 'bg-red-500' : 'bg-emerald-600', sub: overdueSurveys.length > 0 ? 'Action needed' : 'All on track' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-9 h-9 ${c.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                {c.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900">{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">{c.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Participation progress bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity size={16} className="text-blue-500"/> Overall Participation Rate
            </h3>
            <span className={`text-lg font-bold ${participationPct >= 70 ? 'text-emerald-600' : participationPct >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
              {participationPct}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-3 rounded-full transition-all duration-700 ${participationPct >= 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : participationPct >= 40 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
              style={{ width: `${Math.min(participationPct, 100)}%` }}/>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>{totalResponses} responses received</span>
            <span>{totalPossible} expected total</span>
          </div>

          {/* By type breakdown */}
          {Object.keys(byType).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(byType).map(([type, d]) => (
                <div key={type} className="flex items-center gap-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLOR[type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {type}
                  </span>
                  <span className="text-xs text-gray-500">{d.count} surveys · {d.responses} resp.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {([
              { key: 'overview',    label: 'Overview',    icon: <BarChart2 size={14}/> },
              { key: 'surveys',     label: 'All Surveys', icon: <FileText size={14}/> },
              { key: 'supervisors', label: 'By Supervisor', icon: <Users size={14}/> },
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
              <h3 className="font-semibold text-gray-800 mb-2">Recent Surveys</h3>
              {surveys.slice(0, 5).length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-40"/>
                  <p className="text-sm">No surveys found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {surveys.slice(0, 5).map(s => {
                    const sc = STATUS_CFG[s.status] || STATUS_CFG.draft;
                    const ov = isOverdue(s);
                    const progress = teamSize > 0 ? Math.min(Math.round(((s.responseCount||0)/teamSize)*100), 100) : 0;
                    return (
                      <div key={s.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors hover:bg-gray-50 ${ov ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-gray-900 truncate">{s.title}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${TYPE_COLOR[s.type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{s.type}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${sc.cls}`}>{sc.label}</span>
                            {ov && <span className="text-[10px] text-red-600 font-semibold flex items-center gap-0.5"><AlertTriangle size={10}/> Overdue</span>}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-1.5 bg-blue-500 rounded-full" style={{width:`${progress}%`}}/>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0">{s.responseCount||0}/{teamSize} responses</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-gray-800">{progress}%</p>
                          <p className="text-xs text-gray-400">{fmt(s.dueDate)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {overdueSurveys.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
                    <AlertTriangle size={15}/> {overdueSurveys.length} Overdue Survey{overdueSurveys.length>1?'s':''}
                  </div>
                  <ul className="space-y-1">
                    {overdueSurveys.map(s => (
                      <li key={s.id} className="text-sm text-red-600 flex items-center gap-2">
                        <XCircle size={12}/> {s.title} — due {fmt(s.dueDate)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* All Surveys Tab */}
          {tab === 'surveys' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-gray-500">Filter by type:</span>
                <div className="flex flex-wrap gap-2">
                  {['all', ...Object.keys(byType)].map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {t === 'all' ? `All (${surveys.length})` : `${t} (${byType[t]?.count||0})`}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-40"/>
                  <p className="text-sm">No surveys found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Survey</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Responses</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map(s => {
                        const sc = STATUS_CFG[s.status] || STATUS_CFG.draft;
                        const ov = isOverdue(s);
                        const progress = teamSize > 0 ? Math.min(Math.round(((s.responseCount||0)/teamSize)*100), 100) : 0;
                        return (
                          <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${ov ? 'bg-red-50/30' : ''}`}>
                            <td className="px-4 py-3.5">
                              <p className="text-sm font-medium text-gray-900 max-w-xs truncate">{s.title}</p>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLOR[s.type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{s.type}</span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sc.cls}`}>{sc.label}</span>
                            </td>
                            <td className="px-3 py-3.5 text-sm text-gray-700 font-medium">{s.responseCount||0}<span className="text-gray-400 font-normal">/{teamSize}</span></td>
                            <td className="px-3 py-3.5">
                              <span className={`text-sm ${ov ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                {ov && <AlertTriangle size={12} className="inline mr-1"/>}{fmt(s.dueDate)}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 w-32">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-1.5 rounded-full ${progress===100?'bg-emerald-500':'bg-blue-500'}`} style={{width:`${progress}%`}}/>
                                </div>
                                <span className="text-xs text-gray-500 w-8">{progress}%</span>
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
              {supervisors.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 opacity-40"/>
                  <p className="text-sm">No supervisor data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {supervisors.map(s => (
                    <div key={s.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                            <span className={`text-sm font-bold ${s.completionRate >= 70 ? 'text-emerald-600' : s.completionRate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                              {s.completionRate}% team completion
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={11}/> {s.teamSize} team members</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><CheckCircle2 size={11}/> {s.responseCount} responses</span>
                          </div>
                          <div className="mt-2.5 h-2 bg-white rounded-full overflow-hidden border border-gray-200">
                            <div className={`h-2 rounded-full transition-all duration-700 ${s.completionRate >= 70 ? 'bg-emerald-500' : s.completionRate >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${Math.min(s.completionRate, 100)}%` }}/>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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