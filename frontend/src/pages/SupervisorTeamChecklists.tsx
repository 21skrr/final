import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, X, Search } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department?: string;
  completedTasks?: number;
  totalTasks?: number;
  onboardingProgress?: number;
}

interface MemberChecklist {
  id: string;
  checklistId: string;
  title?: string;
  frequency?: string;
  completionPercentage: number;
  status: string;
  dueDate?: string;
}

const FREQ_LABEL: Record<string, string> = { none: 'Permanent', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
const FREQ_COLOR: Record<string, string> = {
  none: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  daily: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  weekly: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  monthly: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
};

const SupervisorTeamChecklists: React.FC = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [memberChecklists, setMemberChecklists] = useState<Record<string, MemberChecklist[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', frequency: 'daily', items: [{ title: '' }] });

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get team members via supervisor endpoint
      const { data: teamData } = await api.get('/supervisor/team/onboarding');
      const raw = Array.isArray(teamData) ? teamData : [];
      const members: TeamMember[] = raw.map((item: any) => ({
        id: item.employee?.id || item.id,
        name: item.employee?.name || item.name,
        role: item.employee?.role || item.role,
        department: item.employee?.department || item.department,
        completedTasks: item.completedTasks,
        totalTasks: item.totalTasks,
      })).filter((m: TeamMember) => m.id);
      setTeam(members);

      // Fetch checklist progress for each member using the new user-tasks endpoint
      const clMap: Record<string, MemberChecklist[]> = {};
      await Promise.all(members.map(async (m) => {
        try {
          const { data } = await api.get(`/checklists/user-tasks?userId=${m.id}`);
          clMap[m.id] = Array.isArray(data) ? data.map((cl: any) => ({
            id: cl.id,
            checklistId: cl.checklistId,
            title: cl.title,
            frequency: cl.frequency,
            completionPercentage: cl.completionPercentage,
            status: cl.status,
            dueDate: cl.dueDate,
          })) : [];
        } catch { clMap[m.id] = []; }
      }));
      setMemberChecklists(clMap);
    } catch (e) {
      console.error('Failed to load team data', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);


  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    const validItems = form.items.filter(i => i.title.trim());
    if (!form.title.trim() || validItems.length === 0) return;
    setCreating(true);
    try {
      const { data } = await api.post('/checklists/full', {
        title: form.title, description: form.description,
        frequency: form.frequency, items: validItems,
      });
      if (data.checklistId) {
        await api.post(`/checklists/${data.checklistId}/assign-team`, {
          userIds: team.map(m => m.id),
        });
      }
      setShowCreate(false);
      setForm({ title: '', description: '', frequency: 'daily', items: [{ title: '' }] });
      fetchData();
    } catch (e) {
      console.error('Create failed', e);
    } finally {
      setCreating(false);
    }
  };

  const filteredTeam = team.filter(m => m.name?.toLowerCase().includes(search.toLowerCase()));

  // Summary stats
  const totalAssigned = Object.values(memberChecklists).reduce((s, cls) => s + cls.length, 0);
  const avgCompletion = totalAssigned > 0
    ? Math.round(Object.values(memberChecklists).flat().reduce((s, cl) => s + (cl.completionPercentage || 0), 0) / totalAssigned)
    : 0;

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Checklists</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Monitor and manage your team's task progress</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={16} /> New Checklist
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Team Members', value: team.length, color: 'text-blue-600' },
            { label: 'Total Assignments', value: totalAssigned, color: 'text-violet-600' },
            { label: 'Avg. Completion', value: `${avgCompletion}%`, color: avgCompletion === 100 ? 'text-emerald-600' : 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center shadow-sm">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team member..."
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Team Checklist</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Daily Safety Check" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[{v:'none',l:'Permanent'},{v:'daily',l:'Daily'},{v:'weekly',l:'Weekly'},{v:'monthly',l:'Monthly'}].map(opt => (
                      <button key={opt.v} onClick={() => setForm(f => ({...f, frequency: opt.v}))}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${form.frequency === opt.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300'}`}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tasks *</label>
                  <div className="space-y-2">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-xs text-gray-400 w-5 text-center">{idx+1}</span>
                        <input value={item.title} onChange={e => setForm(f => ({...f, items: f.items.map((it,i)=>i===idx?{title:e.target.value}:it)}))}
                          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={`Task ${idx+1}`} />
                        {form.items.length > 1 && <button onClick={() => setForm(f=>({...f,items:f.items.filter((_,i)=>i!==idx)}))} className="text-red-400 hover:text-red-600 p-1"><X size={14}/></button>}
                      </div>
                    ))}
                    <button onClick={() => setForm(f=>({...f,items:[...f.items,{title:''}]}))} className="text-sm text-blue-600 hover:text-blue-800 font-medium pl-7">+ Add task</button>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                  <button onClick={handleCreate} disabled={creating || !form.title.trim()}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors">
                    {creating ? 'Creating...' : `Create & Assign to Team (${team.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team list */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"/></div>
        ) : filteredTeam.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-30"/>
            <p className="font-medium">{search ? 'No results for "' + search + '"' : 'No team members found'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTeam.map(member => {
              const cls = memberChecklists[member.id] || [];
              const avg = cls.length > 0 ? Math.round(cls.reduce((s,c) => s + (c.completionPercentage||0), 0) / cls.length) : 0;
              const isExp = expanded === member.id;
              const overdueCount = cls.filter(c => c.status === 'overdue').length;

              return (
                <div key={member.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                  <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    onClick={() => setExpanded(isExp ? null : member.id)}>
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {member.name?.charAt(0) || '?'}
                    </div>
                    {/* Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{member.name}</p>
                        {overdueCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">{overdueCount} overdue</span>}
                      </div>
                      <p className="text-xs text-gray-400">{cls.length} checklist{cls.length !== 1 ? 's' : ''} assigned</p>
                    </div>
                    {/* Progress */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className={`text-sm font-bold ${avg === 100 ? 'text-emerald-600' : 'text-gray-700 dark:text-gray-200'}`}>{avg}%</p>
                        <p className="text-xs text-gray-400">avg</p>
                      </div>
                      <div className="w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${avg === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${avg}%` }}/>
                      </div>
                      {isExp ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                    </div>
                  </button>

                  {isExp && (
                    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750 px-5 pb-4 pt-3">
                      {cls.length === 0 ? (
                        <p className="text-sm text-gray-400 py-2 italic">No checklists assigned to this member yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {cls.map(cl => (
                            <div key={cl.id} className="flex items-center justify-between py-2.5 px-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                              <div className="flex items-center gap-2 min-w-0">
                                {cl.status === 'completed'
                                  ? <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0"/>
                                  : cl.status === 'overdue'
                                    ? <XCircle size={15} className="text-red-500 flex-shrink-0"/>
                                    : <Clock size={15} className="text-amber-500 flex-shrink-0"/>}
                                <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{cl.title || '(Untitled)'}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${FREQ_COLOR[cl.frequency || 'none'] || FREQ_COLOR.none}`}>
                                  {FREQ_LABEL[cl.frequency || 'none'] || 'Permanent'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{cl.completionPercentage || 0}%</span>
                                <div className="w-16 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${(cl.completionPercentage||0) === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width:`${cl.completionPercentage||0}%`}}/>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupervisorTeamChecklists;