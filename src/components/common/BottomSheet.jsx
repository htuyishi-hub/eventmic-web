import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function BottomSheet({ isOpen, onClose, title, children, className = '' }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal dialog'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className={`w-full max-w-lg mx-auto bg-surface border-t border-x border-border rounded-t-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200 ${className}`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="w-10 h-1 bg-border rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2.5" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white pt-1">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-white hover:bg-background transition-colors focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="pt-1">{children}</div>
      </div>
    </div>
  );
}
