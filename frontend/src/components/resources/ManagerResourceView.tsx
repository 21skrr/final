import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, Eye, Building2, FileText, X, Search } from 'lucide-react';
import resourceService from '../../services/resourceService';
import PDFViewer from './PDFViewer';
import toast from 'react-hot-toast';

const CATEGORIES = ['handbook','policy','process','legal','training','other'];
const CAT_COLORS: Record<string,string> = { handbook:'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-800/50',policy:'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800/50',process:'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800/50',legal:'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800/50',training:'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800/50',other:'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800/50 dark:border-slate-700/50' };

const ManagerResourceView: React.FC = () => {
  const [tab, setTab] = useState<'library'|'upload'>('library');
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerDoc, setViewerDoc] = useState<any|null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  // Upload form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [isPublic, setIsPublic] = useState(true);
  const [file, setFile] = useState<File|null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await resourceService.getDepartmentResources();
      setResources(data);
    } catch { toast.error('Failed to load documents.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpload = async () => {
    if (!title.trim() || !file) { toast.error('Title and PDF file are required.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title);
      fd.append('description', description);
      fd.append('category', category);
      fd.append('isPublic', String(isPublic));
      fd.append('scope', 'department');
      await resourceService.uploadPDF(fd);
      toast.success('Document uploaded!');
      setTitle(''); setDescription(''); setCategory('other'); setIsPublic(true); setFile(null);
      loadData(); setTab('library');
    } catch { toast.error('Upload failed.'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;
    try { await resourceService.deleteResource(id); toast.success('Deleted.'); loadData(); }
    catch { toast.error('Delete failed.'); }
  };

  const filtered = resources.filter(r => {
    const ms = r.title?.toLowerCase().includes(search.toLowerCase());
    const mc = filterCat === 'all' || r.category === filterCat;
    return ms && mc;
  });

  const byCategory = CATEGORIES.reduce((acc,c) => { acc[c] = resources.filter(r=>r.category===c).length; return acc; }, {} as Record<string,number>);

  const inputClass = "w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pmi-500/50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-pmi-500/50";

  return (
    <div className="w-full">
      {/* Header */}
      <div className="glass-panel p-6 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pmi-800/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pmi-800 to-indigo-600 flex items-center justify-center shadow-lg shadow-pmi-800/20 shrink-0">
          <Building2 size={26} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">Department Document Library</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage documents available to your entire department.</p>
        </div>
        <div className="md:ml-auto mt-4 md:mt-0 text-center bg-white/60 dark:bg-slate-800/40 px-6 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          <div className="text-2xl font-bold text-pmi-800 dark:text-pmi-400">{resources.length}</div>
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Documents</div>
        </div>
      </div>

      {/* Category Stats */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.filter(c=>byCategory[c]>0).map(c=>(
          <div key={c} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${CAT_COLORS[c]}`}>
            <span className="text-lg font-bold leading-none">{byCategory[c]}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{c}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button onClick={()=>setTab('library')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-semibold text-sm transition-colors border-b-2 ${tab === 'library' ? 'text-pmi-800 border-pmi-800 dark:text-pmi-400 dark:border-pmi-400 bg-pmi-50/50 dark:bg-pmi-900/10' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'}`}>
          <FileText size={16}/> Department Library
        </button>
        <button onClick={()=>setTab('upload')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-semibold text-sm transition-colors border-b-2 ${tab === 'upload' ? 'text-pmi-800 border-pmi-800 dark:text-pmi-400 dark:border-pmi-400 bg-pmi-50/50 dark:bg-pmi-900/10' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'}`}>
          <Upload size={16}/> Upload Document
        </button>
      </div>

      {/* ─── Library Tab ─── */}
      {tab === 'library' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents..." className={`${inputClass} pl-9`} />
            </div>
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className={`${inputClass} w-full sm:w-48 cursor-pointer`}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>
          {loading ? <div className="text-center py-12 text-slate-500">Loading documents...</div> :
          filtered.length === 0 ? (
            <div className="text-center py-16 glass-panel border-dashed">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No documents found</h3>
              <p className="text-sm text-slate-500 mt-1">Upload documents to share with your department.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(r=>(
                <div key={r.id} className="glass-card p-5 flex flex-col group">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wide uppercase ${CAT_COLORS[r.category]||CAT_COLORS['other']}`}>
                      {(r.category||'other')}
                    </span>
                    {r.scope && <span className="text-[10px] font-semibold text-slate-400 capitalize">{r.scope}</span>}
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 leading-tight">{r.title}</h3>
                  {r.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">{r.description}</p>}
                  <div className="flex gap-2 mt-auto pt-2">
                    <button onClick={()=>setViewerDoc(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-pmi-800 hover:bg-pmi-700 text-white text-xs font-semibold transition-colors">
                      <Eye size={14}/> View
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

      {/* ─── Upload Tab ─── */}
      {tab === 'upload' && (
        <div className="max-w-2xl animate-in fade-in duration-300">
          <div className="glass-panel p-6 md:p-8 flex flex-col gap-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3">Upload PDF to Department Library</h3>
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f?.type==='application/pdf')setFile(f);else toast.error('Only PDF files.');}}
              onClick={()=>document.getElementById('mgr-pdf')?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragOver ? 'border-pmi-500 bg-pmi-50/50 dark:bg-pmi-900/20' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:bg-slate-800/50'
              }`}>
              <input id="mgr-pdf" type="file" accept=".pdf,application/pdf" className="hidden" onChange={e=>setFile(e.target.files?.[0]||null)} />
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
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Document title" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Brief description..." rows={3} className={`${inputClass} resize-y`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Category</label>
                  <select value={category} onChange={e=>setCategory(e.target.value)} className={`${inputClass} cursor-pointer`}>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Visibility</label>
                  <label className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer h-[38px] transition-colors ${
                    isPublic ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'
                  }`}>
                    <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} className="w-4 h-4 text-pmi-600 rounded border-slate-300 focus:ring-pmi-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Visible to department</span>
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
                {uploading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Uploading...</> : <><Upload size={18}/> Upload Document</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <PDFViewer open={!!viewerDoc} url={viewerDoc?.url||''} title={viewerDoc?.title||''} onClose={()=>setViewerDoc(null)} />
    </div>
  );
};

export default ManagerResourceView;