import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { CheckCircle2, Circle, RefreshCw, Calendar, RotateCcw, Infinity, Clock, TrendingUp, Zap } from 'lucide-react';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  isCompleted: boolean;
}

interface TaskChecklist {
  id: string;
  checklistId: string;
  title: string;
  description?: string;
  frequency: 'none' | 'daily' | 'weekly' | 'monthly';
  periodKey: string | null;
  dueDate?: string;
  items: TaskItem[];
  completionPercentage: number;
  status: string;
}

const SECTIONS = [
  { key: 'daily'   as const, label: 'Daily',     subtitle: 'Resets every morning',        icon: <Zap size={18}/>,      accent: 'from-blue-500 to-cyan-500',     ring: 'ring-blue-200',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',    bar: 'bg-blue-500'    },
  { key: 'weekly'  as const, label: 'Weekly',    subtitle: 'Resets each Monday',          icon: <Calendar size={18}/>, accent: 'from-violet-500 to-purple-500', ring: 'ring-violet-200',  badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', bar: 'bg-violet-500' },
  { key: 'monthly' as const, label: 'Monthly',   subtitle: 'Resets on the 1st',           icon: <RotateCcw size={18}/>,accent: 'from-emerald-500 to-teal-500',  ring: 'ring-emerald-200', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', bar: 'bg-emerald-500' },
  { key: 'none'    as const, label: 'Permanent', subtitle: 'Always-on tasks',             icon: <Infinity size={18}/>, accent: 'from-slate-500 to-gray-600',    ring: 'ring-slate-200',   badge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',   bar: 'bg-slate-500'   },
];

const EmployeeChecklists: React.FC = () => {
  const [checklists, setChecklists] = useState<TaskChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/checklists/my-tasks');
      const tasks: TaskChecklist[] = Array.isArray(data) ? data : [];
      setChecklists(tasks);
      // Auto-expand all by default
      setExpandedIds(new Set(tasks.map(t => t.id)));
    } catch (e) {
      console.error('Failed to load tasks', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const toggleItem = async (checklist: TaskChecklist, item: TaskItem) => {
    if (toggling) return;
    setToggling(item.id);
    const newVal = !item.isCompleted;
    // Optimistic update
    setChecklists(prev => prev.map(cl => cl.id !== checklist.id ? cl : {
      ...cl,
      items: cl.items.map(i => i.id === item.id ? { ...i, isCompleted: newVal } : i),
      completionPercentage: Math.round(
        (cl.items.filter(i => i.id === item.id ? newVal : i.isCompleted).length / cl.items.length) * 100
      ),
    }));
    try {
      await api.post(`/checklists/items/${item.id}/toggle`, { checklistId: checklist.checklistId, isCompleted: newVal });
    } catch { fetchTasks(); }
    finally { setToggling(null); }
  };

  const toggleExpand = (id: string) => setExpandedIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  // Overall stats
  const allItems = checklists.flatMap(c => c.items);
  const doneCount = allItems.filter(i => i.isCompleted).length;
  const totalCount = allItems.length;
  const overallPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

        {/* Top bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
              <p className="text-xs text-gray-400 mt-0.5">{doneCount} of {totalCount} completed</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Overall ring */}
              <div className="relative w-11 h-11">
                <svg className="w-11 h-11 -rotate-90">
                  <circle cx="22" cy="22" r="17" fill="none" stroke="#f1f5f9" strokeWidth="4"/>
                  <circle cx="22" cy="22" r="17" fill="none" stroke="#3b82f6" strokeWidth="4"
                    strokeDasharray={`${2*Math.PI*17}`}
                    strokeDashoffset={`${2*Math.PI*17*(1-overallPct/100)}`}
                    strokeLinecap="round" className="transition-all duration-500"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-blue-600">{overallPct}%</span>
                </div>
              </div>
              <button onClick={fetchTasks} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <RefreshCw size={15}/>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-6 space-y-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"/>
            </div>
          ) : checklists.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={36} className="text-blue-400"/>
              </div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">No tasks yet</p>
              <p className="text-sm text-gray-400 mt-1">Your supervisor will assign checklists here</p>
            </div>
          ) : (
            SECTIONS.map(section => {
              const sectionLists = checklists.filter(c => c.frequency === section.key);
              if (sectionLists.length === 0) return null;

              const sectionItems = sectionLists.flatMap(c => c.items);
              const secDone = sectionItems.filter(i => i.isCompleted).length;
              const secTotal = sectionItems.length;
              const secPct = secTotal > 0 ? Math.round((secDone / secTotal) * 100) : 0;

              return (
                <section key={section.key}>
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${section.accent} flex items-center justify-center text-white shadow-sm`}>
                      {section.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">{section.label}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${section.badge}`}>{sectionLists.length} list{sectionLists.length > 1 ? 's' : ''}</span>
                        {secPct === 100 && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold flex items-center gap-1"><CheckCircle2 size={10}/> All done!</span>}
                      </div>
                      <p className="text-xs text-gray-400">{section.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{secDone}/{secTotal}</p>
                      <div className="w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                        <div className={`h-1.5 rounded-full transition-all ${secPct === 100 ? 'bg-emerald-500' : section.bar}`} style={{width:`${secPct}%`}}/>
                      </div>
                    </div>
                  </div>

                  {/* Checklists in this section */}
                  <div className="space-y-3 pl-12">
                    {sectionLists.map(checklist => {
                      const isExpanded = expandedIds.has(checklist.id);
                      const done = checklist.items.filter(i => i.isCompleted).length;
                      const total = checklist.items.length;
                      const pct = checklist.completionPercentage;
                      const allDone = pct === 100;

                      return (
                        <div key={checklist.id} className={`bg-white dark:bg-gray-800 rounded-2xl border transition-shadow ${allDone ? 'border-emerald-100 dark:border-emerald-900/50 shadow-sm' : 'border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md'}`}>
                          {/* Checklist header */}
                          <button onClick={() => toggleExpand(checklist.id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                            {/* Mini progress ring */}
                            <div className="relative flex-shrink-0 w-9 h-9">
                              <svg className="w-9 h-9 -rotate-90">
                                <circle cx="18" cy="18" r="13" fill="none" stroke="#f1f5f9" strokeWidth="3"/>
                                <circle cx="18" cy="18" r="13" fill="none"
                                  stroke={allDone ? '#10b981' : '#3b82f6'} strokeWidth="3"
                                  strokeDasharray={`${2*Math.PI*13}`}
                                  strokeDashoffset={`${2*Math.PI*13*(1-pct/100)}`}
                                  strokeLinecap="round" className="transition-all duration-500"/>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                {allDone
                                  ? <CheckCircle2 size={11} className="text-emerald-500"/>
                                  : <span className="text-[9px] font-bold text-blue-600">{pct}%</span>}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${allDone ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>{checklist.title}</p>
                              <p className="text-xs text-gray-400">{done}/{total} tasks</p>
                            </div>
                            {checklist.periodKey && (
                              <span className="text-xs text-gray-300 flex items-center gap-1 flex-shrink-0"><Clock size={10}/> {checklist.periodKey}</span>
                            )}
                            <svg className={`flex-shrink-0 w-4 h-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                          </button>

                          {/* Items */}
                          {isExpanded && (
                            <div className="border-t border-gray-50 dark:border-gray-700 px-4 pb-3 pt-1">
                              {checklist.items.length === 0 ? (
                                <p className="text-xs text-gray-400 py-2 italic">No tasks in this checklist</p>
                              ) : (
                                <ul className="space-y-0.5">
                                  {checklist.items.map(item => (
                                    <li key={item.id}>
                                      <button onClick={() => toggleItem(checklist, item)} disabled={toggling === item.id}
                                        className="w-full flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group text-left">
                                        <span className={`flex-shrink-0 transition-colors ${item.isCompleted ? 'text-emerald-500' : 'text-gray-200 group-hover:text-blue-300 dark:text-gray-600'}`}>
                                          {toggling === item.id
                                            ? <span className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"/>
                                            : item.isCompleted ? <CheckCircle2 size={20}/> : <Circle size={20}/>}
                                        </span>
                                        <span className={`text-sm flex-1 transition-colors leading-snug ${item.isCompleted ? 'line-through text-gray-300 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200'}`}>
                                          {item.title}
                                          {item.description && <span className="block text-xs text-gray-400 mt-0.5 no-underline">{item.description}</span>}
                                        </span>
                                        {item.isRequired && !item.isCompleted && (
                                          <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 px-1.5 py-0.5 rounded-full flex-shrink-0">Required</span>
                                        )}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeChecklists;