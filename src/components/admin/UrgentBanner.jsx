import React from 'react';
import { AlertTriangle, Zap, X } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { Button } from '../ui/Button.jsx';

/**
 * Pinned above the console whenever an urgent request exists, so the admin
 * never has to open the Urgent tab to notice or act on it.
 */
export function UrgentBanner() {
  const { urgent = [], grantUrgent, dismissUrgent } = useSession();
  const req = urgent[0];
  if (!req) return null;
  const extra = urgent.length - 1;

  return (
    <div
      role="alert"
      className="mx-4 sm:mx-5 mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-600 bg-amber-950/60 px-4 py-2.5 text-amber-100 flex-shrink-0"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertTriangle size={20} className="text-amber-400 flex-shrink-0" />
        <span className="font-bold text-sm truncate">
          Urgent: {req.name}{req.reason ? ` — ${String(req.reason).replace(/_/g, ' ')}` : ''}
        </span>
        {extra > 0 && <span className="text-xs text-amber-300 flex-shrink-0">+{extra} more</span>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="warning" size="sm" className="gap-1" onClick={() => grantUrgent?.(req.id)}>
          <Zap size={14} /> Grant 5s
        </Button>
        <button
          type="button"
          onClick={() => dismissUrgent?.(req.id)}
          aria-label={`Dismiss urgent request from ${req.name}`}
          className="min-w-[44px] min-h-[44px] grid place-items-center rounded-lg hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
