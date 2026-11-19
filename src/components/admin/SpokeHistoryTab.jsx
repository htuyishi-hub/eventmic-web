import React, { useEffect, useState } from 'react';
import { History, Clock } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { ReasonBadge } from './ReasonBadge.jsx';

export function SpokeHistoryTab() {
  const { fetchSessionState } = useSession();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const state = await fetchSessionState();
        if (mounted && state?.spokeHistory) {
          setHistory(state.spokeHistory);
        }
      } catch {}
      if (mounted) setLoading(false);
    };
    load();
    const interval = setInterval(load, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchSessionState]);

  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted text-xs">
        Loading speak history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted text-center p-4">
        <History size={32} className="mb-2 opacity-40" />
        <p className="text-sm font-semibold">No speak history yet</p>
        <p className="text-xs text-muted mt-1">Speakers who finish their turn will be recorded here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
      {history.map((item, idx) => (
        <div
          key={`${item.id}-${item.startedAt}-${idx}`}
          className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface/70"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white truncate max-w-[130px]">
                {item.name}
              </span>
              <ReasonBadge reason={item.reason || 'question'} />
            </div>
            <div className="text-[11px] text-muted font-mono mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {item.durationSeconds}s duration
              </span>
              <span>•</span>
              <span>{new Date(item.startedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
