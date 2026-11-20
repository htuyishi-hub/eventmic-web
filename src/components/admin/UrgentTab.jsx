import React from 'react';
import { AlertTriangle, Zap, X } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { ReasonBadge } from '../common/ReasonBadge.jsx';
import { Button } from '../ui/Button.jsx';
import { formatWait } from '../../lib/time.js';
import { Avatar } from '../common/Avatar.jsx';
import { useResolvedAvatarSrc } from '../../lib/useAvatar.js';

function UrgentItem({ req, onGrant, onDismiss }) {
  const avatarSrc = useResolvedAvatarSrc(req);

  return (
    <div className="p-3.5 rounded-xl bg-background border border-rose-500/40 shadow-sm flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar src={avatarSrc} name={req.name} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white truncate max-w-[140px]">{req.name}</span>
            <ReasonBadge reason={req.reason || 'urgent'} />
          </div>
          <div className="text-xs text-muted font-mono mt-0.5">
            Requested: {formatWait(req.requestedAt)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="live"
          size="sm"
          onClick={() => onGrant(req.id)}
          className="gap-1 text-xs py-1 px-3 shadow-md shadow-rose-500/20"
          title="Grant 5-second urgent blip"
        >
          <Zap size={13} />
          <span>Grant (5s)</span>
        </Button>

        <button
          type="button"
          onClick={() => onDismiss(req.id)}
          className="min-w-[44px] min-h-[44px] grid place-items-center rounded-lg text-muted hover:text-white hover:bg-surface transition-colors"
          title="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

export function UrgentTab({ onGrantUrgent, onDismissUrgent }) {
  const { urgent = [], grantUrgent, dismissUrgent } = useSession();

  const handleGrant = (id) => {
    if (onGrantUrgent) onGrantUrgent(id);
    else grantUrgent?.(id);
  };

  const handleDismiss = (id) => {
    if (onDismissUrgent) onDismissUrgent(id);
    else dismissUrgent?.(id);
  };

  if (!urgent || urgent.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted">
        <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-muted mb-2">
          <Zap size={22} className="opacity-40" />
        </div>
        <p className="text-xs font-bold text-white">No urgent interruptions</p>
        <p className="text-xs text-muted max-w-xs mt-1">
          When an attendee sends an urgent question or sound issue, it prioritizes here with a 5-second turn cap.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-2 overflow-y-auto pr-1">
      <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
        <AlertTriangle size={15} className="flex-shrink-0 animate-bounce" />
        <span>Urgent requests temporarily duck stage audio for a 5s blip.</span>
      </div>

      <div className="space-y-2">
        {urgent.map((req) => (
          <UrgentItem
            key={req.id}
            req={req}
            onGrant={handleGrant}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}
