import React, { useEffect, useState, useCallback } from 'react';
import { User } from '../../types/user';
import {
  Users, BarChart2, CheckCircle2, Clock, AlertTriangle, Shield,
  FileText, TrendingUp, Activity, RefreshCw, ChevronRight,
  UserCheck, ClipboardList, Layers, Award, Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useSupervisorAssessments } from '../../hooks/useSupervisorAssessments';
import { useHRAssessments } from '../../hooks/useHRAssessments';

interface HRDashboardProps { user: User; }

const ROLE_COLORS: Record<string, string> = {
  employee:   'bg-blue-500',
  supervisor: 'bg-violet-500',
  manager:    'bg-indigo-500',
  hr:         'bg-emerald-500',
};

const STATUS_DOT: Record<string, string> = {
  completed:   'bg-emerald-500',
  pending:     'bg-amber-400',
  in_progress: 'bg-blue-500',
  draft:       'bg-gray-300',
};

const TYPE_CLS: Record<string, string> = {
  '3-month':    'bg-violet-100 text-violet-700',
  '6-month':    'bg-blue-100 text-blue-700',
  '12-month':   'bg-indigo-100 text-indigo-700',
  'performance':'bg-orange-100 text-orange-700',
  'training':   'bg-pink-100 text-pink-700',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt = (d: string) => {
  const dt = new Date(d);
  return `${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
};

const HRDashboard: React.FC<HRDashboardProps> = ({ user }) => {
  const { pendingHRApprovals } = useSupervisorAssessments();
  const { pendingCount: pendingHRAssessments } = useHRAssessments();

  const [users,      setUsers]      = useState<any[]>([]);
  const [evals,      setEvals]      = useState<any[]>([]);
  const [surveys,    setSurveys]    = useState<any[]>([]);
  const [responses,  setResponses]  = useState<any[]>([]);
  const [orgData,    setOrgData]    = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get('/users'),
        api.get('/reports/evaluations'),
        api.get('/surveys'),
        api.get('/analytics/organization-dashboard').catch(() => ({ data: null })),
      ]);
      const allUsers    = results[0].status === 'fulfilled' ? (results[0].value.data || []) : [];
      const allEvals    = results[1].status === 'fulfilled' ? (Array.isArray(results[1].value.data) ? results[1].value.data : []) : [];
      const allSurveys  = results[2].status === 'fulfilled' ? (Array.isArray(results[2].value.data) ? results[2].value.data : []) : [];
      const org         = results[3].status === 'fulfilled' ? results[3].value.data : null;

      // Fetch response counts per survey
      const allResponses: any[] = [];
      await Promise.allSettled(allSurveys.map(async (s: any) => {
        try {
          const { data } = await api.get(`/surveys/${s.id}/responses`);
          const list = Array.isArray(data) ? data : [];
          list.forEach((r: any) => allResponses.push({ ...r, surveyId: s.id }));
        } catch { /* skip */ }
      }));

      setUsers(Array.isArray(allUsers) ? allUsers : []);
      setEvals(allEvals);
      setSurveys(allSurveys);
      setResponses(allResponses);
      setOrgData(org);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived metrics ────────────────────────────────────────────────────────
  const byRole = users.reduce<Record<string, number>>((a, u) => { a[u.role] = (a[u.role]||0)+1; return a; }, {});
  const totalUsers      = users.length;
  const totalEvals      = evals.length;
  const completedEvals  = evals.filter((e: any) => e.status === 'completed').length;
  const pendingEvals    = evals.filter((e: any) => e.status === 'pending').length;
  const overdueEvals    = evals.filter((e: any) => e.status === 'pending' && e.dueDate && new Date(e.dueDate) < new Date()).length;
  const evalRate        = totalEvals > 0 ? Math.round((completedEvals / totalEvals) * 100) : 0;

  const activeSurveys   = surveys.filter((s: any) => s.status === 'active').length;
  const completedResponses = responses.filter((r: any) => r.status === 'completed').length;

  const departments     = [...new Set(users.filter(u => u.department).map(u => u.department))];

  // Eval type distribution
  const byType = evals.reduce<Record<string, {total:number; completed:number}>>((a, e: any) => {
    if (!a[e.type]) a[e.type] = { total: 0, completed: 0 };
    a[e.type].total++;
    if (e.status === 'completed') a[e.type].completed++;
    return a;
  }, {});

  // Recent evaluations (last 6)
  const recentEvals = [...evals].sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 6);

  // Monthly activity — last 6 months
  const now = new Date();
  const monthSlots = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: `${MONTHS[d.getMonth()]}` };
  });
  const maxBar = Math.max(1, ...monthSlots.map(m => evals.filter((e: any) => (e.createdAt||'').startsWith(m.key)).length));

  if (loading) return (
    <div className="flex items-center justify-center min-h-64 py-20">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"/>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 shadow-lg" style={{background:'linear-gradient(135deg, #002e6d 0%, #224f7d 60%, #2b6298 100%)'}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)'}}/>
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium">HR Portal</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Welcome back, {user.name} 👋</h1>
            <p className="text-blue-200 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
            </p>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium backdrop-blur transition-all">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''}/>
            Refresh
          </button>
        </div>

        {/* Mini stat strip */}
        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Employees', value: byRole.employee || 0,    icon: <Users size={14}/> },
            { label: 'Active Surveys', value: activeSurveys,      icon: <FileText size={14}/> },
            { label: 'Evaluations', value: totalEvals,            icon: <ClipboardList size={14}/> },
            { label: 'Completions', value: completedResponses,    icon: <CheckCircle2 size={14}/> },
          ].map(s => (
            <div key={s.label} className="bg-white/15 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="text-blue-200">{s.icon}</div>
              <div>
                <div className="text-white text-xl font-bold leading-none">{s.value}</div>
                <div className="text-blue-200 text-xs mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Action alerts ── */}
      {(pendingHRApprovals > 0 || pendingHRAssessments > 0 || overdueEvals > 0) && (
        <div className="space-y-3">
          {pendingHRApprovals > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Shield size={16}/></div>
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Pending HR Approvals</p>
                  <p className="text-blue-600 text-xs">{pendingHRApprovals} supervisor assessment(s) awaiting approval</p>
                </div>
              </div>
              <Link to="/hr/validation-queue"
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                Review <ChevronRight size={12}/>
              </Link>
            </div>
          )}
          {pendingHRAssessments > 0 && (
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white"><UserCheck size={16}/></div>
                <div>
                  <p className="font-semibold text-emerald-900 text-sm">Pending Assessments</p>
                  <p className="text-emerald-600 text-xs">{pendingHRAssessments} Phase 2 completion(s) to review</p>
                </div>
              </div>
              <Link to="/admin/assessment-queue"
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors">
                Review <ChevronRight size={12}/>
              </Link>
            </div>
          )}
          {overdueEvals > 0 && (
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center text-white"><AlertTriangle size={16}/></div>
                <div>
                  <p className="font-semibold text-red-900 text-sm">Overdue Evaluations</p>
                  <p className="text-red-600 text-xs">{overdueEvals} evaluation(s) past their due date</p>
                </div>
              </div>
              <Link to="/admin/evaluations/reports"
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors">
                View <ChevronRight size={12}/>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left col: Evaluation overview */}
        <div className="lg:col-span-2 space-y-5">

          {/* Evaluation completion rate */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 size={16} className="text-blue-500"/> Evaluation Progress
              </h2>
              <Link to="/admin/evaluations/reports" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Full report <ChevronRight size={11}/>
              </Link>
            </div>

            {/* Summary pills */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total',       val: totalEvals,     cls: 'bg-slate-50  border-slate-200  text-slate-700'   },
                { label: 'Completed',   val: completedEvals, cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                { label: 'Pending',     val: pendingEvals,   cls: 'bg-amber-50  border-amber-200  text-amber-700'   },
                { label: 'In Progress', val: evals.filter((e:any)=>e.status==='in_progress').length, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
              ].map(p => (
                <div key={p.label} className={`p-3 rounded-xl border text-center ${p.cls}`}>
                  <div className="text-xl font-bold">{p.val}</div>
                  <div className="text-[10px] font-medium mt-0.5">{p.label}</div>
                </div>
              ))}
            </div>

            {/* Overall progress bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>Completion rate</span>
              <span className={`font-bold text-sm ${evalRate >= 70 ? 'text-emerald-600' : evalRate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{evalRate}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-2.5 rounded-full transition-all duration-700 ${evalRate >= 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : evalRate >= 40 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                style={{ width: `${evalRate}%` }}/>
            </div>

            {/* Type breakdown bars */}
            <div className="mt-4 space-y-2">
              {Object.entries(byType).map(([type, d]) => {
                const r = d.total > 0 ? Math.round((d.completed/d.total)*100) : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium w-24 text-center flex-shrink-0 ${TYPE_CLS[type]||'bg-gray-100 text-gray-600'}`}>{type}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${r}%` }}/>
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">{d.completed}/{d.total}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly activity chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-5">
              <Activity size={16} className="text-violet-500"/> Evaluation Activity (6 Months)
            </h2>
            <div className="flex items-end gap-2 h-32">
              {monthSlots.map(m => {
                const count = evals.filter((e: any) => (e.createdAt||'').startsWith(m.key)).length;
                const done  = evals.filter((e: any) => (e.createdAt||'').startsWith(m.key) && e.status === 'completed').length;
                const pct   = Math.round((count / maxBar) * 100);
                const donePct = count > 0 ? Math.round((done / count) * 100) : 0;
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1 group">
                    {count > 0 && <span className="text-xs font-bold text-gray-600">{count}</span>}
                    <div className="w-full rounded-t-lg overflow-hidden bg-gray-100 flex flex-col justify-end" style={{ height: '90px' }}>
                      <div className="w-full flex flex-col transition-all duration-700" style={{ height: `${pct}%` }}>
                        <div className="w-full bg-blue-200" style={{ flex: count - done }}/>
                        <div className="w-full bg-blue-600" style={{ flex: done }}/>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400">{m.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3 justify-center text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block"/>Completed</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-200 inline-block"/>Other</span>
            </div>
          </div>

          {/* Recent Evaluations */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock size={16} className="text-amber-500"/> Recent Evaluations
              </h2>
              <Link to="/admin/evaluations" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View all <ChevronRight size={11}/>
              </Link>
            </div>
            <div className="space-y-2">
              {recentEvals.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No evaluations yet</p>
              ) : recentEvals.map((e: any) => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50">
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(e.employee?.name || 'U').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.employee?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{fmt(e.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_CLS[e.type]||'bg-gray-100 text-gray-600'}`}>{e.type}</span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[e.status]||'bg-gray-300'}`}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">

          {/* Organisation overview */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Users size={16} className="text-blue-500"/> Organisation
            </h2>
            <div className="text-center mb-4">
              <div className="text-4xl font-black text-gray-900">{totalUsers}</div>
              <div className="text-xs text-gray-400 font-medium mt-0.5">Total Members</div>
            </div>
            <div className="space-y-2.5">
              {Object.entries(byRole).map(([role, count]) => {
                const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                return (
                  <div key={role}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 capitalize font-medium">{role}</span>
                      <span className="text-gray-500">{count} <span className="text-gray-300">·</span> {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-1.5 rounded-full ${ROLE_COLORS[role]||'bg-gray-400'}`} style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>{departments.length} Department{departments.length !== 1 ? 's' : ''}</span>
              <span>{byRole.supervisor || 0} Supervisors</span>
            </div>
          </div>

          {/* Survey snapshot */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText size={16} className="text-violet-500"/> Surveys
              </h2>
              <Link to="/admin/surveys" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Manage <ChevronRight size={11}/>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Active',     val: surveys.filter((s:any)=>s.status==='active').length, bg:'bg-emerald-50', txt:'text-emerald-700' },
                { label: 'Draft',      val: surveys.filter((s:any)=>s.status==='draft').length,  bg:'bg-gray-50',    txt:'text-gray-700'    },
                { label: 'Responses',  val: completedResponses,                                   bg:'bg-blue-50',    txt:'text-blue-700'    },
                { label: 'Templates',  val: surveys.filter((s:any)=>s.isTemplate).length,         bg:'bg-violet-50',  txt:'text-violet-700'  },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <div className={`text-2xl font-bold ${s.txt}`}>{s.val}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Layers size={16} className="text-indigo-500"/> Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { label: 'Checklist Management', to: '/admin/checklists',          icon: <ClipboardList size={14}/>, color: 'text-blue-600 bg-blue-50'    },
                { label: 'Evaluation Reports',   to: '/admin/evaluations/reports', icon: <BarChart2 size={14}/>,     color: 'text-violet-600 bg-violet-50' },
                { label: 'Department Surveys',   to: '/manager/department-surveys',icon: <FileText size={14}/>,      color: 'text-emerald-600 bg-emerald-50'},
                { label: 'HR Assessments',       to: '/admin/assessment-queue',    icon: <Award size={14}/>,         color: 'text-amber-600 bg-amber-50'   },
                { label: 'Validation Queue',     to: '/hr/validation-queue',       icon: <Shield size={14}/>,        color: 'text-red-600 bg-red-50'       },
              ].map(l => (
                <Link key={l.to} to={l.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${l.color}`}>
                    {l.icon}
                  </div>
                  <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900">{l.label}</span>
                  <ChevronRight size={13} className="ml-auto text-gray-300 group-hover:text-gray-500"/>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;