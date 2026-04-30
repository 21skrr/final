import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, X, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface DeptMember {
  id: string;
  name: string;
  role: string;
  department?: string;
}

interface MemberChecklist {
  id: string;
  title?: string;
  frequency?: string;
  completionPercentage: number;
  status: string;
}

const FREQ_LABEL: Record<string, string> = { none: 'Permanent', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

const ManagerChecklistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<DeptMember[]>([]);
  const [memberChecklists, setMemberChecklists] = useState<Record<string, MemberChecklist[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', frequency: 'daily', items: [{ title: '' }] });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all users in the manager's department
      const { data: usersData } = await api.get(`/users?department=${encodeURIComponent(user.department || '')}`).catch(() => ({ data: [] }));
      const dept: DeptMember[] = Array.isArray(usersData) ? usersData.filter((u: any) => u.id !== user.id) : [];
      setMembers(dept);

      // Fetch checklist progress for each member using the new user-tasks endpoint
      const clMap: Record<string, MemberChecklist[]> = {};
      for (const m of dept) {
        try {
          const { data } = await api.get(`/checklists/user-tasks?userId=${m.id}`);
          clMap[m.id] = Array.isArray(data) ? data.map((cl: any) => ({
            id: cl.id,
            title: cl.title,
            frequency: cl.frequency,
            completionPercentage: cl.completionPercentage,
            status: cl.status,
          })) : [];
        } catch { clMap[m.id] = []; }
      }
      setMemberChecklists(clMap);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    const validItems = form.items.filter(i => i.title.trim());
    if (!form.title.trim() || validItems.length === 0) return;
    setCreating(true);
    try {
      const { data } = await api.post('/checklists/full', {
        title: form.title, description: form.description, frequency: form.frequency, items: validItems,
      });
      if (data.checklistId) {
        await api.post(`/checklists/${data.checklistId}/assign-team`, {
          userIds: members.filter(m => m.role === 'employee').map(m => m.id),
        });
      }
      setShowCreate(false);
      setForm({ title: '', description: '', frequency: 'daily', items: [{ title: '' }] });
      fetchData();
    } finally {
      setCreating(false);
    }
  };

  // Totals
  const totalAssignments = Object.values(memberChecklists).reduce((s, cls) => s + cls.length, 0);
  const totalCompleted = Object.values(memberChecklists).reduce((s, cls) => s + cls.filter(c => c.status === 'completed').length, 0);
  const deptRate = totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0;

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Department Checklists</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user?.department} — manage your department's task lists</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> New Checklist
          </button>
        </div>

        {/* Dept summary bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 mb-6 flex items-center gap-6">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{deptRate}%</p>
            <p className="text-sm text-gray-500">Dept. completion rate</p>
          </div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${deptRate === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${deptRate}%` }} />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{members.length} Members</p>
            <p className="text-xs text-gray-400">{totalCompleted} / {totalAssignments} completed</p>
          </div>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Department Checklist</h2>
                <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="Checklist title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                  <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white">
                    <option value="none">Permanent (no reset)</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tasks *</label>
                  <div className="space-y-2">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input value={item.title} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { title: e.target.value } : it) }))}
                          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder={`Task ${idx + 1}`} />
                        {form.items.length > 1 && <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))} className="text-red-400"><X size={16} /></button>}
                      </div>
                    ))}
                    <button onClick={() => setForm(f => ({ ...f, items: [...f.items, { title: '' }] }))} className="text-sm text-blue-600 font-medium">+ Add task</button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">Cancel</button>
                  <button onClick={handleCreate} disabled={creating} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create & Assign to Dept'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member list */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" /></div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Users size={48} className="mx-auto mb-3 opacity-30" /><p>No department members found</p></div>
        ) : (
          <div className="space-y-3">
            {members.map(member => {
              const cls = memberChecklists[member.id] || [];
              const avg = cls.length > 0 ? Math.round(cls.reduce((s, c) => s + (c.completionPercentage || 0), 0) / cls.length) : 0;
              const isExp = expanded === member.id;
              return (
                <div key={member.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                  <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    onClick={() => setExpanded(isExp ? null : member.id)}>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">{member.name.charAt(0)}</div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{member.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{member.role} · {cls.length} checklist{cls.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{avg}%</p>
                        <p className="text-xs text-gray-400">completion</p>
                      </div>
                      <div className="w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${avg === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${avg}%` }} />
                      </div>
                      {isExp ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>
                  {isExp && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3">
                      {cls.length === 0 ? <p className="text-sm text-gray-400 py-2">No checklists assigned</p> : (
                        <div className="space-y-2">
                          {cls.map(cl => (
                            <div key={cl.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                              <div className="flex items-center gap-2">
                                {cl.status === 'completed' ? <CheckCircle2 size={14} className="text-emerald-500" /> : cl.status === 'overdue' ? <XCircle size={14} className="text-red-500" /> : <Clock size={14} className="text-amber-500" />}
                                <span className="text-sm text-gray-800 dark:text-gray-200">{cl.title || '(Untitled)'}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 capitalize">
                                  {FREQ_LABEL[cl.frequency || 'none'] || 'Permanent'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{cl.completionPercentage || 0}%</span>
                                <div className="w-16 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${(cl.completionPercentage || 0) === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${cl.completionPercentage || 0}%` }} />
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

export default ManagerChecklistDashboard;