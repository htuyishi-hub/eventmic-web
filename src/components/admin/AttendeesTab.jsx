import React, { useEffect, useState } from 'react';
import { Users, Clock } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { formatWait } from '../../lib/time.js';

export function AttendeesTab() {
  const { fetchSessionState } = useSession();
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const state = await fetchSessionState();
        if (mounted && state?.allAttendees) {
          setAttendees(state.allAttendees);
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

  if (loading && attendees.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted text-xs">
        Loading attendees...
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted text-center p-4">
        <Users size={32} className="mb-2 opacity-40" />
        <p className="text-sm font-semibold">No attendees connected</p>
        <p className="text-xs text-muted mt-1">Attendees will appear here once they join.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
      {attendees.map((att) => (
        <div
          key={att.id}
          className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface/70"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white truncate max-w-[140px]">
                {att.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  att.state === 'speaking'
                    ? 'bg-live/20 text-live border border-live/30'
                    : att.state === 'hand_raised'
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'bg-background text-muted border border-border'
                }`}
              >
                {att.state === 'hand_raised' ? 'In Queue' : att.state}
              </span>
            </div>
            <div className="text-[11px] text-muted font-mono mt-1 flex items-center gap-2">
              <span>Spoke: {att.timesSpoken} {att.timesSpoken === 1 ? 'time' : 'times'}</span>
              {att.lastSpokeAt > 0 && (
                <span className="flex items-center gap-1 text-[10px]">
                  <Clock size={10} />
                  {formatWait(att.lastSpokeAt)} ago
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
