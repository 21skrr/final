import React, { useEffect, useState, useCallback } from 'react';
import { User } from '../../types/user';
import {
  Users, ClipboardList, BarChart2, FileText, CheckCircle2,
  Clock, AlertTriangle, ChevronRight, RefreshCw, Calendar,
  Activity, TrendingUp, UserCheck, Layers, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { eventsService } from '../../services/events';

interface ManagerDashboardProps { user: User; }

const ROLE_GRAD: Record<string, string> = {
  employee:   'from-blue-500 to-indigo-600',
  supervisor: 'from-violet-500 to-purple-700',
  manager:    'from-indigo-500 to-blue-700',
  hr:         'from-emerald-500 to-teal-600',
};

const STATUS_CFG: Record<string, { cls: string; dot: string; label: string }> = {
  completed:   { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
  pending:     { cls: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400',   label: 'Pending' },
  in_progress: { cls: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500',    label: 'Active' },
  draft:       { cls: 'bg-gray-100 text-gray-500',       dot: 'bg-gray-300',    label: 'Draft' },
};

const TYPE_CLS: Record<string, string> = {
  '3-month':    'bg-violet-100 text-violet-700',
  '6-month':    'bg-blue-100 text-blue-700',
  '12-month':   'bg-indigo-100 text-indigo-700',
  'performance':'bg-orange-100 text-orange-700',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt = (d: string | null | undefined) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
};
const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false});

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user }) => {
  const [members,   setMembers]   = useState<any[]>([]);
  const [evals,     setEvals]     = useState<any[]>([]);
  const [surveys,   setSurveys]   = useState<any[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<any[]>([]);
  const [events,    setEvents]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const dept = user.department || '';
      const [usersRes, evalsRes, surveysRes, eventsRes] = await Promise.allSettled([
        api.get(`/users${dept ? `?department=${encodeURIComponent(dept)}` : ''}`),
        api.get('/reports/evaluations'),
        api.get('/surveys'),
        eventsService.getAllEvents().catch(() => []),
      ]);

      const allUsers   = usersRes.status   === 'fulfilled' ? (Array.isArray(usersRes.value.data)   ? usersRes.value.data   : []) : [];
      const allEvals   = evalsRes.status   === 'fulfilled' ? (Array.isArray(evalsRes.value.data)   ? evalsRes.value.data   : []) : [];
      const allSurveys = surveysRes.status === 'fulfilled' ? (Array.isArray(surveysRes.value.data) ? surveysRes.value.data : []) : [];
      const allEvents  = Array.isArray(eventsRes.status === 'fulfilled' ? eventsRes.value : []) ? (eventsRes.status === 'fulfilled' ? eventsRes.value : []) : [];

      // Fetch survey responses for all surveys
      const allResponses: any[] = [];
      await Promise.allSettled(allSurveys.map(async (s: any) => {
        try {
          const { data } = await api.get(`/surveys/${s.id}/responses`);
          const list = Array.isArray(data) ? data : [];
          list.forEach((r: any) => allResponses.push({ ...r, surveyId: s.id }));
        } catch { /* skip */ }
      }));

      // Filter to dept members (self included)
      const deptMembers = dept
        ? allUsers.filter((u: any) => u.department === dept && u.id !== user.id)
        : allUsers.filter((u: any) => u.id !== user.id);

      // Filter evals for dept employees
      const deptEmpIds = new Set(deptMembers.filter((u: any) => u.role === 'employee').map((u: any) => u.id));
      const deptEvals  = allEvals.filter((e: any) => deptEmpIds.has(e.employee?.id));

      // Upcoming events (after today, sorted)
      const today = new Date(); today.setHours(0,0,0,0);
      const upcoming = Array.isArray(allEvents)
        ? allEvents.filter((e: any) => new Date(e.startDate||e.date) > today)
            .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .slice(0, 3)
        : [];

      setMembers(deptMembers);
      setEvals(deptEvals);
      setSurveys(allSurveys);
      setSurveyResponses(allResponses);
      setEvents(upcoming);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [user.department, user.id]);

  useEffect(() => { load(); }, [load]);

  // ── Derived metrics ─────────────────────────────────────────────────────
  const employees   = members.filter(m => m.role === 'employee');
  const supervisors = members.filter(m => m.role === 'supervisor');

  const totalEvals     = evals.length;
  const completedEvals = evals.filter(e => e.status === 'completed').length;
  const pendingEvals   = evals.filter(e => e.status === 'pending').length;
  const overdueEvals   = evals.filter(e => e.status === 'pending' && e.dueDate && new Date(e.dueDate) < new Date()).length;
  const evalRate       = totalEvals > 0 ? Math.round((completedEvals / totalEvals) * 100) : 0;

  const activeSurveys  = surveys.filter(s => s.status === 'active').length;
  const deptEmpIdSet   = new Set(employees.map(e => e.id));
  const deptResponses  = surveyResponses.filter(r => deptEmpIdSet.has(r.userId) && r.status === 'completed').length;

  // Per-employee evaluation stats
  const empEvalStats = employees.map(emp => {
    const mine = evals.filter(e => e.employee?.id === emp.id);
    const done  = mine.filter(e => e.status === 'completed').length;
    return { ...emp, total: mine.length, completed: done, rate: mine.length > 0 ? Math.round((done/mine.length)*100) : 0 };
  }).sort((a, b) => b.total - a.total);

  // Recent evals
  const recentEvals = [...evals].sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  if (loading) return (
    <div className="flex items-center justify-center min-h-64 py-20">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"/>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 shadow-lg" style={{background:'linear-gradient(135deg, #002e6d 0%, #224f7d 60%, #2b6298 100%)'}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)'}}/>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium">Manager Portal</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Welcome back, {user.name} 👋</h1>
            <p className="text-blue-200 text-sm mt-1">
              {user.department} · {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
            </p>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium backdrop-blur transition-all">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''}/>
            Refresh
          </button>
        </div>

        {/* Live KPI strip */}
        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Employees',    value: employees.length,   icon: <Users size={14}/> },
            { label: 'Evaluations',  value: totalEvals,         icon: <ClipboardList size={14}/> },
            { label: 'Completed',    value: completedEvals,     icon: <CheckCircle2 size={14}/> },
            { label: 'Survey Resp.', value: deptResponses,      icon: <FileText size={14}/> },
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

      {/* ── Alert: overdue evaluations ── */}
      {overdueEvals > 0 && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center text-white flex-shrink-0"><AlertTriangle size={16}/></div>
            <div>
              <p className="font-semibold text-red-900 text-sm">{overdueEvals} Overdue Evaluation{overdueEvals>1?'s':''}</p>
              <p className="text-red-600 text-xs">Past their due date — requires immediate attention</p>
            </div>
          </div>
          <Link to="/manager/evaluations" className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors">
            View <ChevronRight size={12}/>
          </Link>
        </div>
      )}

      {/* ── Main 2-col grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: 2/3 */}
        <div className="lg:col-span-2 space-y-5">

          {/* Evaluation progress */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><BarChart2 size={16} className="text-indigo-500"/> Department Evaluations</h2>
              <Link to="/manager/evaluations" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">Full view <ChevronRight size={11}/></Link>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label:'Total',       val:totalEvals,     bg:'bg-slate-50  border-slate-200  text-slate-700'   },
                { label:'Completed',   val:completedEvals, bg:'bg-emerald-50 border-emerald-200 text-emerald-700' },
                { label:'Pending',     val:pendingEvals,   bg:'bg-amber-50  border-amber-200  text-amber-700'   },
                { label:'Overdue',     val:overdueEvals,   bg: overdueEvals>0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500' },
              ].map(p => (
                <div key={p.label} className={`p-3 rounded-xl border text-center ${p.bg}`}>
                  <div className="text-2xl font-bold">{p.val}</div>
                  <div className="text-[10px] font-medium mt-0.5">{p.label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>Completion rate</span>
              <span className={`font-bold text-sm ${evalRate>=70?'text-emerald-600':evalRate>=40?'text-amber-500':'text-red-500'}`}>{evalRate}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-3 rounded-full transition-all duration-700 ${evalRate>=70?'bg-gradient-to-r from-emerald-400 to-emerald-600':evalRate>=40?'bg-gradient-to-r from-amber-400 to-amber-500':'bg-gradient-to-r from-red-400 to-red-500'}`}
                style={{width:`${evalRate}%`}}/>
            </div>
          </div>

          {/* Employee progress table */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><Users size={16} className="text-blue-500"/> Team Progress</h2>
              <Link to="/manager/checklists" className="text-xs text-blue-600 hover:underline flex items-center gap-1">Checklists <ChevronRight size={11}/></Link>
            </div>
            {empEvalStats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No employee data available</p>
            ) : (
              <div className="space-y-2.5">
                {empEvalStats.slice(0, 8).map(emp => (
                  <div key={emp.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${ROLE_GRAD[emp.role]||ROLE_GRAD.employee} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {emp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-gray-800 truncate">{emp.name}</span>
                        <span className={`font-bold ${emp.rate===100?'text-emerald-600':emp.rate>=50?'text-blue-600':'text-amber-500'}`}>{emp.rate}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-1.5 rounded-full transition-all duration-700 ${emp.rate===100?'bg-emerald-500':emp.rate>=50?'bg-indigo-500':'bg-amber-400'}`}
                          style={{width:`${emp.rate}%`}}/>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 w-12 text-right">{emp.completed}/{emp.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent evaluations */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><Clock size={16} className="text-amber-500"/> Recent Evaluations</h2>
            </div>
            {recentEvals.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No evaluations yet</p>
            ) : (
              <div className="space-y-2">
                {recentEvals.map((e: any, i: number) => {
                  const sc = STATUS_CFG[e.status] || STATUS_CFG.pending;
                  const ov = e.status === 'pending' && e.dueDate && new Date(e.dueDate) < new Date();
                  return (
                    <div key={e.id||i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-gray-50 ${ov?'border-red-100 bg-red-50/30':'border-gray-50'}`}>
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${ROLE_GRAD.employee} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {(e.employee?.name||'?').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{e.employee?.name||'Unknown'}</p>
                        <p className="text-xs text-gray-400">{fmt(e.createdAt)} {ov && <span className="text-red-500 font-medium ml-1">· Overdue</span>}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_CLS[e.type]||'bg-gray-100 text-gray-600'}`}>{e.type}</span>
                        <span className={`w-2 h-2 rounded-full ${sc.dot}`}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: 1/3 */}
        <div className="space-y-5">

          {/* Department team */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><Users size={16} className="text-indigo-500"/> Department</h2>
            <div className="text-center mb-4">
              <div className="text-4xl font-black text-gray-900">{members.length}</div>
              <div className="text-xs text-gray-400 font-medium mt-0.5">Total Members</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label:'Employees',   val: employees.length,   bg:'bg-blue-50   text-blue-700'    },
                { label:'Supervisors', val: supervisors.length, bg:'bg-violet-50 text-violet-700'  },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <div className="text-xl font-bold">{s.val}</div>
                  <div className="text-[10px] font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {/* Avatar scroll */}
            <div className="flex flex-wrap gap-1.5">
              {employees.slice(0, 10).map(emp => (
                <div key={emp.id} title={emp.name}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${ROLE_GRAD.employee} flex items-center justify-center text-white text-xs font-bold cursor-default`}>
                  {emp.name.charAt(0)}
                </div>
              ))}
              {employees.length > 10 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                  +{employees.length-10}
                </div>
              )}
            </div>
          </div>

          {/* Surveys snapshot */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><FileText size={16} className="text-violet-500"/> Surveys</h2>
              <Link to="/manager/department-surveys" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">Manage <ChevronRight size={11}/></Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label:'Active',    val: activeSurveys,  bg:'bg-emerald-50 text-emerald-700' },
                { label:'Draft',     val: surveys.filter(s=>s.status==='draft').length,   bg:'bg-gray-50 text-gray-600'      },
                { label:'Dept Resp.',val: deptResponses,  bg:'bg-blue-50 text-blue-700'       },
                { label:'Total',     val: surveys.length, bg:'bg-violet-50 text-violet-700'   },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <div className="text-xl font-bold">{s.val}</div>
                  <div className="text-[10px] font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming events */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><Calendar size={16} className="text-purple-500"/> Upcoming Events</h2>
              <Link to="/calendar" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">Calendar <ChevronRight size={11}/></Link>
            </div>
            {events.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Calendar size={28} className="mx-auto mb-2 opacity-30"/>
                <p className="text-xs">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev: any) => (
                  <div key={ev.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0">
                      <Calendar size={14}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmt(ev.startDate)} · {fmtTime(ev.startDate)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ev.type==='meeting'?'bg-blue-100 text-blue-700':ev.type==='event'?'bg-emerald-100 text-emerald-700':'bg-purple-100 text-purple-700'}`}>
                      {ev.type||'event'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><Layers size={16} className="text-indigo-500"/> Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label:'Department Checklists', to:'/manager/checklists',          icon:<ClipboardList size={13}/>, color:'text-blue-600 bg-blue-50'     },
                { label:'Evaluation Reports',    to:'/manager/evaluation-reports',  icon:<BarChart2 size={13}/>,     color:'text-violet-600 bg-violet-50'  },
                { label:'Department Surveys',    to:'/manager/department-surveys',  icon:<FileText size={13}/>,      color:'text-emerald-600 bg-emerald-50' },
                { label:'Team Evaluations',      to:'/manager/evaluations',         icon:<Award size={13}/>,         color:'text-amber-600 bg-amber-50'    },
              ].map(l => (
                <Link key={l.to} to={l.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${l.color}`}>{l.icon}</div>
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

export default ManagerDashboard;