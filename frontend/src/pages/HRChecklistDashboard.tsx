import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { BarChart2, CheckCircle2, XCircle, Users, ListChecks, Plus, X, Search, RefreshCw, Trash2, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import userService from '../services/userService';
import Select from 'react-select';
import { useAuth } from '../context/AuthContext';

interface Analytics { totalChecklists:number; totalAssignments:number; completed:number; overdue:number; completionRate:number; byFrequency:any[]; byDepartment:any[]; }
interface CL { id:string; checklistId:string; title:string; frequency?:string; status:string; completionPercentage:number; userId?:string|null; description?:string; programType?:string; stage?:string; }
interface Item { id?:string; title:string; description?:string; isRequired:boolean; orderIndex:number; }

const FREQ_LABEL:Record<string,string> = {none:'Permanent',daily:'Daily',weekly:'Weekly',monthly:'Monthly'};
const FREQ_COLOR:Record<string,string> = {none:'bg-slate-100 text-slate-600',daily:'bg-blue-100 text-blue-700',weekly:'bg-violet-100 text-violet-700',monthly:'bg-emerald-100 text-emerald-700'};

const HRChecklistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics|null>(null);
  const [checklists, setChecklists] = useState<CL[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({title:'',description:'',frequency:'none',items:[{title:'',isRequired:true}]});
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [itemsMap, setItemsMap] = useState<Record<string,Item[]>>({});
  const [editItems, setEditItems] = useState<Item[]>([]);
  const [savingItems, setSavingItems] = useState(false);
  // assign state
  const [showAssign, setShowAssign] = useState<CL|null>(null);
  const [assignScope, setAssignScope] = useState<'employee'|'team'|'department'>('employee');
  const [users, setUsers] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<string|null>(null);
  const [deleting, setDeleting] = useState<string|null>(null);

  const role = user?.role || 'hr';
  // Available scopes per role
  const availableScopes = role === 'supervisor'
    ? [{ v:'employee', l:'Single Employee' },{ v:'team', l:'My Team' }]
    : role === 'manager'
    ? [{ v:'employee', l:'Single Employee' },{ v:'team', l:'A Team' },{ v:'department', l:'My Department' }]
    : [{ v:'employee', l:'Single Employee' },{ v:'team', l:'A Team' },{ v:'department', l:'A Department' }];


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([
        api.get('/checklists/hr-analytics').catch(()=>({data:null})),
        api.get('/checklists').catch(()=>({data:[]})),
      ]);
      if (aRes.data) setAnalytics(aRes.data);
      const all:CL[] = Array.isArray(cRes.data) ? cRes.data : [];
      // Deduplicate by checklistId (show templates preferring userId=null)
      const map = new Map<string,CL>();
      [...all].sort((a,b)=>(!a.userId?-1:1)).forEach(c=>{ if(!map.has(c.checklistId)) map.set(c.checklistId,c); });
      setChecklists(Array.from(map.values()));
    } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ fetchData(); },[fetchData]);

  // Load employees, supervisors, departments when assign modal opens
  useEffect(() => {
    if (!showAssign) return;
    setAssignScope('employee');
    setSelectedUser(null); setSelectedSupervisor(null); setSelectedDept(null); setAssignResult(null);
    // Fetch all users regardless of role
    api.get('/users').then(r => {
      const all = Array.isArray(r.data) ? r.data : [];
      setUsers(all.filter((u:any) => u.role === 'employee'));
      setSupervisors(all.filter((u:any) => u.role === 'supervisor'));
      const depts = [...new Set(all.filter((u:any) => u.department).map((u:any) => u.department))] as string[];
      setDepartments(depts);
    }).catch(()=>{});
    // Also try dedicated departments endpoint
    api.get('/users/departments/all').then(r => {
      const data = Array.isArray(r.data) ? r.data : [];
      if (data.length > 0) {
        const names = data.map((d:any) => typeof d === 'string' ? d : d.name).filter(Boolean) as string[];
        setDepartments(names);
      }
    }).catch(()=>{});
  }, [showAssign]);

  const loadItems = async (cl:CL) => {
    if (expandedId === cl.id) { setExpandedId(null); return; }
    setExpandedId(cl.id);
    if (!itemsMap[cl.id]) {
      const { data } = await api.get(`/checklists/${cl.checklistId}/items`).catch(()=>({data:[]}));
      const items = Array.isArray(data) ? data : [];
      setItemsMap(p=>({...p,[cl.id]:items}));
      setEditItems(items);
    } else { setEditItems(itemsMap[cl.id]); }
  };

  const saveItems = async (cl:CL) => {
    setSavingItems(true);
    try {
      const existing = itemsMap[cl.id] || [];
      for (const item of editItems) {
        if (item.id) { await api.put(`/checklists/items/${item.id}?checklistId=${cl.checklistId}`,item).catch(()=>{}); }
        else { await api.post(`/checklists/${cl.checklistId}/items`,item).catch(()=>{}); }
      }
      const removed = existing.filter(e=>!editItems.find(i=>i.id===e.id));
      for (const r of removed) { if(r.id) await api.delete(`/checklists/items/${r.id}`).catch(()=>{}); }
      const { data } = await api.get(`/checklists/${cl.checklistId}/items`).catch(()=>({data:[]}));
      setItemsMap(p=>({...p,[cl.id]:data}));
      setEditItems(data);
    } finally { setSavingItems(false); }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      await api.post('/checklists/full',{title:form.title,description:form.description,frequency:form.frequency,items:form.items.filter(i=>i.title.trim())});
      setShowCreate(false);
      setForm({title:'',description:'',frequency:'none',items:[{title:'',isRequired:true}]});
      fetchData();
    } finally { setCreating(false); }
  };

  const handleDelete = async (cl:CL) => {
    if (!window.confirm('Delete this checklist and all its assignments?')) return;
    setDeleting(cl.id);
    try { await api.delete(`/checklist-assignments/template/${cl.checklistId}`); fetchData(); }
    catch (e:any) { alert(e?.response?.data?.message||'Delete failed'); }
    finally { setDeleting(null); }
  };

  const handleAssign = async () => {
    if (!showAssign) return;
    setAssigning(true); setAssignResult(null);
    try {
      const payload: any = { checklistId: showAssign.checklistId, scope: assignScope };
      if (assignScope === 'employee') payload.userId = selectedUser?.value;
      if (assignScope === 'team' && role !== 'supervisor') payload.supervisorId = selectedSupervisor?.value;
      if (assignScope === 'department' && role === 'hr') payload.department = selectedDept?.value;
      const { data } = await api.post('/checklists/smart-assign', payload);
      setAssignResult(`✓ ${data.message}`);
      setTimeout(()=>{ setShowAssign(null); fetchData(); }, 1500);
    } catch(e:any){ setAssignResult(`✗ ${e?.response?.data?.message||'Assign failed'}`); }
    finally { setAssigning(false); }
  };

  const filtered = checklists.filter(c=>(c.title||'').toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checklist Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Create, manage and track all organisation checklists</p>
          </div>
          <button onClick={()=>setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm">
            <Plus size={16}/> New Checklist
          </button>
        </div>

        {/* Analytics */}
        {analytics && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {label:'Active Checklists',value:analytics.totalChecklists,color:'text-blue-600',bg:'bg-blue-50',icon:<ListChecks size={18} className="text-blue-600"/>},
                {label:'Completion Rate',value:`${analytics.completionRate}%`,color:'text-emerald-600',bg:'bg-emerald-50',icon:<CheckCircle2 size={18} className="text-emerald-600"/>},
                {label:'Assignments',value:analytics.totalAssignments,color:'text-violet-600',bg:'bg-violet-50',icon:<Users size={18} className="text-violet-600"/>},
                {label:'Overdue',value:analytics.overdue,color:'text-red-500',bg:'bg-red-50',icon:<XCircle size={18} className="text-red-500"/>},
              ].map(s=>(
                <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.bg}`}>{s.icon}</div>
                  </div>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><BarChart2 size={15}/> By Schedule</h3>
                <div className="space-y-3">
                  {['daily','weekly','monthly','none'].map(freq=>{
                    const row = analytics.byFrequency?.find(r=>r.frequency===freq);
                    const count = row?Number(row.count):0;
                    const max = Math.max(...(analytics.byFrequency||[]).map(r=>Number(r.count)),1);
                    return (
                      <div key={freq} className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-20 text-center flex-shrink-0 ${FREQ_COLOR[freq]}`}>{FREQ_LABEL[freq]}</span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width:`${(count/max)*100}%`}}/>
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200 w-5 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Users size={15}/> By Department</h3>
                {!analytics.byDepartment?.length
                  ? <p className="text-sm text-gray-400 py-4 text-center">No department data yet</p>
                  : <div className="space-y-3">{analytics.byDepartment.map(dept=>{
                      const rate = dept.total>0?Math.round((Number(dept.completed)/Number(dept.total))*100):0;
                      return (
                        <div key={dept.department} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-24 truncate flex-shrink-0">{dept.department}</span>
                          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                            <div className={`h-2 rounded-full ${rate===100?'bg-emerald-500':'bg-blue-500'}`} style={{width:`${rate}%`}}/>
                          </div>
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-8 text-right">{rate}%</span>
                        </div>
                      );
                    })}</div>
                }
              </div>
            </div>
          </>
        )}

        {/* Management table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex-1 relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search checklists..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"><RefreshCw size={15}/></button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"/></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><ListChecks size={32} className="mx-auto mb-2 opacity-30"/><p>No checklists yet</p></div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {filtered.map(cl=>{
                const isExp = expandedId === cl.id;
                return (
                  <div key={cl.id}>
                    <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-750">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{cl.title||'(Untitled)'}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${FREQ_COLOR[cl.frequency||'none']}`}>{FREQ_LABEL[cl.frequency||'none']}</span>
                        </div>
                        {cl.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{cl.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={()=>setShowAssign(cl)} title="Assign to user" className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"><UserPlus size={15}/></button>
                        <button onClick={()=>loadItems(cl)} title="Edit items" className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          {isExp?<ChevronUp size={15}/>:<ChevronDown size={15}/>}
                        </button>
                        <button onClick={()=>handleDelete(cl)} disabled={deleting===cl.id} title="Delete" className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"><Trash2 size={15}/></button>
                      </div>
                    </div>
                    {isExp && (
                      <div className="px-5 pb-4 bg-gray-50/50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-3 mb-2 uppercase tracking-wide">Tasks</p>
                        <div className="space-y-2 mb-3">
                          {editItems.length===0 && <p className="text-xs text-gray-400 italic">No tasks yet — add some below</p>}
                          {editItems.map((item,idx)=>(
                            <div key={idx} className="flex items-center gap-2">
                              <input value={item.title} onChange={e=>setEditItems(prev=>prev.map((it,i)=>i===idx?{...it,title:e.target.value}:it))}
                                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-1.5 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Task title"/>
                              <label className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                                <input type="checkbox" checked={item.isRequired} onChange={e=>setEditItems(prev=>prev.map((it,i)=>i===idx?{...it,isRequired:e.target.checked}:it))}/> Req
                              </label>
                              <button onClick={()=>setEditItems(prev=>prev.filter((_,i)=>i!==idx))} className="text-red-400 hover:text-red-600 p-1"><X size={13}/></button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={()=>setEditItems(p=>[...p,{title:'',isRequired:true,orderIndex:p.length}])} className="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Add task</button>
                          <button onClick={()=>saveItems(cl)} disabled={savingItems} className="ml-auto px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-40">
                            {savingItems?'Saving...':'Save Tasks'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Checklist</h2>
                <button onClick={()=>setShowCreate(false)}><X size={20} className="text-gray-400"/></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Monthly Safety Review"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Schedule</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[{v:'none',l:'Permanent'},{v:'daily',l:'Daily'},{v:'weekly',l:'Weekly'},{v:'monthly',l:'Monthly'}].map(o=>(
                      <button key={o.v} onClick={()=>setForm(f=>({...f,frequency:o.v}))}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${form.frequency===o.v?'bg-blue-600 text-white border-blue-600':'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tasks</label>
                  <div className="space-y-2">
                    {form.items.map((item,idx)=>(
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-xs text-gray-400 w-4">{idx+1}</span>
                        <input value={item.title} onChange={e=>setForm(f=>({...f,items:f.items.map((it,i)=>i===idx?{...it,title:e.target.value}:it)}))}
                          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={`Task ${idx+1}`}/>
                        {form.items.length>1 && <button onClick={()=>setForm(f=>({...f,items:f.items.filter((_,i)=>i!==idx)}))} className="text-red-400 p-1"><X size={13}/></button>}
                      </div>
                    ))}
                    <button onClick={()=>setForm(f=>({...f,items:[...f.items,{title:'',isRequired:true}]}))} className="text-sm text-blue-600 font-medium pl-6">+ Add task</button>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={()=>setShowCreate(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300">Cancel</button>
                  <button onClick={handleCreate} disabled={creating||!form.title.trim()} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
                    {creating?'Creating...':'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssign && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Assign Checklist</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{showAssign.title}</p>
                </div>
                <button onClick={()=>setShowAssign(null)}><X size={20} className="text-gray-400"/></button>
              </div>

              {/* Scope tabs */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-4">
                {availableScopes.map(s=>(
                  <button key={s.v} onClick={()=>{ setAssignScope(s.v as any); setSelectedUser(null); setSelectedSupervisor(null); setSelectedDept(null); setAssignResult(null); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${assignScope===s.v?'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white':'text-gray-500 dark:text-gray-400'}`}>
                    {s.l}
                  </button>
                ))}
              </div>

              {/* Scope-specific picker */}
              <div className="mb-4">
                {assignScope === 'employee' && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Employee</label>
                    <Select options={users.filter((u:any)=>u.role==='employee').map((u:any)=>({value:u.id,label:`${u.name} (${u.department||'—'})`}))}
                      value={selectedUser} onChange={setSelectedUser} placeholder="Search employee..." isClearable isSearchable/>
                  </>
                )}
                {assignScope === 'team' && role !== 'supervisor' && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Supervisor / Team</label>
                    <Select options={supervisors.map((s:any)=>({value:s.id,label:`${s.name} (${s.department||'—'})`}))}
                      value={selectedSupervisor} onChange={setSelectedSupervisor} placeholder="Pick a supervisor..." isClearable isSearchable/>
                    <p className="text-xs text-gray-400 mt-1">All employees under this supervisor will be assigned</p>
                  </>
                )}
                {assignScope === 'team' && role === 'supervisor' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300">
                    This will assign the checklist to <strong>all members of your team</strong>.
                  </div>
                )}
                {assignScope === 'department' && role === 'manager' && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-sm text-emerald-700 dark:text-emerald-300">
                    This will assign to <strong>all employees in your department</strong>.
                  </div>
                )}
                {assignScope === 'department' && role === 'hr' && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Department</label>
                    <Select options={departments.map((d:string)=>({value:d,label:d}))}
                      value={selectedDept} onChange={setSelectedDept} placeholder="Pick a department..." isClearable isSearchable/>
                    <p className="text-xs text-gray-400 mt-1">All employees in this department will be assigned</p>
                  </>
                )}
              </div>

              {assignResult && (
                <div className={`text-sm font-medium mb-3 px-3 py-2 rounded-xl ${assignResult.startsWith('✓')?'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300':'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                  {assignResult}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={()=>setShowAssign(null)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300">Cancel</button>
                <button onClick={handleAssign} disabled={assigning ||(assignScope==='employee'&&!selectedUser)||(assignScope==='team'&&role!=='supervisor'&&!selectedSupervisor)||(assignScope==='department'&&role==='hr'&&!selectedDept)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
                  {assigning?'Assigning...':'Assign'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default HRChecklistDashboard;