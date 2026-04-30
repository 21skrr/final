import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import {
  BarChart2, Users, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, RefreshCw, ChevronRight, Award, FileText,
  Activity, XCircle, Calendar, Star
} from 'lucide-react';

interface Evaluation {
  id: string;
  status: string;
  type: string;
  overallScore: number | null;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
  employee?: { id: string; name: string; department: string };
  evaluator?: { id: string; name: string; role: string };
}

const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  completed:   { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={12}/> },
  pending:     { label: 'Pending',     cls: 'bg-amber-100 text-amber-700 border-amber-200',       icon: <Clock size={12}/> },
  in_progress: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700 border-blue-200',          icon: <Activity size={12}/> },
  draft:       { label: 'Draft',       cls: 'bg-gray-100 text-gray-600 border-gray-200',          icon: <FileText size={12}/> },
};

const TYPE_CLS: Record<string, string> = {
  '3-month':    'bg-violet-100 text-violet-700',
  '6-month':    'bg-blue-100 text-blue-700',
  '12-month':   'bg-indigo-100 text-indigo-700',
  'performance':'bg-orange-100 text-orange-700',
  'training':   'bg-pink-100 text-pink-700',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const HREvaluationReports: React.FC = () => {
  const [evals, setEvals]         = useState<Evaluation[]>([]);
  const [users, setUsers]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dept, setDept]           = useState('all');
  const [tab, setTab]             = useState<'overview'|'employees'|'supervisors'|'timeline'>('overview');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [evRes, usRes] = await Promise.allSettled([
        api.get('/reports/evaluations'),
        api.get('/users'),
      ]);
      setEvals(evRes.status === 'fulfilled' ? (Array.isArray(evRes.value.data) ? evRes.value.data : []) : []);
      setUsers(usRes.status === 'fulfilled' ? (Array.isArray(usRes.value.data) ? usRes.value.data : []) : []);
    } catch { /* silent */ } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derived
  const departments = [...new Set(users.filter(u => u.department).map(u => u.department))].sort();
  const filtered    = dept === 'all' ? evals : evals.filter(e => e.employee?.department === dept);

  const total       = filtered.length;
  const completed   = filtered.filter(e => e.status === 'completed').length;
  const pending     = filtered.filter(e => e.status === 'pending').length;
  const inProgress  = filtered.filter(e => e.status === 'in_progress').length;
  const overdue     = filtered.filter(e => e.status === 'pending' && e.dueDate && new Date(e.dueDate) < new Date()).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // By type
  const byType = filtered.reduce<Record<string, number>>((a, e) => { a[e.type] = (a[e.type]||0)+1; return a; }, {});

  // Per employee
  const empUsers = users.filter(u => u.role === 'employee');
  const empStats = empUsers.map(u => {
    const mine = filtered.filter(e => e.employee?.id === u.id);
    return {
      id: u.id, name: u.name, department: u.department,
      total: mine.length,
      completed: mine.filter(e => e.status === 'completed').length,
      pending: mine.filter(e => e.status === 'pending').length,
      inProgress: mine.filter(e => e.status === 'in_progress').length,
      overdue: mine.filter(e => e.status === 'pending' && e.dueDate && new Date(e.dueDate) < new Date()).length,
    };
  }).filter(e => e.total > 0 || empUsers.length < 8).sort((a, b) => b.total - a.total);

  // Per supervisor
  const supUsers = users.filter(u => u.role === 'supervisor');
  const supStats = supUsers.map(u => {
    const mine = filtered.filter(e => e.evaluator?.id === u.id);
    return {
      id: u.id, name: u.name,
      conducted: mine.length,
      completed: mine.filter(e => e.status === 'completed').length,
    };
  });

  // Monthly trend — last 8 months
  const now = new Date();
  const months = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 7 + i, 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: `${MONTHS[d.getMonth()]} ${d.getFullYear().toString().slice(2)}` };
  });
  const maxMonthVal = Math.max(1, ...months.map(m => filtered.filter(e => (e.createdAt||'').startsWith(m.key)).length));

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const isOverdue = (e: Evaluation) => e.status === 'pending' && !!e.dueDate && new Date(e.dueDate) < new Date();

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
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="text-blue-600" size={24}/>
              Evaluation Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Organisation-wide evaluation tracking & reporting</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={dept} onChange={e => setDept(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={() => load(true)} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''}/> Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total',       value: total,          icon: <FileText size={16}/>,       bg: 'bg-slate-600'   },
            { label: 'Completed',   value: completed,      icon: <CheckCircle2 size={16}/>,   bg: 'bg-emerald-600' },
            { label: 'In Progress', value: inProgress,     icon: <Activity size={16}/>,       bg: 'bg-blue-600'    },
            { label: 'Pending',     value: pending,        icon: <Clock size={16}/>,           bg: 'bg-amber-500'   },
            { label: 'Overdue',     value: overdue,        icon: <AlertTriangle size={16}/>,  bg: overdue > 0 ? 'bg-red-500' : 'bg-emerald-600' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className={`w-8 h-8 ${c.bg} rounded-xl flex items-center justify-center text-white mb-2.5`}>{c.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Completion rate hero bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500"/> Completion Rate
            </span>
            <span className={`text-2xl font-bold ${completionRate >= 70 ? 'text-emerald-600' : completionRate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
              {completionRate}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-3 rounded-full transition-all duration-700 ${completionRate >= 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : completionRate >= 40 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
              style={{ width: `${completionRate}%` }}/>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>{completed} completed</span>
            <span>{total} total evaluations</span>
          </div>

          {/* Status breakdown pills */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            {Object.entries(STATUS_CFG).map(([key, cfg]) => {
              const count = filtered.filter(e => e.status === key).length;
              if (count === 0) return null;
              return (
                <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${cfg.cls}`}>
                  {cfg.icon} {cfg.label}: {count}
                </span>
              );
            })}
            {/* Type distribution */}
            {Object.entries(byType).map(([type, count]) => (
              <span key={type} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${TYPE_CLS[type] || 'bg-gray-100 text-gray-600'}`}>
                {type}: {count}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {([
              { key: 'overview',    label: 'Overview',         icon: <BarChart2 size={13}/> },
              { key: 'employees',   label: 'By Employee',      icon: <Users size={13}/> },
              { key: 'supervisors', label: 'By Supervisor',    icon: <Award size={13}/> },
              { key: 'timeline',    label: 'Timeline',         icon: <Calendar size={13}/> },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── Overview: recent evaluations table ── */}
          {tab === 'overview' && (
            <div className="p-6">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-40"/>
                  <p className="text-sm">No evaluations found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Employee','Type','Status','Due Date','Evaluator'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.slice(0, 15).map(e => {
                        const sc = STATUS_CFG[e.status] || STATUS_CFG.pending;
                        const ov = isOverdue(e);
                        return (
                          <tr key={e.id} className={`hover:bg-gray-50 transition-colors ${ov ? 'bg-red-50/30' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {(e.employee?.name || '?').charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{e.employee?.name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-400">{e.employee?.department || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_CLS[e.type] || 'bg-gray-100 text-gray-600'}`}>{e.type}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${sc.cls}`}>
                                {sc.icon} {sc.label}
                              </span>
                              {ov && <span className="ml-1 text-[10px] text-red-600 font-semibold">Overdue</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{fmt(e.dueDate)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{e.evaluator?.name || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filtered.length > 15 && (
                    <p className="text-xs text-gray-400 text-center pt-3">Showing 15 of {filtered.length} evaluations</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── By Employee ── */}
          {tab === 'employees' && (
            <div className="p-6">
              {empStats.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><Users size={32} className="mx-auto mb-2 opacity-40"/><p className="text-sm">No employee data</p></div>
              ) : (
                <div className="space-y-3">
                  {empStats.map(e => {
                    const rate = e.total > 0 ? Math.round((e.completed / e.total) * 100) : 0;
                    return (
                      <div key={e.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {e.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="font-semibold text-sm text-gray-900 truncate">{e.name}</p>
                            <span className={`text-sm font-bold ${rate === 100 ? 'text-emerald-600' : rate >= 50 ? 'text-blue-600' : 'text-amber-500'}`}>{rate}%</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500"/>{e.completed} done</span>
                            <span className="flex items-center gap-1"><Activity size={10} className="text-blue-500"/>{e.inProgress} active</span>
                            <span className="flex items-center gap-1"><Clock size={10} className="text-amber-500"/>{e.pending} pending</span>
                            {e.overdue > 0 && <span className="flex items-center gap-1 text-red-500"><AlertTriangle size={10}/>{e.overdue} overdue</span>}
                          </div>
                          <div className="mt-2 h-1.5 bg-white rounded-full border border-gray-200 overflow-hidden">
                            <div className={`h-1.5 rounded-full transition-all duration-700 ${rate === 100 ? 'bg-emerald-500' : rate >= 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
                              style={{ width: `${rate}%` }}/>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-gray-800">{e.total}</p>
                          <p className="text-xs text-gray-400">total</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── By Supervisor ── */}
          {tab === 'supervisors' && (
            <div className="p-6">
              {supStats.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><Award size={32} className="mx-auto mb-2 opacity-40"/><p className="text-sm">No supervisor data</p></div>
              ) : (
                <div className="space-y-4">
                  {supStats.map(s => {
                    const rate = s.conducted > 0 ? Math.round((s.completed / s.conducted) * 100) : 0;
                    return (
                      <div key={s.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="font-semibold text-gray-900">{s.name}</p>
                              <span className={`text-lg font-bold ${rate >= 70 ? 'text-emerald-600' : rate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{rate}% completion</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{s.conducted} evaluations conducted · {s.completed} completed</p>
                            <div className="mt-3 h-2 bg-white rounded-full border border-gray-200 overflow-hidden">
                              <div className={`h-2 rounded-full transition-all duration-700 ${rate >= 70 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${Math.min(rate,100)}%` }}/>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Timeline ── */}
          {tab === 'timeline' && (
            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <Calendar size={15} className="text-blue-500"/> Evaluations Created — Last 8 Months
              </h3>
              <div className="flex items-end gap-3 h-48">
                {months.map(m => {
                  const monthEvals = filtered.filter(e => (e.createdAt||'').startsWith(m.key));
                  const done   = monthEvals.filter(e => e.status === 'completed').length;
                  const other  = monthEvals.length - done;
                  const total  = monthEvals.length;
                  const pct    = Math.round((total / maxMonthVal) * 100);
                  const donePct= total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 group">
                      {total > 0 && (
                        <div className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{total}</div>
                      )}
                      <div className="w-full flex flex-col justify-end rounded-t-lg overflow-hidden bg-gray-100" style={{ height: '140px' }}>
                        <div className="w-full transition-all duration-700 flex flex-col" style={{ height: `${pct}%` }}>
                          <div className="w-full bg-blue-200 dark:bg-blue-900" style={{ flex: other }}/>
                          <div className="w-full bg-emerald-500" style={{ flex: done }}/>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 text-center leading-tight">{m.label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 justify-center text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"/>Completed</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-200 inline-block"/>Other</span>
              </div>

              {/* Overdue alert */}
              {overdue > 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
                    <AlertTriangle size={15}/> {overdue} Overdue Evaluation{overdue > 1 ? 's' : ''}
                  </div>
                  <div className="space-y-1">
                    {filtered.filter(isOverdue).slice(0, 5).map(e => (
                      <div key={e.id} className="text-sm text-red-600 flex items-center gap-2">
                        <XCircle size={11}/> {e.employee?.name || 'Unknown'} — {e.type} · due {fmt(e.dueDate)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default HREvaluationReports;