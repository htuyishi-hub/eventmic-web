import React from 'react';
import { Info, AlertTriangle, X } from 'lucide-react';

export function Banner({ type = 'info', message, onDismiss, className = '' }) {
  if (!message) return null;
  const isWarning = type === 'warning' || type === 'urgent';
  const Icon = isWarning ? AlertTriangle : Info;

  return (
    <div
      className={`px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold gap-3 shadow-md animate-in slide-in-from-top duration-200 ${
        isWarning
          ? 'bg-rose-500/15 border-rose-500/30 text-rose-200'
          : 'bg-accent/15 border-accent/30 text-accent-light text-white'
      } ${className}`}
      role={isWarning ? 'alert' : 'status'}
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon size={16} className={isWarning ? 'text-rose-400 flex-shrink-0' : 'text-accent flex-shrink-0'} aria-hidden="true" />
        <span className="truncate">{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-md hover:bg-black/20 text-current transition-colors focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Dismiss banner"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
