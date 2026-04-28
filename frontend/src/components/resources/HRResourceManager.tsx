import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, Eye, Edit2, Globe, BarChart2, FileText, X, Search, Shield, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import resourceService from '../../services/resourceService';
import PDFViewer from './PDFViewer';
import toast from 'react-hot-toast';

const CATS = ['handbook','policy','process','legal','training','other'];
const CAT_COLORS: Record<string,string> = { handbook:'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-800/50',policy:'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800/50',process:'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800/50',legal:'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800/50',training:'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800/50',other:'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800/50 dark:border-slate-700/50' };

const HRResourceManager: React.FC = () => {
  const [tab, setTab] = useState<'all'|'upload'|'analytics'>('all');
  const [resources, setResources] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerDoc, setViewerDoc] = useState<any|null>(null);
  const [editDoc, setEditDoc] = useState<any|null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterScope, setFilterScope] = useState('all');
  // Upload form
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('other');
  const [scope, setScope] = useState('global');
  const [isPublic, setIsPublic] = useState(false);
  const [stage, setStage] = useState('all');
  const [file, setFile] = useState<File|null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Edit form
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCat, setEditCat] = useState('');
  const [editPublic, setEditPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [res, ana] = await Promise.all([resourceService.getAllResources(), resourceService.getResourceAnalytics()]);
      setResources(res);
      setAnalytics(ana);
    } catch { toast.error('Failed to load resources.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleUpload = async () => {
    if (!title.trim() || !file) { toast.error('Title and PDF required.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('title', title); fd.append('description', desc);
      fd.append('category', category); fd.append('scope', scope);
      fd.append('isPublic', String(isPublic)); fd.append('stage', stage);
      await resourceService.uploadPDF(fd);
      toast.success('Document uploaded!');
      setTitle(''); setDesc(''); setCategory('other'); setScope('global'); setIsPublic(false); setFile(null);
      loadAll(); setTab('all');
    } catch { toast.error('Upload failed.'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;
    try { await resourceService.deleteResource(id); toast.success('Deleted.'); loadAll(); }
    catch { toast.error('Delete failed.'); }
  };

  const openEdit = (r: any) => { setEditDoc(r); setEditTitle(r.title); setEditDesc(r.description||''); setEditCat(r.category||'other'); setEditPublic(!!r.isPublic); };

  const handleSave = async () => {
    if (!editDoc) return;
    setSaving(true);
    try {
      await resourceService.updateResource(editDoc.id, { title:editTitle, description:editDesc, category:editCat, isPublic:editPublic });
      toast.success('Updated!'); setEditDoc(null); loadAll();
    } catch { toast.error('Update failed.'); }
    finally { setSaving(false); }
  };

  const togglePublic = async (r: any) => {
    try {
      await resourceService.updateResource(r.id, { isPublic: !r.isPublic });
      toast.success(r.isPublic ? 'Unpublished.' : 'Published to all!');
      loadAll();
    } catch { toast.error('Failed.'); }
  };

  const filtered = resources.filter(r => {
    const ms = r.title?.toLowerCase().includes(search.toLowerCase());
    const mc = filterCat === 'all' || r.category === filterCat;
    const msc = filterScope === 'all' || r.scope === filterScope;
    return ms && mc && msc;
  });

  const chartData = analytics.map(a => ({ name: a.resource?.title?.slice(0,18)+'…' || '?', Views: a.viewCount||0, Acknowledged: a.acknowledgeCount||0 })).slice(0,10);

  const tabBtn = (key: typeof tab, label: string, icon: React.ReactNode) => (
    <button onClick={()=>setTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
      tab === key 
        ? 'bg-pmi-800 text-white shadow-md shadow-pmi-800/20' 
        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800'
    }`}>
      {icon} {label}
    </button>
  );

  const inputClass = "w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pmi-500/50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-pmi-500/50";

  return (
    <div className="w-full">
      {/* Header */}
      <div className="glass-panel p-6 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pmi-800/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pmi-800 to-indigo-600 flex items-center justify-center shadow-lg shadow-pmi-800/20 shrink-0">
          <Shield size={26} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">HR Document Hub</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Global authority over all company documents — upload, publish, and monitor.</p>
        </div>
        <div className="md:ml-auto flex gap-6 mt-4 md:mt-0 bg-white/60 dark:bg-slate-800/40 px-6 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          {[{label:'Total',val:resources.length,c:'text-pmi-800 dark:text-pmi-400'},{label:'Public',val:resources.filter(r=>r.isPublic).length,c:'text-emerald-600 dark:text-emerald-400'},{label:'Private',val:resources.filter(r=>!r.isPublic).length,c:'text-amber-600 dark:text-amber-400'}].map(s=>(
            <div key={s.label} className="text-center">
              <div className={`text-2xl font-bold ${s.c}`}>{s.val}</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabBtn('all','All Documents',<FileText size={16}/>)}
        {tabBtn('upload','Upload Document',<Upload size={16}/>)}
        {tabBtn('analytics','Analytics',<BarChart2 size={16}/>)}
      </div>

      {/* ─── ALL DOCUMENTS ─── */}
      {tab === 'all' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents..." className={`${inputClass} pl-9`} />
            </div>
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className={`${inputClass} w-full md:w-48 cursor-pointer`}>
              <option value="all">All Categories</option>
              {CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
            <select value={filterScope} onChange={e=>setFilterScope(e.target.value)} className={`${inputClass} w-full md:w-40 cursor-pointer`}>
              <option value="all">All Scopes</option>
              <option value="global">Global</option>
              <option value="department">Department</option>
              <option value="team">Team</option>
            </select>
          </div>

          {loading ? <div className="text-center py-12 text-slate-500">Loading documents...</div> :
          filtered.length === 0 ? (
            <div className="text-center py-16 glass-panel">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No documents found</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(r => (
                <div key={r.id} className="glass-card p-5 flex flex-col group relative">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wide uppercase ${CAT_COLORS[r.category]||CAT_COLORS['other']}`}>
                      {r.category||'other'}
                    </span>
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 capitalize">
                        {r.scope}
                      </span>
                      <button
                        onClick={()=>togglePublic(r)}
                        title={r.isPublic?'Unpublish':'Publish to all'}
                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                          r.isPublic 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' 
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50'
                        }`}>
                        {r.isPublic?<><CheckCircle size={10}/> Published</>:<><Globe size={10}/> Publish</>}
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 leading-tight">{r.title}</h3>
                  {r.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">{r.description}</p>}
                  
                  <div className="flex gap-2 mt-auto pt-2">
                    <button onClick={()=>setViewerDoc(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-pmi-800 hover:bg-pmi-700 text-white text-xs font-semibold transition-colors">
                      <Eye size={14}/> View
                    </button>
                    <button onClick={()=>openEdit(r)} className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50 transition-colors">
                      <Edit2 size={14}/>
                    </button>
                    <button onClick={()=>handleDelete(r.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── UPLOAD ─── */}
      {tab === 'upload' && (
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="glass-panel p-6 md:p-8 flex flex-col gap-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3">Upload New Document</h3>
            
            {/* Drag & drop zone */}
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f?.type==='application/pdf')setFile(f);else toast.error('PDF only.');}}
              onClick={()=>document.getElementById('hr-pdf')?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragOver ? 'border-pmi-500 bg-pmi-50/50 dark:bg-pmi-900/20' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:bg-slate-800/50'
              }`}>
              <input id="hr-pdf" type="file" accept=".pdf,application/pdf" className="hidden" onChange={e=>setFile(e.target.files?.[0]||null)}/>
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center"><FileText size={20} className="text-indigo-600 dark:text-indigo-400"/></div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{file.name}</span>
                  <button onClick={e=>{e.stopPropagation();setFile(null);}} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"><X size={16}/></button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3"><Upload size={24} className="text-slate-400" /></div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Drag & drop or <span className="text-pmi-600 font-semibold dark:text-pmi-400">browse files</span></p>
                  <p className="text-xs text-slate-400 mt-1">PDF documents only, max 50MB</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Title *</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., Employee Handbook 2026" className={inputClass} />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Brief description of the document contents..." rows={3} className={`${inputClass} resize-y`} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Category</label>
                  <select value={category} onChange={e=>setCategory(e.target.value)} className={`${inputClass} cursor-pointer`}>
                    {CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Stage</label>
                  <select value={stage} onChange={e=>setStage(e.target.value)} className={`${inputClass} cursor-pointer`}>
                    {['all','prepare','orient','land','integrate','excel'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Scope</label>
                  <select value={scope} onChange={e=>setScope(e.target.value)} className={`${inputClass} cursor-pointer`}>
                    <option value="global">Global (All Departments)</option>
                    <option value="department">Department Level</option>
                    <option value="team">Team Level</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Visibility</label>
                  <label className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer h-[38px] transition-colors ${
                    isPublic ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'
                  }`}>
                    <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Publish immediately</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={handleUpload} 
                disabled={uploading||!file||!title.trim()} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-pmi-800 hover:bg-pmi-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-pmi-800/20"
              >
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Uploading...</>
                ) : (
                  <><Upload size={18}/> Upload Document</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ANALYTICS ─── */}
      {tab === 'analytics' && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {label:'Total Documents',val:resources.length,c:'text-indigo-600 dark:text-indigo-400'},
              {label:'Published',val:resources.filter(r=>r.isPublic).length,c:'text-emerald-600 dark:text-emerald-400'},
              {label:'Total Views',val:analytics.reduce((s,a)=>s+(a.viewCount||0),0),c:'text-blue-600 dark:text-blue-400'},
              {label:'Acknowledged',val:analytics.reduce((s,a)=>s+(a.acknowledgeCount||0),0),c:'text-amber-600 dark:text-amber-400'},
            ].map(s=>(
              <div key={s.label} className="glass-panel p-5 text-center flex flex-col items-center justify-center">
                <div className={`text-3xl font-display font-bold ${s.c}`}>{s.val}</div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="glass-panel p-6">
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <BarChart2 size={18} className="text-pmi-600"/> Document Engagement Top 10
              </h3>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{top:10,right:20,left:0,bottom:40}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)"/>
                    <XAxis dataKey="name" tick={{fill:'#64748b',fontSize:12}} angle={-30} textAnchor="end" interval={0} tickMargin={10} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#64748b',fontSize:12}} allowDecimals={false} axisLine={false} tickLine={false}/>
                    <Tooltip 
                      contentStyle={{backgroundColor:'rgba(255,255,255,0.9)',borderRadius:'8px',border:'none',boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'}}
                      itemStyle={{color:'#1e293b', fontWeight:600}}
                    />
                    <Bar dataKey="Views" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={40}/>
                    <Bar dataKey="Acknowledged" fill="#10b981" radius={[4,4,0,0]} maxBarSize={40}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Detailed Statistics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700/50">
                    {['Document','Category','Views','Acknowledged'].map(h=>(
                      <th key={h} className="py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {analytics.map((a,i)=>{
                    const ccClass = CAT_COLORS[a.resource?.category] || CAT_COLORS['other'];
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{a.resource?.title||'—'}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${ccClass}`}>
                            {(a.resource?.category||'other')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-indigo-600 dark:text-indigo-400 font-bold">{a.viewCount||0}</td>
                        <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">{a.acknowledgeCount||0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editDoc && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white">Edit Document</h3>
              <button onClick={()=>setEditDoc(null)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Title</label>
                <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} className={inputClass}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Description</label>
                <textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} rows={3} className={`${inputClass} resize-y`}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Category</label>
                <select value={editCat} onChange={e=>setEditCat(e.target.value)} className={`${inputClass} cursor-pointer`}>
                  {CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 mt-2 cursor-pointer">
                <input type="checkbox" checked={editPublic} onChange={e=>setEditPublic(e.target.checked)} className="w-4 h-4 text-pmi-600 rounded border-slate-300 focus:ring-pmi-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Published (visible to all employees)</span>
              </label>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button onClick={()=>setEditDoc(null)} className="flex-1 px-4 py-2 rounded-lg font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-pmi-800 hover:bg-pmi-700 disabled:opacity-50 transition-colors shadow-md shadow-pmi-800/20">
                {saving?'Saving...':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PDFViewer open={!!viewerDoc} url={viewerDoc?.url||''} title={viewerDoc?.title||''} onClose={()=>setViewerDoc(null)}/>
    </div>
  );
};

export default HRResourceManager;