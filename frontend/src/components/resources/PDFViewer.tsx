import React, { useEffect, useRef } from 'react';
import { X, BookOpen } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  title: string;
  open: boolean;
  onClose: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, title, open, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(10, 14, 33, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '24px 16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Header bar */}
      <div style={{
        width: '100%',
        maxWidth: 960,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={18} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Viewing Document</p>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>{title}</h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, padding: '4px 10px',
            borderRadius: 20,
            background: 'rgba(239,68,68,0.15)',
            color: '#fca5a5',
            border: '1px solid rgba(239,68,68,0.3)',
            letterSpacing: '0.06em',
          }}>
            READ ONLY · NO DOWNLOAD
          </span>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* PDF iframe */}
      <div style={{
        width: '100%',
        maxWidth: 960,
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
        background: '#1a1b2e',
        minHeight: 0,
        height: 'calc(100vh - 140px)',
      }}>
        <iframe
          src={`${fullUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
          title={title}
          width="100%"
          height="100%"
          style={{ border: 'none', display: 'block' }}
          // Security: prevent download via context menu
          onContextMenu={(e) => e.preventDefault()}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default PDFViewer;
