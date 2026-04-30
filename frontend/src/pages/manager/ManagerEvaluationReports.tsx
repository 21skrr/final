import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import {
  BarChart2, CheckCircle2, Clock, AlertTriangle, Users,
  TrendingUp, FileText, RefreshCw, ChevronRight, Calendar,
  XCircle, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EvalRow {
  id: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'draft';
  dueDate: string | null;
  overallScore: number | null;
  comments: string | null;
  employee?: { id: string; name: string; departmentId?: string };
  supervisor?: { id: string; name: string };
}

const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  completed:   { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={12}/> },
  in_progress: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700 border-blue-200',         icon: <Activity size={12}/> },
  pending:     { label: 'Pending',     cls: 'bg-amber-100 text-amber-700 border-amber-200',       icon: <Clock size={12}/> },
  draft:       { label: 'Draft',       cls: 'bg-gray-100 text-gray-600 border-gray-200',          icon: <FileText size={12}/> },
};

const TYPE_COLOR: Record<string, string> = {
  '3-month': 'bg-violet-500',
  '6-month': 'bg-blue-500',
  '12-month': 'bg-emerald-500',
  'performance': 'bg-orange-500',
};

const ManagerEvaluationReports: React.FC = () => {
  const [evals, setEvals] = useState<EvalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/reports/evaluations');
      setEvals(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load evaluations');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived stats ──────────────────────────────────────────────────────
  const total       = evals.length;
  const completed   = evals.filter(e => e.status === 'completed').length;
  const pending     = evals.filter(e => e.status === 'pending').length;
  const inProgress  = evals.filter(e => e.status === 'in_progress').length;
  const today       = new Date(); today.setHours(0,0,0,0);
  const overdue     = evals.filter(e =>
    e.status !== 'completed' && e.dueDate && new Date(e.dueDate) < today
  ).length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // By type
  const byType = evals.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1; return acc;
  }, {});

  // By evaluator (supervisor)
  const bySup = evals.reduce<Record<string, { name: string; total: number; completed: number }>>((acc, e) => {
    const id = e.supervisor?.id || 'unknown';
    const name = e.supervisor?.name || 'Unknown';
    if (!acc[id]) acc[id] = { name, total: 0, completed: 0 };
    acc[id].total++;
    if (e.status === 'completed') acc[id].completed++;
    return acc;
  }, {});

  // Filtered rows for table
  const displayed = (filter === 'all' ? evals : evals.filter(e => e.status === filter))
    .sort((a, b) => {
      // Overdue first, then by due date
      const aOv = a.status !== 'completed' && a.dueDate && new Date(a.dueDate) < today;
      const bOv = b.status !== 'completed' && b.dueDate && new Date(b.dueDate) < today;
      if (aOv && !bOv) return -1;
      if (!aOv && bOv) return 1;
      return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
    });

  const fmt = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (e: EvalRow) =>
    e.status !== 'completed' && !!e.dueDate && new Date(e.dueDate) < today;

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"/>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-8 bg-red-50 border border-red-200 rounded-xl p-6 flex gap-3 items-center">
        <XCircle className="text-red-500 flex-shrink-0"/>
        <div>
          <p className="font-semibold text-red-700">Failed to load</p>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
        </div>
        <button onClick={() => load()} className="ml-auto px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm">Retry</button>
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
              <BarChart2 className="text-blue-600" size={24}/> Evaluation Reports
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Department-wide evaluation overview and analytics</p>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''}/>
            Refresh
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Evaluations', value: total,          icon: <FileText size={18}/>,     color: 'bg-blue-600',    light: 'bg-blue-50 text-blue-700'   },
            { label: 'Completed',         value: completed,      icon: <CheckCircle2 size={18}/>, color: 'bg-emerald-600', light: 'bg-emerald-50 text-emerald-700' },
            { label: 'Pending / Active',  value: pending + inProgress, icon: <Clock size={18}/>, color: 'bg-amber-500',   light: 'bg-amber-50 text-amber-700' },
            { label: 'Overdue',           value: overdue,        icon: <AlertTriangle size={18}/>, color: 'bg-red-500',   light: 'bg-red-50 text-red-700'    },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-9 h-9 ${c.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                {c.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900">{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Progress + Breakdown row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Completion progress */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500"/> Completion Rate</h3>
            <div className="flex items-end gap-4 mb-4">
              <div className="text-5xl font-bold text-gray-900">{completionPct}%</div>
              <div className="text-sm text-gray-500 mb-1">{completed} of {total} evaluations completed</div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%` }}/>
            </div>
            {/* Status breakdown */}
            <div className="mt-4 space-y-2">
              {[
                { label: 'Completed',   count: completed,  color: 'bg-emerald-500' },
                { label: 'In Progress', count: inProgress, color: 'bg-blue-500' },
                { label: 'Pending',     count: pending,    color: 'bg-amber-400' },
                { label: 'Draft',       count: evals.filter(e=>e.status==='draft').length, color: 'bg-gray-300' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`}/>
                  <span className="text-sm text-gray-600 flex-1">{s.label}</span>
                  <span className="text-sm font-semibold text-gray-800">{s.count}</span>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-1.5 ${s.color} rounded-full`}
                      style={{ width: total > 0 ? `${(s.count / total) * 100}%` : '0%' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By type + By supervisor */}
          <div className="space-y-4">
            {/* By type */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Activity size={16} className="text-purple-500"/> By Evaluation Type</h3>
              <div className="space-y-2">
                {Object.entries(byType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${TYPE_COLOR[type] || 'bg-gray-400'}`}/>
                    <span className="text-sm text-gray-700 flex-1 capitalize">{type}</span>
                    <span className="text-sm font-semibold text-gray-800">{count}</span>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-1.5 ${TYPE_COLOR[type] || 'bg-gray-400'} rounded-full`}
                        style={{ width: `${(count / total) * 100}%` }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By supervisor */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Users size={16} className="text-green-500"/> By Evaluator</h3>
              <div className="space-y-2">
                {Object.entries(bySup).map(([id, s]) => (
                  <div key={id} className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700 flex-1 truncate">{s.name}</span>
                    <span className="text-xs text-gray-400">{s.completed}/{s.total}</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1.5 bg-blue-400 rounded-full"
                        style={{ width: s.total > 0 ? `${(s.completed / s.total) * 100}%` : '0%' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Evaluations Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">All Evaluations</h3>
            <div className="flex gap-1.5">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'all' ? ` (${total})` : f === 'pending' ? ` (${pending})` : f === 'in_progress' ? ` (${inProgress})` : ` (${completed})`}
                </button>
              ))}
            </div>
          </div>

          {displayed.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle2 size={32} className="mx-auto mb-2 opacity-40"/>
              <p className="text-sm">No evaluations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Evaluator</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayed.map(e => {
                    const sc = STATUS_CFG[e.status] || STATUS_CFG.draft;
                    const ov = isOverdue(e);
                    return (
                      <tr key={e.id} className={`hover:bg-gray-50 transition-colors ${ov ? 'bg-red-50/40' : ''}`}>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {e.employee?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{e.employee?.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${TYPE_COLOR[e.type] || 'bg-gray-400'}`}>
                            {e.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-600">{e.supervisor?.name || '—'}</td>
                        <td className="px-4 py-3.5">
                          <div className={`flex items-center gap-1.5 text-sm ${ov ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            {ov && <AlertTriangle size={13} className="text-red-500"/>}
                            <Calendar size={13} className="opacity-60"/>
                            {fmt(e.dueDate)}
                            {ov && <span className="text-xs text-red-500 font-normal">(Overdue)</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.cls}`}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <Link to={`/manager/evaluations/${e.id}`}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
                            View <ChevronRight size={12}/>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default ManagerEvaluationReports;