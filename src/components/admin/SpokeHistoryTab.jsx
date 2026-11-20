import React, { useEffect, useState } from 'react';
import { History, Clock } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { ReasonBadge } from '../common/ReasonBadge.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { useResolvedAvatarSrc } from '../../lib/useAvatar.js';

function SpokeRow({ item }) {
  const avatarSrc = useResolvedAvatarSrc(item);

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/80">
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar src={avatarSrc} name={item.name} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white truncate max-w-[140px]">{item.name}</span>
            <ReasonBadge reason={item.reason || 'question'} size="xs" />
          </div>
          <div className="text-[11px] text-muted font-mono mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1 text-accent">
              <Clock size={11} />
              {item.durationSeconds || Math.round((item.endedAt - item.startedAt) / 1000)}s speaking
            </span>
            <span>•</span>
            <span>{new Date(item.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SpokeHistoryTab() {
  const { spoken = [], fetchSessionState } = useSession();
  const [history, setHistory] = useState(spoken);

  useEffect(() => {
    if (spoken && spoken.length > 0) {
      setHistory(spoken);
      return;
    }
    let mounted = true;
    fetchSessionState().then(st => {
      if (mounted && st?.spokeHistory) setHistory(st.spokeHistory);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [spoken, fetchSessionState]);

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted text-center p-4">
        <History size={32} className="mb-2 opacity-40" />
        <p className="text-sm font-semibold text-white">No speak history yet</p>
        <p className="text-xs text-muted mt-1">Speakers who finish their turn will be recorded here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
      {history.map((item, idx) => (
        <SpokeRow
          key={`${item.id}-${item.startedAt}-${idx}`}
          item={item}
        />
      ))}
    </div>
  );
}
