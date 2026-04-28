import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, FileText, Scale, Cog, GraduationCap, FolderOpen, Eye, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import resourceService from '../../services/resourceService';
import PDFViewer from './PDFViewer';

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: string;
  url: string;
  category: string;
  stage?: string;
  programType?: string;
  createdAt: string;
}

interface Assignment {
  id: string;
  resource: Resource;
  status: string;
}

// ── Category config ─────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  handbook:  { label: 'Handbook',  className: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-800/50',  icon: <BookOpen size={14} /> },
  policy:    { label: 'Policy',    className: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800/50',  icon: <FileText size={14} /> },
  process:   { label: 'Process',   className: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800/50',  icon: <Cog size={14} /> },
  legal:     { label: 'Legal',     className: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800/50',   icon: <Scale size={14} /> },
  training:  { label: 'Training',  className: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800/50', icon: <GraduationCap size={14} /> },
  other:     { label: 'Other',     className: 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800/50 dark:border-slate-700/50', icon: <FolderOpen size={14} /> },
};

const getCatConf = (cat: string) => CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;

// ── Doc Card ────────────────────────────────────────────────────────────────
const DocCard: React.FC<{
  resource: Resource;
  acknowledged: boolean;
  onView: (r: Resource) => void;
  onAck: (id: string) => void;
  ackLoading: boolean;
}> = ({ resource, acknowledged, onView, onAck, ackLoading }) => {
  const cat = getCatConf(resource.category);

  return (
    <div className="glass-card p-5 flex flex-col group relative overflow-hidden">
      {/* Category badge + acknowledged */}
      <div className="flex justify-between items-center mb-3">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wide uppercase ${cat.className}`}>
          {cat.icon} {cat.label}
        </span>
        {acknowledged && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 uppercase tracking-wide">
            <CheckCircle size={12} /> Read
          </span>
        )}
      </div>

      {/* Title + description */}
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 leading-tight">
          {resource.title}
        </h3>
        {resource.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {resource.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onView(resource)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-pmi-800 hover:bg-pmi-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-pmi-800/20"
        >
          <Eye size={14} /> View Document
        </button>
        {!acknowledged && (
          <button
            onClick={() => onAck(resource.id)}
            disabled={ackLoading}
            className={`p-2 rounded-lg transition-colors border flex items-center justify-center ${
              ackLoading ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 dark:hover:bg-emerald-900/50'
            }`}
            title="Mark as read"
          >
            {ackLoading ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"/> : <CheckCircle size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────
const EmployeeResources: React.FC = () => {
  const [publicDocs, setPublicDocs] = useState<Resource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<Resource | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [ackLoading, setAckLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pub, assigned] = await Promise.all([
        resourceService.getPublicResources(),
        resourceService.getAssignedResources(),
      ]);
      setPublicDocs(pub);
      setAssignments(assigned);

      // Check acknowledgement status
      const allIds = [
        ...pub.map((r: Resource) => r.id),
        ...assigned.map((a: Assignment) => a.resource?.id).filter(Boolean),
      ];
      const uniqueIds = [...new Set(allIds)];
      const statuses = await Promise.all(
        uniqueIds.map((id) => resourceService.getAcknowledgeStatus(id))
      );
      const acked = new Set<string>();
      uniqueIds.forEach((id, i) => { if (statuses[i]?.acknowledged) acked.add(id); });
      setAcknowledged(acked);
    } catch {
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAck = async (id: string) => {
    setAckLoading(id);
    try {
      await resourceService.acknowledgeResource(id);
      setAcknowledged((prev) => new Set([...prev, id]));
    } finally {
      setAckLoading(null);
    }
  };

  const allResources = [
    ...publicDocs,
    ...assignments.map((a) => a.resource).filter(Boolean),
  ].filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i);

  const filtered = allResources.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || r.category === filterCat;
    return matchSearch && matchCat;
  });

  const inputClass = "w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pmi-500/50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-pmi-500/50";

  return (
    <div className="w-full">
      {/* Header */}
      <div className="glass-panel p-6 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pmi-800/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pmi-800 to-indigo-600 flex items-center justify-center shadow-lg shadow-pmi-800/20 shrink-0">
          <BookOpen size={26} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">Your Document Library</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Read-only access to company documents, handbooks, and policies.</p>
        </div>
        <div className="md:ml-auto mt-4 md:mt-0 text-center bg-white/60 dark:bg-slate-800/40 px-6 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          <div className="text-2xl font-bold text-pmi-800 dark:text-pmi-400">{allResources.length}</div>
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Documents</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Docs', value: allResources.length, c: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Read', value: acknowledged.size, c: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Pending', value: allResources.length - acknowledged.size, c: 'text-amber-600 dark:text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="glass-panel p-4 text-center flex flex-col items-center justify-center">
            <div className={`text-2xl font-display font-bold ${s.c}`}>{s.value}</div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className={`${inputClass} pl-10`} />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className={`${inputClass} pl-10 w-full sm:w-56 cursor-pointer`}>
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl mb-6 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Document grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading your documents...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 glass-panel border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No documents found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {search || filterCat !== 'all' ? 'Try adjusting your filters.' : 'No documents have been published to you yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((resource) => (
            <DocCard
              key={resource.id}
              resource={resource}
              acknowledged={acknowledged.has(resource.id)}
              onView={setViewerDoc}
              onAck={handleAck}
              ackLoading={ackLoading === resource.id}
            />
          ))}
        </div>
      )}

      {/* PDF Viewer */}
      <PDFViewer open={!!viewerDoc} url={viewerDoc?.url || ''} title={viewerDoc?.title || ''} onClose={() => setViewerDoc(null)} />
    </div>
  );
};

export default EmployeeResources;
