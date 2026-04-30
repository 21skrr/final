import React, { useEffect, useState } from 'react';
import { User } from '../../types/user';
import {
  Users, Calendar, ClipboardList, AlertTriangle, CheckCircle2,
  ChevronRight, RefreshCw, Activity, Clock, Award,
  UserCheck, Layers, TrendingUp, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import teamService from '../../services/teamService';
import * as evaluationService from '../../services/evaluationService';
import { eventsService } from '../../services/events';
import onboardingService from '../../services/onboardingService';
import supervisorAssessmentService from '../../services/supervisorAssessmentService';

interface SupervisorDashboardProps { user: User; }

type TeamMember = {
  id: string; name: string; role?: string;
  program?: string; stage?: string;
  progress?: number; daysInProgram?: number;
};

type Evaluation = {
  id: string; employeeName?: string; employeeId?: string;
  type?: string; dueDate?: string; status?: string;
};

type Event = { id: string; title: string; startDate?: string; date?: string; type?: string; };

const STAGE_CFG: Record<string, { cls: string; bar: string; label: string }> = {
  prepare:   { cls: 'bg-blue-100 text-blue-700',     bar: 'bg-blue-500',   label: 'Prepare' },
  orient:    { cls: 'bg-amber-100 text-amber-700',   bar: 'bg-amber-400',  label: 'Orient' },
  land:      { cls: 'bg-violet-100 text-violet-700', bar: 'bg-violet-500', label: 'Land' },
  integrate: { cls: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', label: 'Integrate' },
  excel:     { cls: 'bg-pink-100 text-pink-700',     bar: 'bg-pink-500',   label: 'Excel' },
};

const TYPE_CLS: Record<string, string> = {
  '3-month':    'bg-violet-100 text-violet-700',
  '6-month':    'bg-blue-100 text-blue-700',
  '12-month':   'bg-indigo-100 text-indigo-700',
  'performance':'bg-orange-100 text-orange-700',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtDate = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : `${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
};
const fmtTime = (d?: string) => {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false});
};

const normalizeStage = (s?: string) => (s||'').replace(/ /g,'').toLowerCase();
const getInitials = (name: string) => {
  const p = (name||'?').trim().split(' ');
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0]+p[p.length-1][0]).toUpperCase();
};

const AVATAR_GRADS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-700',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
];

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ user }) => {
  const [teamMembers,       setTeamMembers]       = useState<TeamMember[]>([]);
  const [pendingEvals,      setPendingEvals]       = useState<Evaluation[]>([]);
  const [upcomingEvents,    setUpcomingEvents]     = useState<Event[]>([]);
  const [pendingAssessments,setPendingAssessments] = useState<any[]>([]);
  const [loading,           setLoading]            = useState(true);
  const [refreshing,        setRefreshing]         = useState(false);
  const [error,             setError]              = useState<string|null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      // Team + onboarding progress
      const team = await teamService.getMyTeam();
      const teamWithProgress: TeamMember[] = await Promise.all(
        team.map(async (m: TeamMember) => {
          try {
            const j = await onboardingService.getJourney(m.id);
            return { ...m, progress: j?.progress?.overall ?? undefined };
          } catch { return m; }
        })
      );
      setTeamMembers(teamWithProgress);

      // Pending evaluations
      const evalsRes = await evaluationService.getSupervisorEvaluations();
      const arr: any[] = Array.isArray(evalsRes) ? evalsRes : (evalsRes?.data || []);
      setPendingEvals(
        arr.filter(e => e.status === 'pending' || e.status === 'in_progress')
           .map(e => ({
             id: e.id,
             employeeName: e.employeeName || e.employee?.name,
             employeeId: e.employeeId || e.employee?.id,
             type: e.type || e.evaluationType,
             dueDate: e.dueDate,
             status: e.status,
           }))
      );

      // Upcoming events
      const today = new Date(); today.setHours(0,0,0,0);
      const allEvents: Event[] = await eventsService.getAllEvents();
      setUpcomingEvents(
        (Array.isArray(allEvents) ? allEvents : [])
          .filter(e => { const d = new Date(e.startDate||''); d.setHours(0,0,0,0); return d > today; })
          .sort((a,b) => new Date(a.startDate||'').getTime() - new Date(b.startDate||'').getTime())
          .slice(0, 3)
      );

      // Pending assessments
      try {
        const ar = await supervisorAssessmentService.getSupervisorAssessments(user.id);
        setPendingAssessments(
          (ar.assessments||[]).filter((a: any) =>
            ['pending_certificate','certificate_uploaded','assessment_pending',
             'assessment_completed','decision_pending','hr_approval_pending'].includes(a.status)
          )
        );
      } catch { /* optional */ }
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  // ── Derived ─────────────────────────────────────────────────────────────
  const avgProgress   = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((s,m) => s + (m.progress||0), 0) / teamMembers.length) : 0;
  const needsAttention = teamMembers.filter(m => (m.progress ?? 100) < 60);
  const overdueEvals   = pendingEvals.filter(e => e.dueDate && new Date(e.dueDate) < new Date());

  if (loading) return (
    <div className="flex items-center justify-center min-h-64 py-20">
      <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full"/>
    </div>
  );
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 shadow-lg" style={{background:'linear-gradient(135deg, #002e6d 0%, #224f7d 60%, #2b6298 100%)'}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 80% 40%, white 0%, transparent 60%)'}}/>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium">Supervisor Portal</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Welcome back, {user.name} 👋</h1>
            <p className="text-blue-200 text-sm mt-1">
              {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
            </p>
          </div>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium backdrop-blur transition-all">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''}/>
            Refresh
          </button>
        </div>

        {/* KPI strip */}
        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Team Members',  value: teamMembers.length,        icon: <Users size={14}/> },
            { label: 'Avg Progress',  value: `${avgProgress}%`,         icon: <TrendingUp size={14}/> },
            { label: 'Pending Evals', value: pendingEvals.length,       icon: <ClipboardList size={14}/> },
            { label: 'Assessments',   value: pendingAssessments.length, icon: <Award size={14}/> },
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

      {/* ── Alert strip ── */}
      {(needsAttention.length > 0 || overdueEvals.length > 0 || pendingAssessments.length > 0) && (
        <div className="space-y-3">
          {overdueEvals.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center text-white flex-shrink-0"><AlertTriangle size={16}/></div>
                <div>
                  <p className="font-semibold text-red-900 text-sm">{overdueEvals.length} Overdue Evaluation{overdueEvals.length>1?'s':''}</p>
                  <p className="text-red-600 text-xs">These are past their due date</p>
                </div>
              </div>
              <Link to="/supervisor/evaluations" className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors">
                Review <ChevronRight size={12}/>
              </Link>
            </div>
          )}
          {needsAttention.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center text-white flex-shrink-0"><AlertTriangle size={16}/></div>
                <div>
                  <p className="font-semibold text-amber-900 text-sm">{needsAttention.length} Member{needsAttention.length>1?'s':''} Need Attention</p>
                  <p className="text-amber-700 text-xs">Progress below 60% — {needsAttention.map(m=>m.name.split(' ')[0]).join(', ')}</p>
                </div>
              </div>
              <Link to="/team" className="flex items-center gap-1 px-3 py-1.5 bg-amber-400 text-white rounded-lg text-xs font-semibold hover:bg-amber-500 transition-colors">
                View Team <ChevronRight size={12}/>
              </Link>
            </div>
          )}
          {pendingAssessments.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white flex-shrink-0"><UserCheck size={16}/></div>
                <div>
                  <p className="font-semibold text-blue-900 text-sm">{pendingAssessments.length} Pending Assessment{pendingAssessments.length>1?'s':''}</p>
                  <p className="text-blue-600 text-xs">Require your review or action</p>
                </div>
              </div>
              <Link to="/supervisor/assessments" className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                Review <ChevronRight size={12}/>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: 2/3 */}
        <div className="lg:col-span-2 space-y-5">

          {/* Team Member Cards */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-violet-500"/> My Team
              </h2>
              <Link to="/team" className="text-xs text-violet-600 hover:underline flex items-center gap-1">
                View all <ChevronRight size={11}/>
              </Link>
            </div>
            {teamMembers.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">No team members yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((m, i) => {
                  const stage = normalizeStage(m.stage);
                  const stageCfg = STAGE_CFG[stage] || { cls:'bg-gray-100 text-gray-600', bar:'bg-gray-400', label: m.stage||'N/A' };
                  const prog = m.progress ?? 0;
                  const progColor = prog >= 70 ? 'bg-emerald-500' : prog >= 40 ? 'bg-violet-500' : 'bg-amber-400';
                  const grad = AVATAR_GRADS[i % AVATAR_GRADS.length];
                  return (
                    <div key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors hover:bg-gray-50 ${prog < 60 ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}`}>
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {getInitials(m.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                          <p className="font-semibold text-sm text-gray-900 truncate">{m.name}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stageCfg.cls}`}>{stageCfg.label}</span>
                            {m.daysInProgram && <span className="text-[10px] text-gray-400">{m.daysInProgram}d</span>}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{m.program || 'Programme'}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-1.5 rounded-full transition-all duration-700 ${progColor}`} style={{width:`${prog}%`}}/>
                          </div>
                          <span className={`text-xs font-bold w-9 text-right flex-shrink-0 ${prog>=70?'text-emerald-600':prog>=40?'text-violet-600':'text-amber-500'}`}>{prog}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Evaluations */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock size={16} className="text-amber-500"/> Pending Evaluations
                {pendingEvals.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{pendingEvals.length}</span>
                )}
              </h2>
              <Link to="/supervisor/evaluations" className="text-xs text-amber-600 hover:underline flex items-center gap-1">
                All evals <ChevronRight size={11}/>
              </Link>
            </div>
            {pendingEvals.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 size={28} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">All caught up! No pending evaluations.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingEvals.map(e => {
                  const ov = e.dueDate && new Date(e.dueDate) < new Date();
                  return (
                    <div key={e.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-gray-50 ${ov ? 'border-red-100 bg-red-50/30' : 'border-gray-50'}`}>
                      <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(e.employeeName || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{e.employeeName || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">
                          Due: {fmtDate(e.dueDate)}
                          {ov && <span className="text-red-500 font-semibold ml-1">· Overdue</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_CLS[e.type||'']||'bg-gray-100 text-gray-600'}`}>{e.type||'eval'}</span>
                        <Link to={`/supervisor/evaluations/${e.id}/form`}
                          className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-200 transition-colors">
                          Start
                        </Link>
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

          {/* Team Snapshot */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Activity size={16} className="text-violet-500"/> Team Snapshot
            </h2>
            <div className="text-center mb-4">
              <div className="text-4xl font-black text-gray-900">{avgProgress}%</div>
              <div className="text-xs text-gray-400 font-medium mt-0.5">Average Progress</div>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div className={`h-2.5 rounded-full transition-all duration-700 ${avgProgress>=70?'bg-gradient-to-r from-emerald-400 to-emerald-600':avgProgress>=40?'bg-gradient-to-r from-violet-400 to-violet-600':'bg-gradient-to-r from-amber-400 to-amber-500'}`}
                style={{width:`${avgProgress}%`}}/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label:'Members',    val: teamMembers.length,                              bg:'bg-violet-50 text-violet-700' },
                { label:'On Track',   val: teamMembers.filter(m=>(m.progress??0)>=60).length, bg:'bg-emerald-50 text-emerald-700' },
                { label:'Attention',  val: needsAttention.length,                          bg: needsAttention.length>0?'bg-red-50 text-red-700':'bg-gray-50 text-gray-500' },
                { label:'Pending',    val: pendingEvals.length,                             bg:'bg-amber-50 text-amber-700' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <div className="text-xl font-bold">{s.val}</div>
                  <div className="text-[10px] font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={16} className="text-purple-500"/> Events
              </h2>
              <Link to="/calendar" className="text-xs text-violet-600 hover:underline flex items-center gap-1">
                Calendar <ChevronRight size={11}/>
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Calendar size={28} className="mx-auto mb-2 opacity-30"/>
                <p className="text-xs">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0">
                      <Calendar size={14}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmtDate(ev.startDate||ev.date)} · {fmtTime(ev.startDate||ev.date)}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ev.type==='meeting'?'bg-blue-100 text-blue-700':ev.type==='event'?'bg-emerald-100 text-emerald-700':'bg-purple-100 text-purple-700'}`}>
                      {ev.type||'event'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Layers size={16} className="text-violet-500"/> Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { label:'My Team',           to:'/team',                      icon:<Users size={13}/>,        color:'text-blue-600 bg-blue-50'     },
                { label:'Team Checklists',   to:'/supervisor/checklists',     icon:<ClipboardList size={13}/>, color:'text-violet-600 bg-violet-50'  },
                { label:'Evaluations',       to:'/supervisor/evaluations',   icon:<ClipboardList size={13}/>, color:'text-amber-600 bg-amber-50'    },
                { label:'My Onboarding',     to:'/supervisor/my-onboarding', icon:<CheckCircle2 size={13}/>, color:'text-emerald-600 bg-emerald-50' },
                { label:'Assessments',       to:'/supervisor/assessments',   icon:<Award size={13}/>,         color:'text-purple-600 bg-purple-50'  },
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

export default SupervisorDashboard;